import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  constructor(private db: AngularFireDatabase) {}

  // Obtener todas las citas (solo activas)
  getCitas(): Observable<any[]> {
    return this.db.list('Katzen/Citas').snapshotChanges().pipe(
      map(actions => actions
        .map(a => ({
          id: a.key,
          ...a.payload.val() as any
        }))
        .filter(cita => cita.activo !== false) // Solo citas activas
        .sort((a, b) => {
          const fechaA = new Date(a.fecha || a.fecha_hora || a.created_at || 0);
          const fechaB = new Date(b.fecha || b.fecha_hora || b.created_at || 0);
          return fechaB.getTime() - fechaA.getTime(); // Más nuevo arriba
        })
      )
    );
  }

  // Agregar o actualizar una cita (siempre con activo: true)
  async guardarCita(cita: any): Promise<any> {
    cita.activo = true;
    
    // Validar duplicados solo para citas nuevas
    if (!cita.id) {
      // Verificar si ya existe una cita para la misma fecha, hora y paciente
      const citasExistentes = await this.getCitas().toPromise();
      
      if (citasExistentes && citasExistentes.length > 0) {
        const duplicada = citasExistentes.find(c => 
          c.fecha === cita.fecha &&
          c.hora === cita.hora &&
          c.paciente_id === cita.paciente_id &&
          c.activo !== false
        );
        
        if (duplicada) {
          throw new Error(`Ya existe una cita programada para esta fecha y hora con este paciente`);
        }
        
        // Verificar conflictos de horario del médico
        const conflictoMedico = citasExistentes.find(c => 
          c.fecha === cita.fecha &&
          c.hora === cita.hora &&
          c.medico_id === cita.medico_id &&
          c.activo !== false
        );
        
        if (conflictoMedico) {
          throw new Error(`El médico ya tiene una cita programada para esta fecha y hora`);
        }
      }
    }
    
    // Si tiene id, actualiza; si no, push y captura el ID generado
    if (cita.id) {
      return this.db.object(`Katzen/Citas/${cita.id}`).set(cita);
    } else {
      // Para nuevas citas, usar push y capturar el ID generado
      const ref = this.db.list('Katzen/Citas').push(cita);
      return ref.then((result: any) => {
        // Actualizar el objeto cita con el ID generado
        const citaActualizada = { ...cita, id: result.key };
        // Actualizar el registro con el ID incluido
        return this.db.object(`Katzen/Citas/${result.key}`).update(citaActualizada);
      });
    }
  }

  // Baja lógica: marcar como inactiva
  async bajaLogicaCita(id: string): Promise<any> {
    console.log('🗑️ Intentando eliminar cita con ID:', id);
    
    try {
      const result = await this.db.object(`Katzen/Citas/${id}`).update({ 
        activo: false,
        fecha_eliminacion: new Date().toISOString()
      });
      
      console.log('✅ Cita eliminada exitosamente:', id);
      return result;
    } catch (error) {
      console.error('❌ Error al eliminar cita:', error);
      throw error;
    }
  }
} 