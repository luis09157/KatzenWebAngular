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
      map(actions => actions.map(a => ({
        id: a.key,
        ...a.payload.val() as any
      })))
    );
  }

  // Agregar o actualizar una cita (siempre con activo: true)
  async guardarCita(cita: any): Promise<any> {
    cita.activo = true;
    
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
  bajaLogicaCita(id: string) {
    return this.db.object(`Katzen/Citas/${id}`).update({ activo: false });
  }
} 