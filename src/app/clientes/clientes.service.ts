import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, firstValueFrom } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Cliente } from '../core/models';
import { LoggerService } from '../core/logger.service';
import { SucursalContextService } from '../core/services/sucursal-context.service';
import { RtdbPagedListService, RtdbPageResult } from '../core/services/rtdb-paged-list.service';
import { rtdbFechaAhora } from '../core/utils/rtdb-date.util';
import { calcularClienteEstadisticas, calcularClientesConPacientes, ClienteEstadisticas } from '../core/utils/entity-stats.util';
import { pacientePerteneceACliente } from '../core/utils/paciente-cliente.util';

export interface BajaClienteCascadaResult {
  mascotasDesactivadas: number;
  citasCanceladas: number;
  portalRevocado: boolean;
  portalRevokeError?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private readonly pageSizeDefault = 100;

  constructor(
    private db: AngularFireDatabase,
    private logger: LoggerService,
    private sucursalContext: SucursalContextService,
    private pagedList: RtdbPagedListService
  ) {}

  /** Carga paginada (más recientes primero). */
  getClientesPage(
    pageSize = this.pageSizeDefault,
    endBeforeKey?: string | null
  ): Observable<RtdbPageResult<Cliente>> {
    return this.pagedList.fetchPage<Cliente>(
      'Katzen/Cliente',
      pageSize,
      endBeforeKey,
      (c) => c.activo !== false
    ).pipe(
      map(page => ({
        ...page,
        items: [...page.items].sort((a, b) => {
          const fechaA = new Date((a as any).fecha_registro || (a as any).fecha_creacion || (a as any).created_at || 0);
          const fechaB = new Date((b as any).fecha_registro || (b as any).fecha_creacion || (b as any).created_at || 0);
          return fechaB.getTime() - fechaA.getTime();
        })
      }))
    );
  }

  getClientes(): Observable<Cliente[]> {
    return this.db.list('Katzen/Cliente').snapshotChanges().pipe(
      map(actions => actions
        .map(a => {
          const clienteData = a.payload.val() as Record<string, unknown>;
          return {
            id: a.key,
            ...clienteData
          } as Cliente;
        })
        .filter((cliente: Cliente) => cliente.activo !== false)
        .sort((a, b) => {
          const fechaA = new Date((a as any).fecha_registro || (a as any).fecha_creacion || (a as any).created_at || 0);
          const fechaB = new Date((b as any).fecha_registro || (b as any).fecha_creacion || (b as any).created_at || 0);
          return fechaB.getTime() - fechaA.getTime();
        })
      )
    );
  }

  /** Totales reales en RTDB (toda la colección activa), independiente de la paginación de la tabla. */
  getEstadisticas(sucursalId: string): Observable<ClienteEstadisticas> {
    return this.getClientes().pipe(
      map(clientes => calcularClienteEstadisticas(clientes, sucursalId))
    );
  }

  getCliente(id: string): Observable<Cliente | null> {
    return this.db.object(`Katzen/Cliente/${id}`).valueChanges().pipe(
      map(val => (val != null && typeof val === 'object' ? { id, ...(val as Record<string, unknown>) } as Cliente : null))
    );
  }

  async guardarCliente(cliente: Cliente & { id?: string }): Promise<string> {
    cliente = this.sucursalContext.stamp(cliente as Record<string, unknown>) as Cliente & { id?: string };
    const isNew = !cliente.id || String(cliente.id).trim() === '';
    if (isNew) {
      const id = crypto.randomUUID();
      cliente.id = id;
      cliente.activo = true;
      cliente.fecha_registro = rtdbFechaAhora();
      try {
        await this.db.object(`Katzen/Cliente/${id}`).set(cliente);
        return id;
      } catch (error) {
        this.logger.error('❌ [SERVICIO] Error al crear cliente en Firebase:', error);
        throw error;
      }
    }

    try {
      await this.db.object(`Katzen/Cliente/${cliente.id}`).set(cliente);
      return String(cliente.id);
    } catch (error) {
      this.logger.error('❌ [SERVICIO] Error al actualizar cliente:', error);
      throw error;
    }
  }

