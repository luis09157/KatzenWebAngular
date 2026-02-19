import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map, firstValueFrom } from 'rxjs';
import { LoggerService } from '../core/logger.service';
import { Medicamento, MedicamentoFormData } from './medicamento.model';

@Injectable({
  providedIn: 'root'
})
export class MedicamentosService {
  constructor(private db: AngularFireDatabase, private logger: LoggerService) {}

  // Obtener todos los medicamentos activos
  getMedicamentos(): Observable<Medicamento[]> {
    return this.db.list('Katzen/Medicamentos').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(m => m.activo !== false)
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
      )
    );
  }

  // Obtener medicamento por ID
  getMedicamento(id: string): Observable<Medicamento | null> {
    return this.db.object(`Katzen/Medicamentos/${id}`).valueChanges().pipe(
      map(medicamento => medicamento ? { id, ...(medicamento as any) } : null)
    );
  }

  // Crear nuevo medicamento
  async crearMedicamento(medicamento: MedicamentoFormData): Promise<any> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    const nuevoMedicamento: Medicamento = {
      ...medicamento,
      activo: true,
      created_at: timestamp,
      updated_at: timestamp,
      uso_count: 0
    };

    const ref = await this.db.list('Katzen/Medicamentos').push(nuevoMedicamento);
    return ref;
  }

  // Actualizar medicamento existente
  actualizarMedicamento(id: string, cambios: Partial<Medicamento>): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    const datosActualizados = {
      ...cambios,
      updated_at: timestamp
    };

    return this.db.object(`Katzen/Medicamentos/${id}`).update(datosActualizados);
  }

  // Incrementar contador de uso
  async incrementarUso(id: string): Promise<void> {
    try {
      const medicamento = await firstValueFrom(this.db.object(`Katzen/Medicamentos/${id}`).valueChanges());
      if (medicamento) {
        const usoCount = (medicamento as any)?.uso_count || 0;
        await this.db.object(`Katzen/Medicamentos/${id}`).update({ 
          uso_count: usoCount + 1,
          updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        });
      }
    } catch (error) {
      this.logger.error('Error al incrementar uso del medicamento:', error);
      throw error;
    }
  }

  // Buscar medicamentos por texto
  buscarMedicamentos(texto: string): Observable<Medicamento[]> {
    return this.db.list('Katzen/Medicamentos').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(m => m.activo !== false)
          .filter(m => 
            m.nombre.toLowerCase().includes(texto.toLowerCase()) ||
            (m.descripcion && m.descripcion.toLowerCase().includes(texto.toLowerCase())) ||
            (m.categoria && m.categoria.toLowerCase().includes(texto.toLowerCase()))
          )
          .sort((a, b) => (b.uso_count || 0) - (a.uso_count || 0)) // Más usados primero
      )
    );
  }

  // Obtener medicamentos más populares
  getMedicamentosPopulares(limite: number = 10): Observable<Medicamento[]> {
    return this.db.list('Katzen/Medicamentos').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(m => m.activo !== false)
          .sort((a, b) => (b.uso_count || 0) - (a.uso_count || 0))
          .slice(0, limite)
      )
    );
  }

  // Eliminar medicamento (baja lógica)
  eliminarMedicamento(id: string): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return this.db.object(`Katzen/Medicamentos/${id}`).update({ 
      activo: false,
      updated_at: timestamp 
    });
  }
}
