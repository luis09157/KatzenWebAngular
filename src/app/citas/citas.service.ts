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
  guardarCita(cita: any) {
    cita.activo = true;
    // Si tiene id, actualiza; si no, push
    if (cita.id) {
      return this.db.object(`Katzen/Citas/${cita.id}`).set(cita);
    } else {
      const ref = this.db.list('Katzen/Citas').push(cita);
      return ref;
    }
  }

  // Baja lógica: marcar como inactiva
  bajaLogicaCita(id: string) {
    return this.db.object(`Katzen/Citas/${id}`).update({ activo: false });
  }
} 