  actualizarCliente(id: string, cambios: Partial<Cliente>) {
    return this.db.object(`Katzen/Cliente/${id}`).update(cambios);
  }

  // Baja lógica: marcar como inactivo (update parcial — no borra datos)
  bajaLogicaCliente(id: string) {
    return this.db.object(`Katzen/Cliente/${id}`).update({
      activo: false,
      portalActivo: false,
      fechaBaja: rtdbFechaAhora()
    });
  }

  /**
   * Baja lógica en cascada (decisión #22): cliente + mascotas + citas futuras/pendientes.
   * Portal: desactiva en RTDB; revocación Auth vía callable opcional (admin).
   */
  async bajaLogicaClienteCascada(
    clienteId: string,
    revokePortalFn?: (id: string) => Promise<unknown>
  ): Promise<BajaClienteCascadaResult> {
    const fechaBaja = rtdbFechaAhora();
    const hoy = fechaBaja.substring(0, 10);

    const clienteSnap = await firstValueFrom(
      this.db.object(`Katzen/Cliente/${clienteId}`).valueChanges().pipe(take(1))
    );
    const cliente = (clienteSnap || {}) as Record<string, unknown>;
    const authUid = String(cliente['authUid'] || '').trim();

    await this.db.object(`Katzen/Cliente/${clienteId}`).update({
      activo: false,
      portalActivo: false,
      fechaBaja
    });

    type MascotaRow = { id: string; activo?: unknown; cliente_id?: string; idCliente?: string; [key: string]: unknown };
    const mascotas = await firstValueFrom(
      this.db.list('Katzen/Mascota').snapshotChanges().pipe(
        take(1),
        map(actions =>
          actions.map(a => {
            const val = (a.payload.val() || {}) as Record<string, unknown>;
            return { id: a.key as string, ...val } as MascotaRow;
          })
        )
      )
    );
    const mascotasCliente = mascotas.filter(
      m => m.activo !== false && pacientePerteneceACliente(m, clienteId)
    );
    await Promise.all(
      mascotasCliente.map(m =>
        this.db.object(`Katzen/Mascota/${m.id}`).update({
          activo: false,
          fechaBaja
        })
      )
    );

    const citas = await firstValueFrom(
      this.db.list('Katzen/Citas').snapshotChanges().pipe(
        take(1),
        map(actions =>
          actions.map(a => {
            const val = (a.payload.val() || {}) as Record<string, unknown>;
            return { id: a.key as string, ...val };
          })
        )
      )
    );
    const citasACancelar = citas.filter(c => {
      if (c['activo'] === false) return false;
      const cid = String(c['cliente_id'] || c['idCliente'] || '');
      if (cid !== clienteId) return false;
      const estado = String(c['estado'] || '').toLowerCase();
      if (estado === 'cancelada' || estado === 'completada') return false;
      const fecha = String(c['fecha'] || c['fecha_hora'] || '').substring(0, 10);
      return !fecha || fecha >= hoy;
    });
    await Promise.all(
      citasACancelar.map(c =>
        this.db.object(`Katzen/Citas/${c.id}`).update({
          activo: false,
          estado: 'cancelada',
          motivo_cancelacion: 'Cliente borrado (cascada administrativa)',
          fecha_eliminacion: fechaBaja
        })
      )
    );

    let portalRevocado = false;
    let portalRevokeError: string | undefined;
    if (authUid && revokePortalFn) {
      try {
        await revokePortalFn(clienteId);
        portalRevocado = true;
      } catch (err: unknown) {
        portalRevokeError = err instanceof Error ? err.message : 'No se pudo revocar el portal';
        this.logger.warn('Cascada cliente: portal RTDB desactivado; revoke Auth falló o sin permiso', err);
      }
    }

    return {
      mascotasDesactivadas: mascotasCliente.length,
      citasCanceladas: citasACancelar.length,
      portalRevocado,
      portalRevokeError
    };
  }

  reactivarCliente(id: string) {
    return this.db.object(`Katzen/Cliente/${id}`).update({
      activo: true,
      fechaBaja: ''
    });
  }


} 