import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PacientesService {
  constructor(private db: AngularFireDatabase) {}

  // Obtener todos los pacientes (solo activos)
  getPacientes(): Observable<any[]> {
    return this.db.list('Katzen/Mascota').valueChanges();
  }

  // Obtener un paciente por id
  getPaciente(id: string): Observable<any> {
    return this.db.object(`Katzen/Mascota/${id}`).valueChanges();
  }

  // Agregar o actualizar un paciente (siempre con activo: true)
  guardarPaciente(paciente: any) {
    paciente.activo = true;
    return this.db.object(`Katzen/Mascota/${paciente.id}`).set(paciente);
  }

  // Actualizar solo algunos campos de un paciente
  actualizarPaciente(id: string, cambios: Partial<any>) {
    return this.db.object(`Katzen/Mascota/${id}`).update(cambios);
  }

  // Baja lógica: marcar como inactivo
  bajaLogicaPaciente(id: string) {
    return this.db.object(`Katzen/Mascota/${id}`).update({ activo: false });
  }
} 