import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  constructor(private db: AngularFireDatabase) {}

  // Obtener todos los clientes (solo activos)
  getClientes(): Observable<any[]> {
    return this.db.list('Katzen/Cliente').snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const clienteData = a.payload.val() as any;
        return {
          id: a.key, // Usar la key de Firebase como ID
          ...clienteData
        };
      }))
    );
  }

  // Obtener un cliente por id
  getCliente(id: string): Observable<any> {
    return this.db.object(`Katzen/Cliente/${id}`).valueChanges();
  }

  // Agregar o actualizar un cliente (siempre con activo: true)
  guardarCliente(cliente: any): any {
    cliente.activo = true;
    
    // Si es un cliente nuevo (sin ID), usar push() para generar ID automáticamente
    if (!cliente.id || cliente.id.trim() === '') {
      return this.db.list('Katzen/Cliente').push(cliente).then((result) => {
        // Obtener el ID generado por Firebase
        const generatedId = result.key;
        if (generatedId) {
          // Actualizar el cliente con el ID generado en los datos
          return this.db.object(`Katzen/Cliente/${generatedId}`).update({ id: generatedId });
        }
        return Promise.resolve();
      });
    } else {
      // Si es una actualización, usar set() con el ID existente
      return this.db.object(`Katzen/Cliente/${cliente.id}`).set(cliente);
    }
  }

  // Actualizar solo algunos campos de un cliente
  actualizarCliente(id: string, cambios: Partial<any>) {
    return this.db.object(`Katzen/Cliente/${id}`).update(cambios);
  }

  // Baja lógica: marcar como inactivo
  bajaLogicaCliente(id: string) {
    return this.db.object(`Katzen/Cliente/${id}`).update({ activo: false });
  }


} 