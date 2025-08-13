import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VacunasService {
  constructor(private db: AngularFireDatabase) {}

  // Obtener todas las vacunas con sus IDs
  getVacunas(): Observable<any[]> {
    return this.db.list('Katzen/Vacunas').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(v => v.activo !== false && v.activo !== 0) // Solo mostrar vacunas activas
          .sort((a, b) => {
            const fechaA = new Date(a.fechaRegistro || a.fecha_aplicacion || a.created_at || 0);
            const fechaB = new Date(b.fechaRegistro || b.fecha_aplicacion || b.created_at || 0);
            return fechaB.getTime() - fechaA.getTime(); // Más nuevo arriba
          })
      )
    );
  }

  // Obtener vacunas por paciente_id
  getVacunasPorPaciente(pacienteId: string): Observable<any[]> {
    return this.db.list('Katzen/Vacunas').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(v => v.idPaciente === pacienteId && v.activo !== false && v.activo !== 0) // Solo mostrar vacunas activas
          .sort((a, b) => {
            const fechaA = new Date(a.fechaRegistro || a.fecha_aplicacion || a.created_at || 0);
            const fechaB = new Date(b.fechaRegistro || b.fecha_aplicacion || b.created_at || 0);
            return fechaB.getTime() - fechaA.getTime(); // Más nuevo arriba
          })
      )
    );
  }

  // Obtener una vacuna por id
  getVacuna(id: string): Observable<any> {
    return this.db.object(`Katzen/Vacunas/${id}`).valueChanges().pipe(
      map(vacuna => vacuna ? { id, ...(vacuna as any) } : null)
    );
  }

  // Crear nueva vacuna
  async crearVacuna(vacuna: any): Promise<any> {
    try {
      const timestamp = Date.now();
      console.log(`VacunasService [${timestamp}] - Iniciando creación de vacuna:`, vacuna);
      const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      
      // Validación básica de campos requeridos
      if (!vacuna.idPaciente || !vacuna.vacuna) {
        throw new Error('Faltan campos requeridos: idPaciente y vacuna');
      }
      
      // NO validar duplicados - solo crear la vacuna directamente
      console.log(`VacunasService [${timestamp}] - Saltando validación de duplicados, creando vacuna directamente...`);
      
      console.log(`VacunasService [${timestamp}] - Preparando datos de nueva vacuna...`);
      const nuevaVacuna = {
        ...vacuna,
        fechaRegistro: timestampStr,
        recordatorio: vacuna.recordatorio || false,
        stability: vacuna.stability || 0,
        activo: true,
        aplicada: vacuna.aplicada || false
      };

      console.log(`VacunasService [${timestamp}] - Datos de nueva vacuna preparados:`, nuevaVacuna);

      // Usar push() para generar ID automático de Firebase
      console.log(`VacunasService [${timestamp}] - Ejecutando push() a Firebase...`);
      console.log(`VacunasService [${timestamp}] - Ruta Firebase: Katzen/Vacunas`);
      
      const ref = await this.db.list('Katzen/Vacunas').push(nuevaVacuna);
      
      console.log(`VacunasService [${timestamp}] - Push() completado, ID generado:`, ref.key);
      console.log(`VacunasService [${timestamp}] - Vacuna creada exitosamente con ID:`, ref.key);
      
      // Retornar el ID generado por Firebase
      return { key: ref.key, ...nuevaVacuna };
    } catch (error) {
      console.error('Error al crear vacuna:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('No se pudo registrar la vacuna en la base de datos');
    }
  }

  // Actualizar vacuna existente
  actualizarVacuna(id: string, cambios: any): Promise<void> {
    return this.db.object(`Katzen/Vacunas/${id}`).update(cambios);
  }

  // Eliminar vacuna
  eliminarVacuna(id: string): Promise<void> {
    return this.db.object(`Katzen/Vacunas/${id}`).remove();
  }

  // Baja lógica: marcar como inactiva
  async bajaLogicaVacuna(id: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      
      // Realizar la actualización
      await this.db.object(`Katzen/Vacunas/${id}`).update({ 
        activo: false,
        fechaEliminacion: timestamp
      });
      
      // Si llegamos aquí, la operación fue exitosa
      // No necesitamos verificar nada más
    } catch (error) {
      console.error('Error en baja lógica de vacuna:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('No se pudo realizar la baja lógica de la vacuna');
    }
  }

  // Restaurar vacuna
  restaurarVacuna(id: string): Promise<void> {
    return this.db.object(`Katzen/Vacunas/${id}`).update({ 
      activo: true,
      fechaEliminacion: null
    });
  }

  // Marcar vacuna como aplicada
  marcarAplicada(id: string): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return this.db.object(`Katzen/Vacunas/${id}`).update({ 
      aplicada: true,
      fechaAplicacion: timestamp,
      fechaActualizacion: timestamp
    });
  }

  // Marcar vacuna como pendiente
  marcarPendiente(id: string): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return this.db.object(`Katzen/Vacunas/${id}`).update({ 
      aplicada: false,
      fechaAplicacion: null,
      fechaActualizacion: timestamp
    });
  }

  // Obtener tipos de vacunas disponibles
  getTiposVacunas(): Observable<any[]> {
    return this.db.list('Katzen/TiposVacunas').snapshotChanges().pipe(
      map(changes => 
        changes.map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
      )
    );
  }

  // Generar ID único
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Calcular próxima fecha de vacuna
  calcularProximaFecha(vacuna: any): string {
    const fecha = vacuna.fechaAplicacion || vacuna.fecha;
    if (!fecha || !vacuna.intervalo) return '';
    
    const fechaActual = new Date(fecha);
    const proximaFecha = new Date(fechaActual.getTime() + (vacuna.intervalo * 24 * 60 * 60 * 1000));
    
    return proximaFecha.toLocaleDateString('es-ES');
  }

  // Verificar si la vacuna está vencida
  estaVencida(vacuna: any): boolean {
    const fecha = vacuna.fechaAplicacion || vacuna.fecha;
    if (!fecha) return false;
    
    const fechaVacuna = new Date(fecha);
    const hoy = new Date();
    
    return fechaVacuna < hoy;
  }

  // Obtener días restantes para la vacuna
  getDiasRestantes(vacuna: any): number {
    const fecha = vacuna.proximaAplicacion || vacuna.fechaAplicacion || vacuna.fecha;
    if (!fecha) return 0;
    
    const fechaVacuna = new Date(fecha);
    const hoy = new Date();
    const diferencia = fechaVacuna.getTime() - hoy.getTime();
    
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }
} 