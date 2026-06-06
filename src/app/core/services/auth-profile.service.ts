import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  mapUsuarioPerfilToStaffRole,
  modulesForStaffRole,
  normalizeStaffRole,
  staffRoleCanAccessModule,
  StaffModule
} from '../config/staff-role.config';

export interface AuthPerfil {
  authUid?: string;
  email?: string;
  role?: 'staff' | 'client' | 'dual' | string;
  roles?: string[];
  staffRole?: string;
  clienteId?: string;
  activo?: boolean;
}

export interface AuthAccess {
  staffAccess: boolean;
  clientAccess: boolean;
  perfil: AuthPerfil | null;
  clienteId?: string;
  staffRole?: string;
}

function normalizedRoles(perfil: AuthPerfil | null): Set<string> {
  const list = Array.isArray(perfil?.roles) ? perfil!.roles! : [];
  const legacy = perfil?.role ? [perfil.role] : [];
  return new Set([...list, ...legacy].map(r => String(r).toLowerCase()));
}

export function hasStaffAccess(perfil: AuthPerfil | null): boolean {
  if (!perfil || perfil.activo === false) return false;
  const r = normalizedRoles(perfil);
  return r.has('staff') || perfil.role === 'staff' || perfil.role === 'dual';
}

export function hasClientAccess(perfil: AuthPerfil | null): boolean {
  if (!perfil || perfil.activo === false || !perfil.clienteId) return false;
  const r = normalizedRoles(perfil);
  return r.has('client') || perfil.role === 'client' || perfil.role === 'dual';
}

export function isDual(perfil: AuthPerfil | null): boolean {
  return hasStaffAccess(perfil) && hasClientAccess(perfil);
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

  /** Fallback desde custom claims (paridad AuthRoleHelper.kt sessionFromClaims). */
  async getAccessFromClaims(): Promise<Omit<AuthAccess, 'perfil'>> {
    const user = await this.afAuth.currentUser;
    if (!user) {
      return { staffAccess: false, clientAccess: false };
    }

    const token = await user.getIdTokenResult();
    const roleClaim = token.claims['role'] as string | undefined;
    const clienteId = token.claims['clienteId'] as string | undefined;
    const staffRole = token.claims['staffRole'] as string | undefined;
    const dualAccess = token.claims['dualAccess'] === true;

    const staffAccess = roleClaim === 'staff' || dualAccess;
    const clientAccess =
      roleClaim === 'client' ||
      (dualAccess && !!clienteId);

    return { staffAccess, clientAccess, clienteId, staffRole };
  }

  /** Perfil RTDB primero; claims solo si no hay perfil en RTDB. */
  async resolveAccess(): Promise<AuthAccess> {
    const perfil = await this.getMyProfile();

    if (perfil) {
      if (perfil.activo === false) {
        return { staffAccess: false, clientAccess: false, perfil };
      }

      const staffAccess = hasStaffAccess(perfil);
      const clientAccess = hasClientAccess(perfil);
      return {
        staffAccess,
        clientAccess,
        perfil,
        clienteId: perfil.clienteId,
        staffRole: perfil.staffRole
      };
    }

    const claims = await this.getAccessFromClaims();
    return {
      ...claims,
      perfil: null
    };
  }

  async hasStaffAccess(): Promise<boolean> {
    const access = await this.resolveAccess();
    return access.staffAccess;
  }

  async hasClientAccess(): Promise<boolean> {
    const access = await this.resolveAccess();
    return access.clientAccess;
  }

  async isDual(): Promise<boolean> {
    const access = await this.resolveAccess();
    return access.staffAccess && access.clientAccess;
  }

  async getClienteId(): Promise<string | null> {
    const access = await this.resolveAccess();
    if (!access.clientAccess) return null;
    return access.clienteId || access.perfil?.clienteId || null;
  }

  async isAdministrator(): Promise<boolean> {
    const staffRole = await this.getEffectiveStaffRole();
    return staffRole === 'administrador';
  }

  /** Rol operativo normalizado (AuthPerfiles → claims → Katzen/Usuarios). */
  async getEffectiveStaffRole(): Promise<string> {
    const access = await this.resolveAccess();
    const fromProfile = normalizeStaffRole(access.staffRole || access.perfil?.staffRole);
    if (fromProfile) {
      return fromProfile;
    }

    const user = await this.afAuth.currentUser;
    if (!user?.uid) {
      return 'doctor';
    }

    const usuario = await firstValueFrom(
      this.db.object<{ perfil?: string }>(`Katzen/Usuarios/${user.uid}`).valueChanges().pipe(take(1))
    );
    return mapUsuarioPerfilToStaffRole(usuario?.perfil);
  }

  async canAccessModule(module: StaffModule): Promise<boolean> {
    const access = await this.resolveAccess();
    if (!access.staffAccess) {
      return false;
    }
    const staffRole = await this.getEffectiveStaffRole();
    return staffRoleCanAccessModule(staffRole, module);
  }

  async getAccessibleModules(): Promise<StaffModule[]> {
    const access = await this.resolveAccess();
    if (!access.staffAccess) {
      return [];
    }
    const staffRole = await this.getEffectiveStaffRole();
    return modulesForStaffRole(staffRole);
  }

  /** @deprecated Usar hasStaffAccess() */
  async isStaff(): Promise<boolean> {
    return this.hasStaffAccess();
  }

  /** @deprecated Usar hasClientAccess() */
  async isClient(): Promise<boolean> {
    return this.hasClientAccess();
  }
}
