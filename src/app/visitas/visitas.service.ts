import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, firstValueFrom } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { stampRtdbIdAfterPush } from '../core/utils/rtdb-push.util';
import { CurrentStaffService } from '../core/services/current-staff.service';
import { ClientesService } from '../clientes/clientes.service';
import { CajaService } from '../finanzas/caja.service';
import { CajaMetodoPago, CajaMovimientoFormData } from '../finanzas/caja.models';
import { InventarioService } from '../inventario/inventario.service';
import { lineasADevolver, marcarLineasDevueltas, montoDevolucion, reintegrosInventario } from './pos-devolucion.util';
import { Visita, VisitaFormData, VisitaLinea, VisitaLineaCategoria, VISITA_LINEA_A_CAJA } from './visitas.models';
import { agregarSaldoCliente, hoyLocalIsoDate, nuevaLineaId, recalcularVisita, roundMoney } from './visitas.util';
import { esClienteMostrador } from './visita-mostrador.util';
import { siguienteFolioTicketDia } from './folio-ticket-visita.util';

/** RTDB `push`/`update` rechaza `undefined`; la venta de mostrador no trae paciente. */
function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

@Injectable({ providedIn: 'root' })
export class VisitasService {
  private readonly path = 'Katzen/Visitas';

  constructor(
    private db: AngularFireDatabase,
    private currentStaff: CurrentStaffService,
    private clientesService: ClientesService,
    private cajaService: CajaService,
    private inventario: InventarioService
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
    const val = await firstValueFrom(this.db.object<Visita>(`${this.path}/${id}`).valueChanges().pipe(take(1)));
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
      atendidoPorUid: data.atendidoPorUid || undefined,
      atendidoPorNombre: data.atendidoPorNombre || undefined,
      esMostrador: data.esMostrador === true || esClienteMostrador(data.cliente_id) || undefined,
      activo: true,
      created_at: now,
      updated_at: now,
      created_by: staffId || 'system',
    };
    const ref = await this.db
      .list<Visita>(this.path)
      .push(omitUndefined(payload as unknown as Record<string, unknown>) as unknown as Visita);
    await stampRtdbIdAfterPush(this.db, this.path, ref.key);
    await this.vincularOrigenesDesdeLineas(ref.key!, lineas);
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
      estado: patch.estado ?? current.estado,
    });

    const nuevoEstado = patch.estado === 'cancelada' ? 'cancelada' : calc.estado;
    await this.db.object(`${this.path}/${id}`).update(
      omitUndefined({
        ...patch,
        lineas: mergedLineas,
        total: calc.total,
        pagado: calc.pagado,
        saldo: calc.saldo,
        estado: nuevoEstado,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
    );

    if (patch.lineas != null) {
      await this.vincularOrigenesDesdeLineas(id, mergedLineas);
    }

    if (nuevoEstado === 'cerrada') {
      await this.propagarCobroServiciosOrigen({
        ...current,
        ...patch,
        id,
        lineas: mergedLineas,
        estado: nuevoEstado,
        pagado: calc.pagado,
        saldo: calc.saldo,
        total: calc.total,
      });
    }

    await this.syncSaldoCliente(patch.cliente_id != null ? String(patch.cliente_id) : current.cliente_id);
    if (patch.cliente_id != null && patch.cliente_id !== current.cliente_id) {
      await this.syncSaldoCliente(current.cliente_id);
    }
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
      cantidad: linea.cantidad,
      pensionId: linea.pensionId,
      historialId: linea.historialId,
      movimientoInventarioId: linea.movimientoInventarioId,
    };
    await this.setLineas(id, [...(visita.lineas || []), next]);
  }

  /** Visita abierta/parcial del cliente en la fecha (sin crear). Spec 036. */
  async buscarVisitaAbiertaDelDia(clienteId: string, fecha?: string): Promise<Visita | null> {
    if (!clienteId) return null;
    const fechaIso = fecha || hoyLocalIsoDate();
    const lista = await firstValueFrom(this.getVisitasPorCliente(clienteId).pipe(take(1)));
    return (
      (lista || []).find(
        (v) => v.fecha === fechaIso && (v.estado === 'abierta' || v.estado === 'parcial') && v.activo !== false
      ) || null
    );
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
    const existing = await this.buscarVisitaAbiertaDelDia(opts.cliente_id, fecha);
    if (existing?.id) return existing;

    const id = await this.crearVisita({
      cliente_id: opts.cliente_id,
      cliente: opts.cliente,
      paciente_id: opts.paciente_id,
      paciente: opts.paciente,
      fecha,
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
    vacunaId?: string;
    historialId?: string;
    productoId?: string;
    movimientoInventarioId?: string;
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
      pensionId: opts.pensionId,
      vacunaId: opts.vacunaId,
      historialId: opts.historialId,
      productoId: opts.productoId,
      movimientoInventarioId: opts.movimientoInventarioId,
    });
    if (opts.paciente_id && !visita.paciente_id) {
      await this.db.object(`${this.path}/${visita.id}`).update({
        paciente_id: opts.paciente_id,
        paciente: opts.paciente || visita.paciente || '',
        updated_at: new Date().toISOString(),
      });
    }
    await this.marcarVisitaIdEnOrigen(visita.id!, opts);
    return { visitaId: visita.id!, lineaId };
  }

  /** Spec 045 — marca visitaId en baños/citas/etc. referenciados en líneas. */
  async vincularOrigenesDesdeLineas(visitaId: string, lineas: VisitaLinea[] | null | undefined): Promise<void> {
    for (const linea of lineas || []) {
      await this.marcarVisitaIdEnOrigen(visitaId, {
        banioId: linea.banioId,
        citaId: linea.citaId,
        pensionId: linea.pensionId,
        vacunaId: linea.vacunaId,
        historialId: linea.historialId,
        movimientoInventarioId: linea.movimientoInventarioId,
      });
    }
  }

  /** Spec 040 — vincula entidad origen al ticket (evita doble línea). */
  private async marcarVisitaIdEnOrigen(
    visitaId: string,
    opts: {
      citaId?: string;
      banioId?: string;
      pensionId?: string;
      vacunaId?: string;
      historialId?: string;
      movimientoInventarioId?: string;
    }
  ): Promise<void> {
    const now = new Date().toISOString();
    const patch = { visitaId, updated_at: now };
    if (opts.banioId) {
      await this.db.object(`Katzen/Banios/${opts.banioId}`).update(patch);
    }
    if (opts.citaId) {
      await this.db.object(`Katzen/Citas/${opts.citaId}`).update(patch);
    }
    if (opts.pensionId) {
      await this.db.object(`Katzen/Pension/Estancias/${opts.pensionId}`).update(patch);
    }
    if (opts.vacunaId) {
      await this.db.object(`Katzen/Vacunas/${opts.vacunaId}`).update(patch);
    }
    if (opts.historialId) {
      await this.db.object(`Katzen/Historiales_Clinicos/${opts.historialId}`).update(patch);
    }
    if (opts.movimientoInventarioId) {
      await this.db
        .object(`Katzen/Inventario/Movimientos/${opts.movimientoInventarioId}`)
        .update({ visitaId, updated_at: now });
    }
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

    const categoria = opts.categoria || (visita.lineas?.length === 1 ? visita.lineas[0].categoria : 'otro');

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
      categoria: VISITA_LINEA_A_CAJA[categoria] || 'otro',
    };

    const movId = await this.cajaService.crearMovimiento(form);
    const ids = [...(visita.cajaMovimientoIds || []), movId];
    const nuevoPagado = roundMoney(visita.pagado + monto);
    await this.actualizarVisita(visitaId, {
      pagado: nuevoPagado,
      cajaMovimientoIds: ids,
    });
    await this.asignarFolioSiFalta(visitaId);
    return movId;
  }

  /** Spec 071 — folio KV-YYYYMMDD-NNN al primer cobro. */
  async asignarFolioSiFalta(visitaId: string): Promise<string> {
    const visita = await this.getVisita(visitaId);
    if (!visita) throw new Error('Visita no encontrada');
    const ya = String(visita.folio || '').trim();
    if (ya) return ya;
    const fecha = visita.fecha || hoyLocalIsoDate();
    const todas = await firstValueFrom(this.getVisitas().pipe(take(1)));
    const existentes = (todas || [])
      .filter((v) => String(v.fecha || '') === fecha && String(v.folio || '').trim())
      .map((v) => String(v.folio));
    const folio = siguienteFolioTicketDia(fecha, existentes);
    if (folio) {
      await this.actualizarVisita(visitaId, { folio });
    }
    return folio;
  }

  /** Spec 064 — devolución: egreso de caja + reintegro de stock + marca de línea. */
  async devolverLineas(visitaId: string, lineaIds: string[], metodoPago: CajaMetodoPago = 'efectivo'): Promise<void> {
    const visita = await this.getVisita(visitaId);
    if (!visita) throw new Error('Visita no encontrada');
    if (visita.estado === 'cancelada') {
      throw new Error('La visita cancelada no admite devoluciones');
    }
    const sel = lineasADevolver(visita.lineas || [], lineaIds);
    if (!sel.length) {
      throw new Error('No hay líneas para devolver');
    }
    const monto = montoDevolucion(sel);
    const now = new Date().toISOString();
    for (const r of reintegrosInventario(sel)) {
      await this.inventario.registrarEntrada(
        r.productoId,
        r.cantidad,
        0,
        'Devolución de venta',
        undefined,
        `Visita ${visitaId}`
      );
    }
    const movId = await this.cajaService.crearMovimiento({
      tipo: 'egreso',
      monto,
      metodoPago,
      ivaDeclarado: false,
      concepto: `Devolución ticket ${visita.fecha} — ${visita.cliente || visita.cliente_id}`.slice(0, 120),
      fecha: visita.fecha || hoyLocalIsoDate(),
      clienteId: visita.cliente_id,
      visitaId,
      categoria: 'otro',
      notas: `Líneas: ${sel.map((l) => l.descripcion).join(', ')}`,
    });
    const lineas = marcarLineasDevueltas(
      visita.lineas || [],
      sel.map((l) => l.id),
      now
    );
    const ids = [...(visita.cajaMovimientoIds || []), movId];
    const nuevoPagado = roundMoney(Math.max(0, (visita.pagado || 0) - monto));
    await this.actualizarVisita(visitaId, {
      lineas,
      pagado: nuevoPagado,
      cajaMovimientoIds: ids,
    });
  }

  async bajaLogicaVisita(id: string): Promise<void> {
    const visita = await this.getVisita(id);
    if (!visita) return;
    await this.actualizarVisita(id, { activo: false, estado: 'cancelada', saldo: 0 });
  }

  async syncSaldoCliente(clienteId: string): Promise<number> {
    if (!clienteId || esClienteMostrador(clienteId)) return 0;
    const visitas = await firstValueFrom(this.getVisitasPorCliente(clienteId).pipe(take(1)));
    const saldo = agregarSaldoCliente(visitas || []);
    await this.clientesService.actualizarCliente(clienteId, { saldoPendiente: saldo });
    return saldo;
  }

  /**
   * Spec 039: al cerrar ticket, marca baños/citas/pensión origen como cobrados
   * (sin duplicar movimiento de caja en el servicio).
   */
  private async propagarCobroServiciosOrigen(visita: Visita): Promise<void> {
    if (!visita?.id || visita.estado !== 'cerrada') return;
    const now = new Date().toISOString();
    const lineas = visita.lineas || [];

    for (const linea of lineas) {
      if (linea.banioId) {
        await this.db.object(`Katzen/Banios/${linea.banioId}`).update({
          pagado: true,
          updated_at: now,
        });
      }
      if (linea.citaId) {
        await this.db.object(`Katzen/Citas/${linea.citaId}`).update({
          cobrada: true,
          cobradaEnVisitaId: visita.id,
          updated_at: now,
        });
      }
      if (linea.pensionId) {
        await this.db.object(`Katzen/Pension/Estancias/${linea.pensionId}`).update({
          cobradaEnVisitaId: visita.id,
          updated_at: now,
        });
      }
      if (linea.vacunaId) {
        await this.db.object(`Katzen/Vacunas/${linea.vacunaId}`).update({
          cobradaEnVisitaId: visita.id,
          updated_at: now,
        });
      }
      if (linea.historialId) {
        await this.db.object(`Katzen/Historiales_Clinicos/${linea.historialId}`).update({
          cobradaEnVisitaId: visita.id,
          cobrada: true,
          updated_at: now,
        });
      }
      if (linea.movimientoInventarioId) {
        const cajaIds = visita.cajaMovimientoIds || [];
        const cajaId = cajaIds.length ? cajaIds[cajaIds.length - 1] : undefined;
        const patch: Record<string, string> = { updated_at: now };
        if (cajaId) patch['cajaMovimientoId'] = cajaId;
        await this.db.object(`Katzen/Inventario/Movimientos/${linea.movimientoInventarioId}`).update(patch);
      }
    }
  }

  private normalize(id: string, raw: Visita): Visita {
    const lineas = Array.isArray(raw?.lineas) ? raw.lineas : [];
    const calc = recalcularVisita({
      lineas,
      pagado: Number(raw?.pagado) || 0,
      estado: raw?.estado,
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
      activo: raw?.activo !== false,
    };
  }
}
