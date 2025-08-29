import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Usuario } from './usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  constructor(private db: AngularFireDatabase) {}

  // Obtener todos los usuarios
  getUsuarios(): Observable<any> {
    return this.db.list('Katzen/Usuarios').snapshotChanges().pipe(
      map(changes => changes
        .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
        .filter(usuario => usuario.activo !== false) // Solo usuarios activos
        .sort((a, b) => {
          const fechaA = new Date(a.fecha_registro || a.fecha_creacion || a.created_at || 0);
          const fechaB = new Date(b.fecha_registro || b.fecha_creacion || b.created_at || 0);
          return fechaB.getTime() - fechaA.getTime(); // Más nuevo arriba
        })
      )
    );
  }

  // Obtener un usuario por id
  getUsuario(id: string): Observable<any> {
    return this.db.object(`Katzen/Usuarios/${id}`).valueChanges();
  }

  // Agregar o actualizar un usuario
  async guardarUsuario(usuario: any): Promise<any> {
    // Validar email duplicado para usuarios nuevos
    if (!usuario.id) {
      if (usuario.correo || usuario.email) {
        const email = usuario.correo || usuario.email;
        const usuariosExistentes = await this.getUsuarios().toPromise();
        
        if (usuariosExistentes && usuariosExistentes.length > 0) {
          const emailDuplicado = usuariosExistentes.find(u => 
            (u.correo === email || u.email === email) && u.activo !== false
          );
          
          if (emailDuplicado) {
            throw new Error(`Ya existe un usuario registrado con el email: ${email}`);
          }
        }
      }
      
      // Generar ID automático para nuevos usuarios
      const nuevoUsuario = {
        ...usuario,
        activo: true,
        fecha_registro: new Date().toISOString()
      };
      
      return this.db.list('Katzen/Usuarios').push(nuevoUsuario).then((result) => {
        const generatedId = result.key;
        if (generatedId) {
          return this.db.object(`Katzen/Usuarios/${generatedId}`).update({ id: generatedId });
        }
        return Promise.resolve();
      });
    } else {
      // Actualizar usuario existente
      return this.db.object(`Katzen/Usuarios/${usuario.id}`).set(usuario);
    }
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