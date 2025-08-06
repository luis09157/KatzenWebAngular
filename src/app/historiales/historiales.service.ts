import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HistorialesService {
  constructor(private db: AngularFireDatabase) {}

  // Obtener todos los historiales con sus IDs
  getHistoriales(): Observable<any[]> {
    return this.db.list('Katzen/Historiales_Clinicos').snapshotChanges().pipe(
      map(changes => 
        changes.map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
      )
    );
  }

  // Obtener historiales por paciente_id
  getHistorialesPorPaciente(pacienteId: string): Observable<any[]> {
    return this.db.list('Katzen/Historiales_Clinicos').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(h => h.paciente_id === pacienteId && h.activo !== false)
      )
    );
  }

  // Obtener un historial por id
  getHistorial(id: string): Observable<any> {
    return this.db.object(`Katzen/Historiales_Clinicos/${id}`).valueChanges().pipe(
      map(historial => historial ? { id, ...(historial as any) } : null)
    );
  }

  // Crear nuevo historial
  async crearHistorial(historial: any): Promise<any> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    const nuevoHistorial = {
      ...historial,
      created_at: timestamp,
      updated_at: timestamp,
      fecha_registro: timestamp,
      activo: true
    };

    const ref = await this.db.list('Katzen/Historiales_Clinicos').push(nuevoHistorial);
    return ref;
  }

  // Actualizar historial existente
  actualizarHistorial(id: string, cambios: any): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    const datosActualizados = {
      ...cambios,
      updated_at: timestamp
    };

    return this.db.object(`Katzen/Historiales_Clinicos/${id}`).update(datosActualizados);
  }

  // Eliminar historial (eliminación física)
  eliminarHistorial(id: string): Promise<void> {
    return this.db.object(`Katzen/Historiales_Clinicos/${id}`).remove();
  }

  // Baja lógica: marcar como inactivo
  bajaLogicaHistorial(id: string): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return this.db.object(`Katzen/Historiales_Clinicos/${id}`).update({ 
      activo: false,
      updated_at: timestamp 
    });
  }

  // Restaurar historial (si estaba marcado como inactivo)
  restaurarHistorial(id: string): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return this.db.object(`Katzen/Historiales_Clinicos/${id}`).update({ 
      activo: true,
      updated_at: timestamp 
    });
  }

  // Obtener historiales activos
  getHistorialesActivos(): Observable<any[]> {
    return this.db.list('Katzen/Historiales_Clinicos').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(h => h.activo !== false)
      )
    );
  }

  // Obtener historiales inactivos (para administración)
  getHistorialesInactivos(): Observable<any[]> {
    return this.db.list('Katzen/Historiales_Clinicos').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(h => h.activo === false)
      )
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
            (h.diagnostico && h.diagnostico.toLowerCase().includes(texto.toLowerCase())) ||
            (h.tratamiento && h.tratamiento.toLowerCase().includes(texto.toLowerCase())) ||
            (h.medicamentos && h.medicamentos.toLowerCase().includes(texto.toLowerCase())) ||
            (h.notas && h.notas.toLowerCase().includes(texto.toLowerCase()))
          )
      )
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
      })
    );
  }
} 