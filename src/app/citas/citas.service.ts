import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SucursalContextService } from '../core/services/sucursal-context.service';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  constructor(
    private db: AngularFireDatabase,
    private sucursalContext: SucursalContextService
  ) {}

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
    console.log('🔄 [SERVICIO] Iniciando guardado de cita...');
    console.log('📝 [SERVICIO] Datos de la cita:', cita);
    
    const isNew = !cita.id;
    if (isNew) {
      cita.activo = true;
    }
    cita = this.sucursalContext.stamp(cita);
    
    // Si tiene id, actualiza; si no, push y captura el ID generado
    if (cita.id) {
      console.log('🔄 [SERVICIO] Actualizando cita existente con ID:', cita.id);
      return this.db.object(`Katzen/Citas/${cita.id}`).set(cita).then(() => {
        console.log('✅ [SERVICIO] Cita actualizada exitosamente');
        return Promise.resolve();
      }).catch(error => {
        console.error('❌ [SERVICIO] Error al actualizar cita:', error);
        throw error;
      });
    } else {
      console.log('🔄 [SERVICIO] Creando nueva cita...');
      // Para nuevas citas, usar push y capturar el ID generado
      return this.db.list('Katzen/Citas').push(cita).then(async (result: any) => {
        console.log('✅ [SERVICIO] Cita creada con ID generado:', result.key);
        await this.db.object(`Katzen/Citas/${result.key}`).update({ ...cita, id: result.key });
        console.log('✅ [SERVICIO] ID actualizado en la cita');
      }).catch(error => {
        console.error('❌ [SERVICIO] Error al crear cita:', error);
        throw error;
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