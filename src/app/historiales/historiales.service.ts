import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map, catchError, throwError } from 'rxjs';
import { stampRtdbIdAfterPush } from '../core/utils/rtdb-push.util';
import { mapRtdbRow } from '../core/utils/rtdb-row.util';
import { queryRowsPorPaciente } from '../core/utils/rtdb-paciente-query.util';

@Injectable({
  providedIn: 'root'
})
export class HistorialesService {
  constructor(private db: AngularFireDatabase) {}

  // Obtener todos los historiales con sus IDs
  getHistoriales(): Observable<any[]> {
    return this.db.list('Katzen/Historiales_Clinicos').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => mapRtdbRow<{ fecha_registro?: string; created_at?: string }>(c.payload.key, c.payload.val()))
          .sort((a, b) => {
            // Ordenar por fecha_registro string directamente (formato: YYYY-MM-DD HH:MM:SS)
            const fechaA = a.fecha_registro || a.created_at || '0';
            const fechaB = b.fecha_registro || b.created_at || '0';
            
            // Orden descendente: más reciente primero
            if (fechaB > fechaA) return 1;
            if (fechaB < fechaA) return -1;
            return 0;
          })
      ),
      catchError(error => {
        console.error('Error al obtener historiales:', error);
        return throwError(() => new Error('No se pudieron cargar los historiales'));
      })
    );
  }

  // Obtener historiales por paciente (paciente_id e idPaciente; aliases de key legacy)
  getHistorialesPorPaciente(pacienteId: string, extraIds: string[] = []): Observable<any[]> {
    return queryRowsPorPaciente(this.db, 'Katzen/Historiales_Clinicos', [pacienteId, ...extraIds]).pipe(
      map(historiales =>
        historiales
          .filter(h => (h as { activo?: boolean }).activo !== false)
          .sort((a, b) => {
            const fechaA = (a as { fecha_registro?: string; created_at?: string }).fecha_registro
              || (a as { created_at?: string }).created_at
              || '0';
            const fechaB = (b as { fecha_registro?: string; created_at?: string }).fecha_registro
              || (b as { created_at?: string }).created_at
              || '0';
            if (fechaB > fechaA) return 1;
            if (fechaB < fechaA) return -1;
            return 0;
          })
      ),
      catchError(error => {
        console.error('Error al obtener historiales del paciente:', error);
        return throwError(() => new Error('No se pudieron cargar los historiales del paciente'));
      })
    );
  }

  // Obtener un historial por id
  getHistorial(id: string): Observable<any> {
    return this.db.object(`Katzen/Historiales_Clinicos/${id}`).valueChanges().pipe(
      map(historial => historial ? { ...(historial as object), id } : null),
      catchError(error => {
        console.error('Error al obtener historial:', error);
        return throwError(() => new Error('No se pudo cargar el historial'));
      })
    );
  }

  // Crear nuevo historial
  async crearHistorial(historial: any): Promise<any> {
    try {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const notasInternas = String(historial?.notas_internas || '').trim();
      const { notas_internas: _omit, ...rest } = historial || {};

      const nuevoHistorial = {
        ...rest,
        // Spec 016: no persistir notas_internas en nodo legible por portal
        notas_internas: null,
        created_at: timestamp,
        updated_at: timestamp,
        fecha_registro: historial.fecha_registro || timestamp,
        activo: historial.activo !== false,
        oculto_portal: historial.oculto_portal === true
      };

      const ref = await this.db.list('Katzen/Historiales_Clinicos').push(nuevoHistorial);
      await stampRtdbIdAfterPush(this.db, 'Katzen/Historiales_Clinicos', ref.key);
      if (ref.key && notasInternas) {
        await this.guardarNotasInternas(ref.key, notasInternas);
      }
      console.log('✅ Historial creado exitosamente:', ref.key);
      return ref;
    } catch (error) {
      console.error('❌ Error al crear historial:', error);
      throw new Error('No se pudo crear el historial');
    }
  }

  // Actualizar historial existente
  async actualizarHistorial(id: string, cambios: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const hasNotas = Object.prototype.hasOwnProperty.call(cambios || {}, 'notas_internas');
      const notasInternas = hasNotas ? String(cambios?.notas_internas || '').trim() : null;
      const { notas_internas: _omit, ...rest } = cambios || {};

      const datosActualizados: Record<string, unknown> = {
        ...rest,
        updated_at: timestamp
      };
      if (hasNotas) {
        datosActualizados['notas_internas'] = null;
      }

      await this.db.object(`Katzen/Historiales_Clinicos/${id}`).update(datosActualizados);
      if (hasNotas) {
        await this.guardarNotasInternas(id, notasInternas || '');
      }
      console.log('✅ Historial actualizado exitosamente:', id);
    } catch (error) {
      console.error('❌ Error al actualizar historial:', error);
      throw new Error('No se pudo actualizar el historial');
    }
  }

  /** Spec 016 — notas solo staff (nodo aislado). */
  async guardarNotasInternas(historialId: string, texto: string): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    if (!texto) {
      await this.db.object(`Katzen/Historiales_Notas_Internas/${historialId}`).update({
        texto: '',
        updated_at: timestamp
      });
      return;
    }
    await this.db.object(`Katzen/Historiales_Notas_Internas/${historialId}`).set({
      texto,
      updated_at: timestamp
    });
  }

  async getNotasInternas(historialId: string): Promise<string> {
    const snap = await this.db.database
      .ref(`Katzen/Historiales_Notas_Internas/${historialId}`)
      .once('value');
    const privado = String(snap.val()?.texto || '').trim();
    if (privado) return privado;
    const legacy = await this.db.database
      .ref(`Katzen/Historiales_Clinicos/${historialId}/notas_internas`)
      .once('value');
    return String(legacy.val() || '').trim();
  }

  /** Archiva historial en admin y oculta del portal mobile (update parcial — no remove). */
  async eliminarHistorial(id: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      await this.db.object(`Katzen/Historiales_Clinicos/${id}`).update({
        activo: false,
        oculto_portal: true,
        updated_at: timestamp
      });
      console.log('✅ Historial archivado (datos preservados):', id);
    } catch (error) {
      console.error('❌ Error al archivar historial:', error);
      throw new Error('No se pudo archivar el historial');
    }
  }

  // Baja lógica admin: oculta en panel staff; NO afecta portal mobile
  async bajaLogicaHistorial(id: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      await this.db.object(`Katzen/Historiales_Clinicos/${id}`).update({ 
        activo: false,
        updated_at: timestamp 
      });
      console.log('✅ Historial marcado como inactivo:', id);
    } catch (error) {
      console.error('❌ Error al marcar historial como inactivo:', error);
      throw new Error('No se pudo marcar el historial como inactivo');
    }
  }

  async ocultarDelPortal(id: string, oculto = true): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      await this.db.object(`Katzen/Historiales_Clinicos/${id}`).update({
        oculto_portal: oculto,
        updated_at: timestamp
      });
    } catch (error) {
      console.error('❌ Error al actualizar visibilidad portal:', error);
      throw new Error('No se pudo actualizar la visibilidad en portal');
    }
  }

  // Restaurar historial (si estaba marcado como inactivo)
  async restaurarHistorial(id: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      await this.db.object(`Katzen/Historiales_Clinicos/${id}`).update({ 
        activo: true,
        updated_at: timestamp 
      });
      console.log('✅ Historial restaurado exitosamente:', id);
    } catch (error) {
      console.error('❌ Error al restaurar historial:', error);
      throw new Error('No se pudo restaurar el historial');
    }
  }

  // Obtener historiales activos
  getHistorialesActivos(): Observable<any[]> {
    return this.db.list('Katzen/Historiales_Clinicos').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(h => h.activo !== false)
          .sort((a, b) => {
            // Ordenar por fecha_registro string directamente (formato: YYYY-MM-DD HH:MM:SS)
            const fechaA = a.fecha_registro || a.created_at || '0';
            const fechaB = b.fecha_registro || b.created_at || '0';
            
            // Orden descendente: más reciente primero
            if (fechaB > fechaA) return 1;
            if (fechaB < fechaA) return -1;
            return 0;
          })
      ),
      catchError(error => {
        console.error('Error al obtener historiales activos:', error);
        return throwError(() => new Error('No se pudieron cargar los historiales activos'));
      })
    );
  }

  // Obtener historiales inactivos (para administración)
  getHistorialesInactivos(): Observable<any[]> {
    return this.db.list('Katzen/Historiales_Clinicos').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(h => h.activo === false)
          .sort((a, b) => {
            // Ordenar por fecha_registro string directamente (formato: YYYY-MM-DD HH:MM:SS)
            const fechaA = a.fecha_registro || a.created_at || '0';
            const fechaB = b.fecha_registro || b.created_at || '0';
            
            // Orden descendente: más reciente primero
            if (fechaB > fechaA) return 1;
            if (fechaB < fechaA) return -1;
            return 0;
          })
      ),
      catchError(error => {
        console.error('Error al obtener historiales inactivos:', error);
        return throwError(() => new Error('No se pudieron cargar los historiales inactivos'));
      })
    );
  }

  // Buscar historiales por texto
  buscarHistoriales(texto: string): Observable<any[]> {
    return this.db.list('Katzen/Historiales_Clinicos').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(h => h.activo !== false)
          .filter(h => 
            // Nuevos campos
            (h.historia_clinica && h.historia_clinica.toLowerCase().includes(texto.toLowerCase())) ||
            (h.diagnostico_presuntivo && h.diagnostico_presuntivo.toLowerCase().includes(texto.toLowerCase())) ||
            (h.manejo_terapeutico && h.manejo_terapeutico.toLowerCase().includes(texto.toLowerCase())) ||
            (h.hallazgos && h.hallazgos.toLowerCase().includes(texto.toLowerCase())) ||
            (h.estudios_solicitados && h.estudios_solicitados.toLowerCase().includes(texto.toLowerCase())) ||
            (h.receta && h.receta.toLowerCase().includes(texto.toLowerCase())) ||
            (h.medico_atendio && h.medico_atendio.toLowerCase().includes(texto.toLowerCase()))
          )
          .sort((a, b) => {
            // Ordenar por fecha_registro string directamente (formato: YYYY-MM-DD HH:MM:SS)
            const fechaA = a.fecha_registro || a.created_at || '0';
            const fechaB = b.fecha_registro || b.created_at || '0';
            
            // Orden descendente: más reciente primero
            if (fechaB > fechaA) return 1;
            if (fechaB < fechaA) return -1;
            return 0;
          })
      ),
      catchError(error => {
        console.error('Error al buscar historiales:', error);
        return throwError(() => new Error('No se pudo realizar la búsqueda'));
      })
    );
  }

  // Obtener estadísticas de historiales
  getEstadisticasHistoriales(): Observable<any> {
    return this.db.list('Katzen/Historiales_Clinicos').snapshotChanges().pipe(
      map(changes => {
        const historiales = changes.map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }));
        const activos = historiales.filter(h => h.activo !== false).length;
        const inactivos = historiales.filter(h => h.activo === false).length;
        const total = activos; // Solo contar los activos como total
        
        return {
          total,
          activos,
          inactivos
        };
      }),
      catchError(error => {
        console.error('Error al obtener estadísticas:', error);
        return throwError(() => new Error('No se pudieron cargar las estadísticas'));
      })
    );
  }
} 