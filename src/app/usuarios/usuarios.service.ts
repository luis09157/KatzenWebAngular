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
    return this.db.list('Katzen/Usuarios').valueChanges();
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

  // Método temporal para agregar doctoras
  async agregarDoctoras() {
    const timestamp = new Date().toISOString();
    
    // Doctora 1: Brisaida Ailed Berlanga Jiménez
    const doctora1 = {
      id: "brisaida-berlanga-jimenez",
      nombre: "Brisaida Ailed Berlanga Jiménez",
      correo: "emvyzbriza@hotmail.com",
      telefono: "8120175639",
      perfil: "doctor",
      fecha_registro: timestamp,
      activo: true
    };

    // Doctora 2: Sthefany Díaz (ya existe, pero la actualizo)
    const doctora2 = {
      id: "04a38a35-9cf6-45d8-9df8-05aa3838bead",
      nombre: "Sthefany Díaz",
      correo: "sthefany.diaz@katzen.mx",
      telefono: "8182708829",
      perfil: "doctor",
      fecha_registro: "2025-07-20T04:00:25.131399Z",
      activo: true
    };

    try {
      // Agregar/actualizar las doctoras
      await this.db.object(`Katzen/Usuarios/${doctora1.id}`).set(doctora1);
      await this.db.object(`Katzen/Usuarios/${doctora2.id}`).set(doctora2);
      
      console.log('✅ Doctoras agregadas/actualizadas exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error al agregar doctoras:', error);
      return false;
    }
  }
} 