import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { firstValueFrom } from 'rxjs';
import { map, take } from 'rxjs/operators';

export interface AuthPerfil {
  authUid?: string;
  email?: string;
  role?: 'staff' | 'client' | string;
  staffRole?: string;
  clienteId?: string;
  activo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthProfileService {
  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFireDatabase
  ) {}

  async getMyProfile(): Promise<AuthPerfil | null> {
    const user = await this.afAuth.currentUser;
    if (!user) return null;

    const perfil = await firstValueFrom(
      this.db.object<AuthPerfil>(`Katzen/AuthPerfiles/${user.uid}`).valueChanges().pipe(take(1))
    );
    return perfil || null;
  }

  async isStaff(): Promise<boolean> {
    const perfil = await this.getMyProfile();
    return !!perfil && perfil.activo !== false && perfil.role === 'staff';
  }

  async isClient(): Promise<boolean> {
    const perfil = await this.getMyProfile();
    return !!perfil && perfil.activo !== false && perfil.role === 'client' && !!perfil.clienteId;
  }
}
