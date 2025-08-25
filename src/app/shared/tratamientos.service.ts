import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map } from 'rxjs';
import { Tratamiento, TratamientoFormData } from './tratamiento.model';

@Injectable({
  providedIn: 'root'
})
export class TratamientosService {
  constructor(private db: AngularFireDatabase) {}

  // Obtener todos los tratamientos activos
  getTratamientos(): Observable<Tratamiento[]> {
    return this.db.list('Katzen/Tratamientos').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(t => t.activo !== false)
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
      )
    );
  }

  // Obtener tratamiento por ID
  getTratamiento(id: string): Observable<Tratamiento | null> {
    return this.db.object(`Katzen/Tratamientos/${id}`).valueChanges().pipe(
      map(tratamiento => tratamiento ? { id, ...(tratamiento as any) } : null)
    );
  }

  // Crear nuevo tratamiento
  async crearTratamiento(tratamiento: TratamientoFormData): Promise<any> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    const nuevoTratamiento: Tratamiento = {
      ...tratamiento,
      activo: true,
      created_at: timestamp,
      updated_at: timestamp,
      uso_count: 0
    };

    const ref = await this.db.list('Katzen/Tratamientos').push(nuevoTratamiento);
    return ref;
  }

  // Actualizar tratamiento existente
  actualizarTratamiento(id: string, cambios: Partial<Tratamiento>): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    const datosActualizados = {
      ...cambios,
      updated_at: timestamp
    };

    return this.db.object(`Katzen/Tratamientos/${id}`).update(datosActualizados);
  }

  // Incrementar contador de uso
  async incrementarUso(id: string): Promise<void> {
    try {
      const tratamiento = await this.db.object(`Katzen/Tratamientos/${id}`).valueChanges().toPromise();
      if (tratamiento) {
        const usoCount = (tratamiento as any)?.uso_count || 0;
        await this.db.object(`Katzen/Tratamientos/${id}`).update({ 
          uso_count: usoCount + 1,
          updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        });
      }
    } catch (error) {
      console.error('Error al incrementar uso del tratamiento:', error);
      throw error;
    }
  }

  // Buscar tratamientos por texto
  buscarTratamientos(texto: string): Observable<Tratamiento[]> {
    return this.db.list('Katzen/Tratamientos').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(t => t.activo !== false)
          .filter(t => 
            t.nombre.toLowerCase().includes(texto.toLowerCase()) ||
            (t.descripcion && t.descripcion.toLowerCase().includes(texto.toLowerCase())) ||
            (t.categoria && t.categoria.toLowerCase().includes(texto.toLowerCase()))
          )
          .sort((a, b) => (b.uso_count || 0) - (a.uso_count || 0)) // Más usados primero
      )
    );
  }

  // Obtener tratamientos más populares
  getTratamientosPopulares(limite: number = 10): Observable<Tratamiento[]> {
    return this.db.list('Katzen/Tratamientos').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(t => t.activo !== false)
          .sort((a, b) => (b.uso_count || 0) - (a.uso_count || 0))
          .slice(0, limite)
      )
    );
  }

  // Eliminar tratamiento (baja lógica)
  eliminarTratamiento(id: string): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return this.db.object(`Katzen/Tratamientos/${id}`).update({ 
      activo: false,
      updated_at: timestamp 
    });
  }
}
