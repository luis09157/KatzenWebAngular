import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map, catchError, throwError } from 'rxjs';

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
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .sort((a, b) => {
            const fechaA = new Date(a.fecha_registro || a.created_at || 0);
            const fechaB = new Date(b.fecha_registro || b.created_at || 0);
            return fechaB.getTime() - fechaA.getTime(); // Más nuevo arriba
          })
      ),
      catchError(error => {
        console.error('Error al obtener historiales:', error);
        return throwError(() => new Error('No se pudieron cargar los historiales'));
      })
    );
  }

  // Obtener historiales por paciente_id
  getHistorialesPorPaciente(pacienteId: string): Observable<any[]> {
    return this.db.list('Katzen/Historiales_Clinicos').snapshotChanges().pipe(
      map(changes => {
        console.log('🔄 Cambios en Firebase para historiales:', changes);
        
        const historiales = changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(h => h.paciente_id === pacienteId && h.activo !== false)
          .sort((a, b) => {
            const fechaA = new Date(a.fecha_registro || a.created_at || 0);
            const fechaB = new Date(b.fecha_registro || b.created_at || 0);
            return fechaB.getTime() - fechaA.getTime(); // Más nuevo arriba
          });
        
        console.log('📋 Historiales filtrados para paciente:', pacienteId, historiales);
        
        historiales.forEach(h => {
          console.log('🔍 Historial ID:', h.id, 'Diagnóstico:', h.diagnostico_presuntivo);
        });
        
        return historiales;
      }),
      catchError(error => {
        console.error('Error al obtener historiales del paciente:', error);
        return throwError(() => new Error('No se pudieron cargar los historiales del paciente'));
      })
    );
  }

  // Obtener un historial por id
  getHistorial(id: string): Observable<any> {
    return this.db.object(`Katzen/Historiales_Clinicos/${id}`).valueChanges().pipe(
      map(historial => historial ? { id, ...(historial as any) } : null),
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
      
      const nuevoHistorial = {
        ...historial,
        created_at: timestamp,
        updated_at: timestamp,
        fecha_registro: timestamp,
        activo: true
      };

      const ref = await this.db.list('Katzen/Historiales_Clinicos').push(nuevoHistorial);
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
      
      const datosActualizados = {
        ...cambios,
        updated_at: timestamp
      };

      await this.db.object(`Katzen/Historiales_Clinicos/${id}`).update(datosActualizados);
      console.log('✅ Historial actualizado exitosamente:', id);
    } catch (error) {
      console.error('❌ Error al actualizar historial:', error);
      throw new Error('No se pudo actualizar el historial');
    }
  }

  // Eliminar historial (eliminación física)
  async eliminarHistorial(id: string): Promise<void> {
    try {
      await this.db.object(`Katzen/Historiales_Clinicos/${id}`).remove();
      console.log('✅ Historial eliminado exitosamente:', id);
    } catch (error) {
      console.error('❌ Error al eliminar historial:', error);
      throw new Error('No se pudo eliminar el historial');
    }
  }

  // Baja lógica: marcar como inactivo
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
            const fechaA = new Date(a.fecha_registro || a.created_at || 0);
            const fechaB = new Date(b.fecha_registro || b.created_at || 0);
            return fechaB.getTime() - fechaA.getTime(); // Más nuevo arriba
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
            const fechaA = new Date(a.fecha_registro || a.created_at || 0);
            const fechaB = new Date(b.fecha_registro || b.created_at || 0);
            return fechaB.getTime() - fechaA.getTime(); // Más nuevo arriba
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
            const fechaA = new Date(a.fecha_registro || a.created_at || 0);
            const fechaB = new Date(b.fecha_registro || b.created_at || 0);
            return fechaB.getTime() - fechaA.getTime(); // Más nuevo arriba
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