import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecordatoriosService {
  constructor(private db: AngularFireDatabase) {}

  // Obtener todos los recordatorios con sus IDs
  getRecordatorios(): Observable<any[]> {
    return this.db.list('Katzen/Recordatorios').snapshotChanges().pipe(
      map(changes => 
        changes.map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
      )
    );
  }

  // Obtener recordatorios por paciente_id
  getRecordatoriosPorPaciente(pacienteId: string): Observable<any[]> {
    return this.db.list('Katzen/Recordatorios').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(r => r.paciente_id === pacienteId)
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

    console.log('Intentando crear recordatorio:', nuevoRecordatorio);
    
    try {
      const ref = await this.db.list('Katzen/Recordatorios').push(nuevoRecordatorio);
      console.log('Recordatorio creado exitosamente con ID:', ref.key);
      return ref;
    } catch (error) {
      console.error('Error al crear recordatorio en Firebase:', error);
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

  // Eliminar recordatorio (baja lógica)
  eliminarRecordatorio(id: string): Promise<void> {
    return this.db.object(`Katzen/Recordatorios/${id}`).remove();
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
} 