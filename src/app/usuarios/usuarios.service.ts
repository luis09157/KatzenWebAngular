import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  FirebaseFunctionsService,
  ProvisionStaffInput,
  UpdateStaffInput
} from '../core/services/firebase-functions.service';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  constructor(
    private db: AngularFireDatabase,
    private firebaseFunctions: FirebaseFunctionsService
  ) {}

  getUsuarios(): Observable<any> {
    return this.db.list('Katzen/Usuarios').snapshotChanges().pipe(
      map(changes => changes
        .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
        .filter(usuario => usuario.activo !== false)
        .sort((a, b) => {
          const fechaA = new Date(a.fecha_registro || a.fecha_creacion || a.created_at || 0);
          const fechaB = new Date(b.fecha_registro || b.fecha_creacion || b.created_at || 0);
          return fechaB.getTime() - fechaA.getTime();
        })
      )
    );
  }

  getUsuario(id: string): Observable<any> {
    return this.db.object(`Katzen/Usuarios/${id}`).valueChanges();
  }

  /** Alta unificada: Auth + AuthPerfiles + Usuarios vía Cloud Function. */
  async provisionarUsuarioStaff(usuario: ProvisionStaffInput): Promise<{ uid: string }> {
    const email = String(usuario.email || '').trim().toLowerCase();
    const usuariosExistentes = await firstValueFrom(this.getUsuarios());
    const emailDuplicado = usuariosExistentes.find(u =>
      (u.correo === email || u.email === email) && u.activo !== false
    );
    if (emailDuplicado) {
      throw new Error(`Ya existe un usuario registrado con el email: ${email}`);
    }

    const result = await this.firebaseFunctions.provisionStaffUser({
      email,
      password: usuario.password,
      nombre: usuario.nombre,
      telefono: usuario.telefono,
      perfil: usuario.perfil
    });

    if (!result.success || !result.uid) {
      throw new Error(result.message || 'No se pudo provisionar el usuario');
    }

    return { uid: result.uid };
  }

  /** Actualización unificada en RTDB + Auth + claims. */
  async actualizarUsuarioStaff(uid: string, cambios: UpdateStaffInput): Promise<void> {
    const result = await this.firebaseFunctions.updateStaffUser({ uid, ...cambios });
    if (!result.success) {
      throw new Error(result.message || 'No se pudo actualizar el usuario');
    }
  }

  /** @deprecated Usar provisionarUsuarioStaff para altas nuevas. */
  async guardarUsuario(usuario: any): Promise<any> {
    if (!usuario.id) {
      throw new Error('Use provisionarUsuarioStaff para crear usuarios con acceso al sistema.');
    }
    return this.db.object(`Katzen/Usuarios/${usuario.id}`).set(usuario);
  }

  actualizarUsuario(id: string, cambios: Partial<any>) {
    return this.db.object(`Katzen/Usuarios/${id}`).update(cambios);
  }
}
