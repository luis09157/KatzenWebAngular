import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map, firstValueFrom } from 'rxjs';
import { LoggerService } from '../core/logger.service';
import { Diagnostico, DiagnosticoFormData } from './diagnostico.model';

@Injectable({
  providedIn: 'root'
})
export class DiagnosticosService {
  constructor(private db: AngularFireDatabase, private logger: LoggerService) {}

  // Obtener todos los diagnósticos activos
  getDiagnosticos(): Observable<Diagnostico[]> {
    return this.db.list('Katzen/Diagnosticos').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(d => d.activo !== false)
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
      )
    );
  }

  // Obtener diagnóstico por ID
  getDiagnostico(id: string): Observable<Diagnostico | null> {
    return this.db.object(`Katzen/Diagnosticos/${id}`).valueChanges().pipe(
      map(diagnostico => diagnostico ? { id, ...(diagnostico as any) } : null)
    );
  }

  // Crear nuevo diagnóstico
  async crearDiagnostico(diagnostico: DiagnosticoFormData): Promise<any> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    const nuevoDiagnostico: Diagnostico = {
      ...diagnostico,
      activo: true,
      created_at: timestamp,
      updated_at: timestamp,
      uso_count: 0
    };

    const ref = await this.db.list('Katzen/Diagnosticos').push(nuevoDiagnostico);
    return ref;
  }

  // Actualizar diagnóstico existente
  actualizarDiagnostico(id: string, cambios: Partial<Diagnostico>): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    const datosActualizados = {
      ...cambios,
      updated_at: timestamp
    };

    return this.db.object(`Katzen/Diagnosticos/${id}`).update(datosActualizados);
  }

  // Incrementar contador de uso
  async incrementarUso(id: string): Promise<void> {
    try {
      const diagnostico = await firstValueFrom(this.db.object(`Katzen/Diagnosticos/${id}`).valueChanges());
      if (diagnostico) {
        const usoCount = (diagnostico as any)?.uso_count || 0;
        await this.db.object(`Katzen/Diagnosticos/${id}`).update({ 
          uso_count: usoCount + 1,
          updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        });
      }
    } catch (error) {
      this.logger.error('Error al incrementar uso del diagnóstico:', error);
      throw error;
    }
  }

  // Buscar diagnósticos por texto
  buscarDiagnosticos(texto: string): Observable<Diagnostico[]> {
    return this.db.list('Katzen/Diagnosticos').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(d => d.activo !== false)
          .filter(d => 
            d.nombre.toLowerCase().includes(texto.toLowerCase()) ||
            (d.descripcion && d.descripcion.toLowerCase().includes(texto.toLowerCase())) ||
            (d.categoria && d.categoria.toLowerCase().includes(texto.toLowerCase()))
          )
          .sort((a, b) => (b.uso_count || 0) - (a.uso_count || 0)) // Más usados primero
      )
    );
  }

  // Obtener diagnósticos más populares
  getDiagnosticosPopulares(limite: number = 10): Observable<Diagnostico[]> {
    return this.db.list('Katzen/Diagnosticos').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(d => d.activo !== false)
          .sort((a, b) => (b.uso_count || 0) - (a.uso_count || 0))
          .slice(0, limite)
      )
    );
  }

  // Eliminar diagnóstico (baja lógica)
  eliminarDiagnostico(id: string): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return this.db.object(`Katzen/Diagnosticos/${id}`).update({ 
      activo: false,
      updated_at: timestamp 
    });
  }
}
