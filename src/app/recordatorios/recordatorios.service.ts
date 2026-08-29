import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map, firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { stampRtdbIdAfterPush } from '../core/utils/rtdb-push.util';
import {
  VacunaRefuerzoInput,
  buildDescripcionRecordatorioRefuerzo,
  buildTituloRecordatorioRefuerzo,
  debeAsegurarRecordatorioRefuerzo,
  encontrarRecordatorioEquivalente,
  resolverFechaRecordatorioRefuerzo
} from '../vacunas/vacuna-recordatorio.util';

export type AsegurarRefuerzoResultado =
  | { action: 'created'; recordatorioId: string; fechaLabel: string }
  | { action: 'updated'; recordatorioId: string; fechaLabel: string }
  | { action: 'skipped'; reason: 'sin_fecha' | 'sin_paciente' | 'equivalente' };

@Injectable({
  providedIn: 'root'
})
export class RecordatoriosService {
  constructor(private db: AngularFireDatabase) {}

  // Obtener todos los recordatorios con sus IDs
  getRecordatorios(): Observable<any[]> {
    return this.db.list('Katzen/Recordatorios').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(r => r.activo !== false)
          .sort((a, b) => {
            const fechaA = new Date(a.fecha_creacion || a.created_at || a.fecha_hora_recordatorio || 0);
            const fechaB = new Date(b.fecha_creacion || b.created_at || b.fecha_hora_recordatorio || 0);
            return fechaB.getTime() - fechaA.getTime(); // Más nuevo arriba
          })
      )
    );
  }

  // Obtener recordatorios por paciente_id
  getRecordatoriosPorPaciente(pacienteId: string): Observable<any[]> {
    return this.db.list('Katzen/Recordatorios', ref =>
      ref.orderByChild('paciente_id').equalTo(pacienteId)
    ).snapshotChanges().pipe(
      take(1),
      map(changes =>
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(r => r.paciente_id === pacienteId && r.activo !== false)
          .sort((a, b) => {
            const fechaA = new Date(a.fecha_creacion || a.created_at || a.fecha_hora_recordatorio || 0);
            const fechaB = new Date(b.fecha_creacion || b.created_at || b.fecha_hora_recordatorio || 0);
            return fechaB.getTime() - fechaA.getTime();
          })
      )
    );
  }

  // Obtener un recordatorio por id
  getRecordatorio(id: string): Observable<any> {
    return this.db.object(`Katzen/Recordatorios/${id}`).valueChanges().pipe(
      map(recordatorio => recordatorio ? { id, ...(recordatorio as any) } : null)
    );
  }

  // Crear nuevo recordatorio
  async crearRecordatorio(recordatorio: any): Promise<any> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // Verificar si ya existe un recordatorio similar para evitar duplicados
    const recordatoriosExistentes = await firstValueFrom(this.getRecordatoriosPorPaciente(recordatorio.paciente_id));
    
    if (recordatoriosExistentes) {
      const duplicado = recordatoriosExistentes.find(r => 
        r.titulo === recordatorio.titulo &&
        r.fecha_hora_recordatorio === recordatorio.fecha_hora_recordatorio &&
        r.tipo === recordatorio.tipo &&
        r.activo !== false
      );
      
      if (duplicado) {
        throw new Error('Ya existe un recordatorio similar para este paciente');
      }
    }
    
    const nuevoRecordatorio = {
      ...recordatorio,
      created_at: timestamp,
      updated_at: timestamp,
      fecha_creacion: timestamp,
      activo: true
    };
    
    try {
      const ref = await this.db.list('Katzen/Recordatorios').push(nuevoRecordatorio);
      await stampRtdbIdAfterPush(this.db, 'Katzen/Recordatorios', ref.key);
      return ref;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar recordatorio existente
  actualizarRecordatorio(id: string, cambios: any): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    const datosActualizados = {
      ...cambios,
      updated_at: timestamp
    };

    return this.db.object(`Katzen/Recordatorios/${id}`).update(datosActualizados);
  }

  /** Archiva recordatorio (baja lógica). No borra el nodo RTDB. */
  eliminarRecordatorio(id: string): Promise<void> {
    return this.bajaLogicaRecordatorio(id);
  }

  // Baja lógica: marcar como inactivo
  bajaLogicaRecordatorio(id: string): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return this.db.object(`Katzen/Recordatorios/${id}`).update({ 
      activo: false,
      updated_at: timestamp 
    });
  }

  // Restaurar recordatorio
  restaurarRecordatorio(id: string): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return this.db.object(`Katzen/Recordatorios/${id}`).update({ 
      activo: true,
      updated_at: timestamp 
    });
  }

  // Marcar recordatorio como completado
  marcarCompletado(id: string): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return this.db.object(`Katzen/Recordatorios/${id}`).update({ 
      estado: 'completado',
      fecha_completado: timestamp,
      updated_at: timestamp 
    });
  }

  // Marcar recordatorio como pendiente
  marcarPendiente(id: string): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return this.db.object(`Katzen/Recordatorios/${id}`).update({ 
      estado: 'pendiente',
      fecha_completado: null,
      updated_at: timestamp 
    });
  }

  /**
   * Spec 033: asegura un recordatorio pendiente de refuerzo enlazado a la vacuna.
   * No lanza si hay equivalente: actualiza o skip. Fallos de red sí propagan.
   */
  async asegurarRefuerzoDesdeVacuna(
    vacuna: VacunaRefuerzoInput & { id?: string }
  ): Promise<AsegurarRefuerzoResultado> {
    const pacienteId = String(vacuna.idPaciente || vacuna.paciente_id || '').trim();
    if (!pacienteId) {
      return { action: 'skipped', reason: 'sin_paciente' };
    }
    if (!debeAsegurarRecordatorioRefuerzo(vacuna)) {
      return { action: 'skipped', reason: 'sin_fecha' };
    }

    const fecha = resolverFechaRecordatorioRefuerzo(vacuna)!;
    const titulo = buildTituloRecordatorioRefuerzo(vacuna);
    const descripcion = buildDescripcionRecordatorioRefuerzo(vacuna, fecha);
    const vacunaId = String(vacuna.id || '').trim() || undefined;
    const clienteId = String(vacuna.idCliente || vacuna.cliente_id || '').trim() || undefined;

    const existentes = (await firstValueFrom(
      this.getRecordatoriosPorPaciente(pacienteId)
    )) as Array<Record<string, unknown>>;

    const equivalente = encontrarRecordatorioEquivalente(
      existentes as any[],
      {
        vacunaId,
        pacienteId,
        dayKey: fecha.dayKey,
        titulo
      }
    );

    const payloadBase = {
      titulo,
      descripcion,
      tipo: 'vacuna',
      fecha_hora_recordatorio: fecha.isoLocal,
      fecha_recordatorio: fecha.isoLocal,
      estado: 'pendiente',
      prioridad: 'alta',
      paciente_id: pacienteId,
      ...(clienteId ? { cliente_id: clienteId } : {}),
      ...(vacunaId
        ? { vacunaId, vacuna_relacionada_id: vacunaId }
        : {}),
      origen: 'vacuna_auto',
      skipPushOnCreate: true,
      notas: `Generado automáticamente desde vacuna${vacuna.dosis ? ` (${vacuna.dosis})` : ''}.`
    };

    if (equivalente?.id) {
      const sameDay =
        String(equivalente.fecha_hora_recordatorio || equivalente.fecha_recordatorio || '')
          .slice(0, 10) === fecha.dayKey &&
        equivalente.titulo === titulo;
      if (
        sameDay &&
        (equivalente.vacunaId === vacunaId ||
          equivalente.vacuna_relacionada_id === vacunaId ||
          !vacunaId)
      ) {
        // Ya equivalente exacto — opcionalmente refuerza enlaces
        if (vacunaId && !equivalente.vacunaId && !equivalente.vacuna_relacionada_id) {
          await this.actualizarRecordatorio(String(equivalente.id), {
            vacunaId,
            vacuna_relacionada_id: vacunaId,
            origen: 'vacuna_auto',
            ...(clienteId ? { cliente_id: clienteId } : {})
          });
        }
        return { action: 'skipped', reason: 'equivalente' };
      }
      await this.actualizarRecordatorio(String(equivalente.id), payloadBase);
      return {
        action: 'updated',
        recordatorioId: String(equivalente.id),
        fechaLabel: fecha.labelEs
      };
    }

    // crearRecordatorio lanza si título+fecha+tipo duplicados — usamos push directo
    // tras dedupe por vacuna/día para no chocar con esa validación legacy.
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const nuevo = {
      ...payloadBase,
      created_at: timestamp,
      updated_at: timestamp,
      fecha_creacion: timestamp,
      activo: true
    };
    const ref = await this.db.list('Katzen/Recordatorios').push(nuevo);
    await stampRtdbIdAfterPush(this.db, 'Katzen/Recordatorios', ref.key);
    return {
      action: 'created',
      recordatorioId: String(ref.key),
      fechaLabel: fecha.labelEs
    };
  }

  /**
   * Spec 033: cancela recordatorios pendientes ligados a una vacuna (baja lógica).
   * Solo toca nodos con vacunaId / vacuna_relacionada_id — no afecta legacy sin enlace.
   */
  async cancelarPendientesPorVacuna(vacunaId: string): Promise<number> {
    const id = String(vacunaId || '').trim();
    if (!id) return 0;

    const snap = await this.db.database.ref('Katzen/Recordatorios').once('value');
    const val = snap.val() as Record<string, Record<string, unknown>> | null;
    if (!val) return 0;

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updates: Record<string, unknown> = {};
    let count = 0;

    for (const [rid, rec] of Object.entries(val)) {
      if (!rec || rec['activo'] === false || rec['activo'] === 0) continue;
      const linked =
        rec['vacunaId'] === id || rec['vacuna_relacionada_id'] === id;
      if (!linked) continue;
      const estado = String(rec['estado'] || 'pendiente').toLowerCase();
      if (estado === 'completado') continue;

      updates[`Katzen/Recordatorios/${rid}/activo`] = false;
      updates[`Katzen/Recordatorios/${rid}/estado`] = 'cancelado';
      updates[`Katzen/Recordatorios/${rid}/updated_at`] = timestamp;
      updates[`Katzen/Recordatorios/${rid}/canceladoPorVacuna`] = true;
      count++;
    }

    if (count > 0) {
      await this.db.database.ref().update(updates);
    }
    return count;
  }
} 