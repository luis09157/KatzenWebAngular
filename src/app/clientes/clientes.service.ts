import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, firstValueFrom } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Cliente } from '../core/models';
import { LoggerService } from '../core/logger.service';
import { SucursalContextService } from '../core/services/sucursal-context.service';
import { RtdbPagedListService, RtdbPageResult } from '../core/services/rtdb-paged-list.service';
import { rtdbFechaAhora } from '../core/utils/rtdb-date.util';
import {
  calcularClienteEstadisticas,
  calcularClientesConPacientes,
  ClienteEstadisticas,
} from '../core/utils/entity-stats.util';
import { pacientePerteneceACliente } from '../core/utils/paciente-cliente.util';
import { hydrateCliente } from '../core/utils/cliente-hydrate.util';
import { mapRtdbRow } from '../core/utils/rtdb-row.util';
import { FolioExpedienteService } from '../core/services/folio-expediente.service';

export interface MascotaActivaCliente {
  id: string;
  nombre: string;
}

export interface BajaClienteCascadaResult {
  mascotasDesactivadas: number;
  mascotas: string[];
  citasCanceladas: number;
  relacionadosDesactivados: number;
  portalRevocado: boolean;
  portalRevokeError?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClientesService {
  private readonly pageSizeDefault = 100;

  constructor(
    private db: AngularFireDatabase,
    private logger: LoggerService,
    private sucursalContext: SucursalContextService,
    private pagedList: RtdbPagedListService,
    private folios: FolioExpedienteService
  ) {}

  /** Carga paginada (más recientes primero). */
  getClientesPage(pageSize = this.pageSizeDefault, endBeforeKey?: string | null): Observable<RtdbPageResult<Cliente>> {
    return this.pagedList
      .fetchPage<Cliente>('Katzen/Cliente', pageSize, endBeforeKey, (c) => c.activo !== false)
      .pipe(
        map((page) => ({
          ...page,
          items: page.items
            .map((c) => hydrateCliente(c.id, c) as Cliente & { id: string })
            .sort((a, b) => {
              const fechaA = new Date(
                (a as any).fecha_registro || (a as any).fecha_creacion || (a as any).created_at || 0
              );
              const fechaB = new Date(
                (b as any).fecha_registro || (b as any).fecha_creacion || (b as any).created_at || 0
              );
              return fechaB.getTime() - fechaA.getTime();
            }),
        }))
      );
  }

  getClientes(): Observable<Cliente[]> {
    return this.db
      .list('Katzen/Cliente')
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions
            .map((a) => hydrateCliente(a.key, a.payload.val()))
            .filter((cliente: Cliente) => cliente.activo !== false)
            .sort((a, b) => {
              const fechaA = new Date(
                (a as any).fecha_registro || (a as any).fecha_creacion || (a as any).created_at || 0
              );
              const fechaB = new Date(
                (b as any).fecha_registro || (b as any).fecha_creacion || (b as any).created_at || 0
              );
              return fechaB.getTime() - fechaA.getTime();
            })
        )
      );
  }

  /** Totales reales en RTDB (toda la colección activa), independiente de la paginación de la tabla. */
  getEstadisticas(sucursalId: string): Observable<ClienteEstadisticas> {
    return this.getClientes().pipe(map((clientes) => calcularClienteEstadisticas(clientes, sucursalId)));
  }

  getCliente(id: string): Observable<Cliente | null> {
    return this.db
      .object(`Katzen/Cliente/${id}`)
      .valueChanges()
      .pipe(map((val) => (val != null && typeof val === 'object' ? hydrateCliente(id, val) : null)));
  }

  async guardarCliente(cliente: Cliente & { id?: string }): Promise<string> {
    const original = cliente;
    cliente = this.sucursalContext.stamp(cliente as Record<string, unknown>) as Cliente & { id?: string };
    const isNew = !cliente.id || String(cliente.id).trim() === '';
    if (isNew) {
      const id = crypto.randomUUID();
      cliente.id = id;
      original.id = id;
      cliente.activo = true;
      cliente.fecha_registro = rtdbFechaAhora();
      try {
        const folio = await this.folios.reservarSiguiente();
        cliente.expediente = folio;
        original.expediente = folio;
        await this.db.object(`Katzen/Cliente/${id}`).set(cliente);
        const unico = await this.folios.asegurarUnico(id, folio, async (siguiente) => {
          await this.db.object(`Katzen/Cliente/${id}`).update({ expediente: siguiente });
        });
        cliente.expediente = unico;
        original.expediente = unico;
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
      fechaBaja: rtdbFechaAhora(),
    });
  }

  /** Mascotas activas de un dueño, para el aviso antes de borrar. */
  async mascotasActivasDeCliente(clienteId: string): Promise<MascotaActivaCliente[]> {
    const mascotas = await this.filasDe('Katzen/Mascota');
    return mascotas
      .filter(
        (m) =>
          m['activo'] !== false &&
          pacientePerteneceACliente(
            { cliente_id: String(m['cliente_id'] || ''), idCliente: String(m['idCliente'] || '') },
            clienteId
          )
      )
      .map((m) => ({
        id: m.id,
        nombre: String(m['nombre'] || 'Sin nombre').trim() || 'Sin nombre',
      }));
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

    const clienteSnap = await firstValueFrom(
      this.db.object(`Katzen/Cliente/${clienteId}`).valueChanges().pipe(take(1))
    );
    const cliente = (clienteSnap || {}) as Record<string, unknown>;
    const authUid = String(cliente['authUid'] || '').trim();

    await this.db.object(`Katzen/Cliente/${clienteId}`).update({
      activo: false,
      portalActivo: false,
      fechaBaja,
    });

    type MascotaRow = { id: string; activo?: unknown; cliente_id?: string; idCliente?: string; [key: string]: unknown };
    const mascotas = await firstValueFrom(
      this.db
        .list('Katzen/Mascota')
        .snapshotChanges()
        .pipe(
          take(1),
          map((actions) =>
            actions.map((a) => {
              const val = (a.payload.val() || {}) as Record<string, unknown>;
              return mapRtdbRow<MascotaRow>(a.key, val);
            })
          )
        )
    );
    const mascotasCliente = mascotas.filter(
      (m) =>
        m['activo'] !== false &&
        pacientePerteneceACliente(
          { cliente_id: String(m['cliente_id'] || ''), idCliente: String(m['idCliente'] || '') },
          clienteId
        )
    );
    const mascotaIds = new Set(mascotasCliente.map((m) => m.id));
    await this.marcarInactivos(
      'Katzen/Mascota',
      mascotasCliente.map((m) => m.id),
      fechaBaja
    );

    const citas = await this.filasDe('Katzen/Citas');
    const citasDelCliente = citas.filter((c) => c['activo'] !== false && this.ligadoACliente(c, clienteId, mascotaIds));
    const updatesCitas: Record<string, unknown> = {};
    for (const cita of citasDelCliente) {
      const estado = String(cita['estado'] || '').toLowerCase();
      updatesCitas[`Katzen/Citas/${cita.id}/activo`] = false;
      updatesCitas[`Katzen/Citas/${cita.id}/fecha_eliminacion`] = fechaBaja;
      if (estado !== 'cancelada' && estado !== 'completada') {
        updatesCitas[`Katzen/Citas/${cita.id}/estado`] = 'cancelada';
        updatesCitas[`Katzen/Citas/${cita.id}/motivo_cancelacion`] = 'Cliente borrado (cascada administrativa)';
      }
    }
    await this.aplicarUpdates(updatesCitas);

    const nodosRelacionados = [
      'Katzen/Banios',
      'Katzen/Historiales_Clinicos',
      'Katzen/Vacunas',
      'Katzen/Recordatorios',
      'Katzen/Consentimientos',
      'Katzen/Pension/Estancias',
      'Katzen/Visitas',
    ];
    let relacionadosDesactivados = 0;
    for (const path of nodosRelacionados) {
      const filas = await this.filasDe(path);
      const ids = filas
        .filter((fila) => fila['activo'] !== false && this.ligadoACliente(fila, clienteId, mascotaIds))
        .map((fila) => fila.id);
      relacionadosDesactivados += ids.length;
      await this.marcarInactivos(path, ids, fechaBaja);
    }

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
      mascotas: mascotasCliente.map((m) => String(m['nombre'] || 'Sin nombre').trim() || 'Sin nombre'),
      citasCanceladas: citasDelCliente.length,
      relacionadosDesactivados,
      portalRevocado,
      portalRevokeError,
    };
  }

  private async filasDe(path: string): Promise<Array<Record<string, unknown> & { id: string }>> {
    try {
      return await firstValueFrom(
        this.db
          .list(path)
          .snapshotChanges()
          .pipe(
            take(1),
            map((actions) => actions.map((a) => mapRtdbRow(a.key, (a.payload.val() || {}) as Record<string, unknown>)))
          )
      );
    } catch (error) {
      this.logger.warn(`Cascada cliente: no se pudo leer ${path}`, error);
      return [];
    }
  }

  private ligadoACliente(fila: Record<string, unknown>, clienteId: string, mascotaIds: Set<string>): boolean {
    const cid = String(fila['cliente_id'] || fila['idCliente'] || '');
    if (cid && cid === clienteId) {
      return true;
    }
    const pid = String(fila['paciente_id'] || fila['idPaciente'] || fila['mascota_id'] || '');
    return !!pid && mascotaIds.has(pid);
  }

  private async marcarInactivos(path: string, ids: string[], fechaBaja: string): Promise<void> {
    const updates: Record<string, unknown> = {};
    for (const id of ids) {
      if (!id) continue;
      updates[`${path}/${id}/activo`] = false;
      updates[`${path}/${id}/fechaBaja`] = fechaBaja;
    }
    await this.aplicarUpdates(updates);
  }

  private async aplicarUpdates(updates: Record<string, unknown>): Promise<void> {
    const entries = Object.entries(updates);
    for (let i = 0; i < entries.length; i += 150) {
      const lote = Object.fromEntries(entries.slice(i, i + 150));
      await this.db.database.ref().update(lote);
    }
  }

  reactivarCliente(id: string) {
    return this.db.object(`Katzen/Cliente/${id}`).update({
      activo: true,
      fechaBaja: '',
    });
  }
}
