import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { Usuario } from './usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  constructor(private db: AngularFireDatabase) {}

  // Obtener todos los usuarios
  getUsuarios(): Observable<any> {
    return this.db.object('Katzen/Usuarios').valueChanges();
  }

  // Obtener un usuario por id
  getUsuario(id: string): Observable<any> {
    return this.db.object(`Katzen/Usuarios/${id}`).valueChanges();
  }

  // Agregar o actualizar un usuario
  guardarUsuario(usuario: any) {
    return this.db.object(`Katzen/Usuarios/${usuario.id}`).set(usuario);
  }

  // Actualizar solo algunos campos de un usuario
  actualizarUsuario(id: string, cambios: Partial<any>) {
    return this.db.object(`Katzen/Usuarios/${id}`).update(cambios);
  }
} 