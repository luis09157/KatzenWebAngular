import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  constructor(private db: AngularFireDatabase) {}

  // Obtener todos los clientes (solo activos)
  getClientes(): Observable<any[]> {
    return this.db.list('Katzen/Cliente').valueChanges();
  }

  // Obtener un cliente por id
  getCliente(id: string): Observable<any> {
    return this.db.object(`Katzen/Cliente/${id}`).valueChanges();
  }

  // Agregar o actualizar un cliente (siempre con activo: true)
  guardarCliente(cliente: any) {
    cliente.activo = true;
    return this.db.object(`Katzen/Cliente/${cliente.id}`).set(cliente);
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