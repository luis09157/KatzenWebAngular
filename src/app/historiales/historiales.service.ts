import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HistorialesService {
  constructor(private db: AngularFireDatabase) {}

  // Obtener todos los historiales (solo activos)
  getHistoriales(): Observable<any[]> {
    return this.db.list('Katzen/Historiales_Clinicos').valueChanges();
  }

  // Obtener un historial por id
  getHistorial(id: string): Observable<any> {
    return this.db.object(`Katzen/Historiales_Clinicos/${id}`).valueChanges();
  }

  // Agregar o actualizar un historial (siempre con activo: true)
  guardarHistorial(historial: any) {
    historial.activo = true;
    
    // Si tiene id válido, actualiza; si no, crea nuevo
    if (historial.id && historial.id !== '') {
      return this.db.object(`Katzen/Historiales_Clinicos/${historial.id}`).set(historial);
    } else {
      // Para nuevos historiales, usar push() para que Firebase genere la key
      const ref = this.db.list('Katzen/Historiales_Clinicos').push(historial);
      return ref;
    }
  }

  // Actualizar solo algunos campos de un historial
  actualizarHistorial(id: string, cambios: Partial<any>) {
    return this.db.object(`Katzen/Historiales_Clinicos/${id}`).update(cambios);
  }

  // Baja lógica: marcar como inactivo
  bajaLogicaHistorial(id: string) {
    return this.db.object(`Katzen/Historiales_Clinicos/${id}`).update({ activo: false });
  }
} 