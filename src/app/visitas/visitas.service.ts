import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, firstValueFrom } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { stampRtdbIdAfterPush } from '../core/utils/rtdb-push.util';
import { CurrentStaffService } from '../core/services/current-staff.service';
import { ClientesService } from '../clientes/clientes.service';
import { CajaService } from '../finanzas/caja.service';
import { CajaMetodoPago, CajaMovimientoFormData } from '../finanzas/caja.models';
import {
  Visita,
  VisitaFormData,
  VisitaLinea,
  VisitaLineaCategoria,
  VISITA_LINEA_A_CAJA
} from './visitas.models';
import {
  agregarSaldoCliente,
  hoyLocalIsoDate,
  nuevaLineaId,
  recalcularVisita,
  roundMoney
} from './visitas.util';

@Injectable({ providedIn: 'root' })
export class VisitasService {
  private readonly path = 'Katzen/Visitas';

  constructor(
    private db: AngularFireDatabase,
    private currentStaff: CurrentStaffService,
    private clientesService: ClientesService,
    private cajaService: CajaService
  ) {}

  getVisitas(): Observable<Visita[]> {
    return this.db
      .list<Visita>(this.path)
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes
            .map((c) => this.normalize(c.payload.key!, c.payload.val() as Visita))
            .filter((v) => v.activo !== false)
            .sort(
              (a, b) =>
                String(b.fecha || '').localeCompare(String(a.fecha || '')) ||
                String(b.created_at || '').localeCompare(String(a.created_at || ''))
            )
        )
      );
  }

  getVisitasPorCliente(clienteId: string): Observable<Visita[]> {
    return this.db
      .list<Visita>(this.path, (ref) => ref.orderByChild('cliente_id').equalTo(clienteId))
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes
            .map((c) => this.normalize(c.payload.key!, c.payload.val() as Visita))
            .filter((v) => v.activo !== false)
            .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')))
        )
      );
  }

  async getVisita(id: string): Promise<Visita | null> {
    const val = await firstValueFrom(
      this.db.object<Visita>(`${this.path}/${id}`).valueChanges().pipe(take(1))
    );
    if (!val) return null;
    return this.normalize(id, val);
  }

  async crearVisita(data: VisitaFormData): Promise<string> {
    const staffId = await this.currentStaff.getStaffId();
    const now = new Date().toISOString();
    const lineas = Array.isArray(data.lineas) ? data.lineas : [];
    const calc = recalcularVisita({ lineas, pagado: 0 });
    const payload: Visita = {
      cliente_id: data.cliente_id,
      cliente: data.cliente || '',
      paciente_id: data.paciente_id || undefined,
      paciente: data.paciente || '',
      fecha: data.fecha || hoyLocalIsoDate(),
      estado: calc.estado,
      lineas,
      total: calc.total,
      pagado: 0,
      saldo: calc.saldo,
      cajaMovimientoIds: [],
      notas: data.notas || '',
      activo: true,
      created_at: now,
      updated_at: now,
      created_by: staffId || 'system'
    };
    const ref = await this.db.list<Visita>(this.path).push(payload);
    await stampRtdbIdAfterPush(this.db, this.path, ref.key);
    await this.syncSaldoCliente(data.cliente_id);
    return ref.key!;
  }

  async actualizarVisita(id: string, patch: Partial<Visita>): Promise<void> {
    const current = await this.getVisita(id);
    if (!current) throw new Error('Visita no encontrada');

    const mergedLineas = patch.lineas != null ? patch.lineas : current.lineas;
    const mergedPagado = patch.pagado != null ? patch.pagado : current.pagado;
    const calc = recalcularVisita({
      lineas: mergedLineas,
      pagado: mergedPagado,
      estado: patch.estado ?? current.estado
    });

    await this.db.object(`${this.path}/${id}`).update({
      ...patch,
      lineas: mergedLineas,
      total: calc.total,
      pagado: calc.pagado,
      saldo: calc.saldo,
      estado: patch.estado === 'cancelada' ? 'cancelada' : calc.estado,
      updated_at: new Date().toISOString()
    });

    await this.syncSaldoCliente(current.cliente_id);
  }

  async setLineas(id: string, lineas: VisitaLinea[]): Promise<void> {
    await this.actualizarVisita(id, { lineas });
  }

  async agregarLinea(id: string, linea: Omit<VisitaLinea, 'id'> & { id?: string }): Promise<void> {
    const visita = await this.getVisita(id);
    if (!visita) throw new Error('Visita no encontrada');
    const next: VisitaLinea = {
      id: linea.id || nuevaLineaId(),
      descripcion: String(linea.descripcion || '').trim(),
      monto: roundMoney(linea.monto),
      categoria: linea.categoria,
      citaId: linea.citaId,
      banioId: linea.banioId,
      vacunaId: linea.vacunaId,
      productoId: linea.productoId,
      pensionId: linea.pensionId
    };
    await this.setLineas(id, [...(visita.lineas || []), next]);
  }

  /**
   * Busca visita abierta/parcial del cliente en la fecha; si no existe, crea una.
   */
  async obtenerOCrearVisitaDelDia(opts: {
    cliente_id: string;
    cliente?: string;
    paciente_id?: string;
    paciente?: string;
    fecha?: string;
  }): Promise<Visita> {
    const fecha = opts.fecha || hoyLocalIsoDate();
    const lista = await firstValueFrom(this.getVisitasPorCliente(opts.cliente_id).pipe(take(1)));
    const existing = (lista || []).find(
      (v) =>
        v.fecha === fecha &&
        (v.estado === 'abierta' || v.estado === 'parcial') &&
        v.activo !== false
    );
    if (existing?.id) return existing;

    const id = await this.crearVisita({
      cliente_id: opts.cliente_id,
      cliente: opts.cliente,
      paciente_id: opts.paciente_id,
      paciente: opts.paciente,
      fecha
    });
    const created = await this.getVisita(id);
    if (!created) throw new Error('No se pudo crear la visita');
    return created;
  }

  /**
   * Agrega línea desde cita/baño y marca visitaId en origen vía callback.
   */
  async agregarServicioAVisita(opts: {
    cliente_id: string;
    cliente?: string;
    paciente_id?: string;
    paciente?: string;
    descripcion: string;
    monto: number;
    categoria: VisitaLineaCategoria;
    citaId?: string;
    banioId?: string;
    pensionId?: string;
    fecha?: string;
  }): Promise<{ visitaId: string; lineaId: string }> {
    const visita = await this.obtenerOCrearVisitaDelDia(opts);
    const lineaId = nuevaLineaId();
    await this.agregarLinea(visita.id!, {
      id: lineaId,
      descripcion: opts.descripcion,
      monto: opts.monto,
      categoria: opts.categoria,
      citaId: opts.citaId,
      banioId: opts.banioId,
      pensionId: opts.pensionId
    });
    if (opts.paciente_id && !visita.paciente_id) {
      await this.db.object(`${this.path}/${visita.id}`).update({
        paciente_id: opts.paciente_id,
        paciente: opts.paciente || visita.paciente || '',
        updated_at: new Date().toISOString()
      });
    }
    return { visitaId: visita.id!, lineaId };
  }

  async registrarPago(
    visitaId: string,
    opts: {
      monto: number;
      metodoPago: CajaMetodoPago;
      ivaDeclarado?: boolean;
      notas?: string;
      categoria?: VisitaLineaCategoria;
    }
  ): Promise<string> {
    const visita = await this.getVisita(visitaId);
    if (!visita) throw new Error('Visita no encontrada');
    if (visita.estado === 'cancelada' || visita.estado === 'cerrada') {
      throw new Error('La visita no admite más cobros');
    }
    const monto = roundMoney(opts.monto);
    if (monto <= 0) throw new Error('El monto debe ser mayor a 0');
    if (monto > roundMoney(visita.saldo) + 0.001) {
      throw new Error('El monto no puede superar el saldo pendiente');
    }

    const categoria =
      opts.categoria ||
      (visita.lineas?.length === 1 ? visita.lineas[0].categoria : 'otro');

    const form: CajaMovimientoFormData = {
      tipo: 'ingreso',
      monto,
      metodoPago: opts.metodoPago,
      ivaDeclarado: !!opts.ivaDeclarado,
      concepto: `Visita ${visita.fecha} — ${visita.cliente || visita.cliente_id}`.slice(0, 120),
      fecha: visita.fecha || hoyLocalIsoDate(),
      clienteId: visita.cliente_id,
      visitaId,
      notas: opts.notas,
      categoria: VISITA_LINEA_A_CAJA[categoria] || 'otro'
    };

    const movId = await this.cajaService.crearMovimiento(form);
    const ids = [...(visita.cajaMovimientoIds || []), movId];
    const nuevoPagado = roundMoney(visita.pagado + monto);
    await this.actualizarVisita(visitaId, {
      pagado: nuevoPagado,
      cajaMovimientoIds: ids
    });
    return movId;
  }

  async bajaLogicaVisita(id: string): Promise<void> {
    const visita = await this.getVisita(id);
    if (!visita) return;
    await this.actualizarVisita(id, { activo: false, estado: 'cancelada', saldo: 0 });
  }

  async syncSaldoCliente(clienteId: string): Promise<number> {
    if (!clienteId) return 0;
    const visitas = await firstValueFrom(this.getVisitasPorCliente(clienteId).pipe(take(1)));
    const saldo = agregarSaldoCliente(visitas || []);
    await this.clientesService.actualizarCliente(clienteId, { saldoPendiente: saldo });
    return saldo;
  }

  private normalize(id: string, raw: Visita): Visita {
    const lineas = Array.isArray(raw?.lineas) ? raw.lineas : [];
    const calc = recalcularVisita({
      lineas,
      pagado: Number(raw?.pagado) || 0,
      estado: raw?.estado
    });
    return {
      ...raw,
      id,
      lineas,
      total: calc.total,
      pagado: calc.pagado,
      saldo: calc.saldo,
      estado: raw?.estado === 'cancelada' ? 'cancelada' : calc.estado,
      cajaMovimientoIds: Array.isArray(raw?.cajaMovimientoIds) ? raw.cajaMovimientoIds : [],
      activo: raw?.activo !== false
    };
  }
}
