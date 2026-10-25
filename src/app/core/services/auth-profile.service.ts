import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AuthService } from '../../auth/auth.service';
import {
  mapUsuarioPerfilToStaffRole,
  modulesForStaffRole,
  normalizeStaffRole,
  staffRoleCanAccessModule,
  StaffModule,
} from '../config/staff-role.config';
import { LoggerService } from '../logger.service';
import { accessFromAuthClaims, ClaimsAccess } from '../utils/auth-claims-access.util';
import {
  firstRtdbValue,
  isRtdbReadTimeout,
  isRtdbUnavailableError,
  RTDB_TIMEOUT_ACCESS_CACHE_MS,
  rtdbUnavailableError,
} from '../utils/rtdb-read-timeout.util';

export interface AuthPerfil {
  authUid?: string;
  email?: string;
  role?: 'staff' | 'client' | 'dual' | string;
  roles?: string[];
  staffRole?: string;
  clienteId?: string;
  activo?: boolean;
  mustChangePassword?: boolean;
}

export interface AuthAccess {
  staffAccess: boolean;
  clientAccess: boolean;
  perfil: AuthPerfil | null;
  clienteId?: string;
  staffRole?: string;
  mustChangePassword?: boolean;
}

function normalizedRoles(perfil: AuthPerfil | null): Set<string> {
  const list = Array.isArray(perfil?.roles) ? perfil!.roles! : [];
  const legacy = perfil?.role ? [perfil.role] : [];
  return new Set([...list, ...legacy].map((r) => String(r).toLowerCase()));
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

/**
 * Une perfil RTDB + claims.
 * Si el socket no respondió y el token tampoco trae acceso, lanza `rtdb-unavailable`
 * (el login no debe decir «sin perfil» ni quedarse en el spinner).
 */
export function resolveAccessFromSources(
  perfil: AuthPerfil | null,
  claims: ClaimsAccess,
  rtdbTimedOut: boolean
): AuthAccess {
  if (perfil?.activo === false) {
    return { staffAccess: false, clientAccess: false, perfil };
  }

  const staffAccess = hasStaffAccess(perfil) || claims.staffAccess;
  const clientAccess = hasClientAccess(perfil) || claims.clientAccess;

  if (rtdbTimedOut && !staffAccess && !clientAccess) {
    throw rtdbUnavailableError();
  }

  return {
    staffAccess,
    clientAccess,
    perfil,
    clienteId: perfil?.clienteId || claims.clienteId,
    staffRole: perfil?.staffRole || claims.staffRole,
    mustChangePassword: perfil?.mustChangePassword === true || claims.mustChangePassword === true,
  };
}

@Injectable({ providedIn: 'root' })
export class AuthProfileService {
  /** Solo cuando el socket falló y los claims sí alcanzaron para decidir. */
  private timeoutAccessCache: { uid: string; at: number; value: AuthAccess } | null = null;
  /** El guard y el login preguntan seguido: no repetir el tope de 8 s en la misma pasada. */
  private timeoutFailure: { uid: string; at: number; error: unknown } | null = null;
  private accessInflight: { uid: string; promise: Promise<AuthAccess> } | null = null;
  private readonly failureReuseMs = 3000;

  constructor(
    private db: AngularFireDatabase,
    private authService: AuthService,
    private logger: LoggerService
  ) {}

  async getMyProfile(): Promise<AuthPerfil | null> {
    const user = await this.authService.waitForAuthUser();
    if (!user) return null;

    const read = await this.readPerfil(user.uid);
    return read.perfil;
  }

  private async readPerfil(uid: string): Promise<{ perfil: AuthPerfil | null; timedOut: boolean }> {
    try {
      const perfil = await firstRtdbValue(this.db.object<AuthPerfil>(`Katzen/AuthPerfiles/${uid}`).valueChanges());
      return { perfil: perfil || null, timedOut: false };
    } catch (error) {
      // Timeout, websocket cerrado o 500 del handshake: mismo camino.
      // Si relanzamos, el guard cancela la navegación y el login queda en blanco.
      this.logger.warn(
        isRtdbReadTimeout(error) ? 'AuthPerfiles no respondió a tiempo' : 'AuthPerfiles no se pudo leer',
        error
      );
      return { perfil: null, timedOut: true };
    }
  }

  /** Fallback desde custom claims (paridad AuthRoleHelper.kt sessionFromClaims). */
  async getAccessFromClaims(): Promise<Omit<AuthAccess, 'perfil'>> {
    const user = await this.authService.waitForAuthUser();
    if (!user) {
      return { staffAccess: false, clientAccess: false };
    }

    const token = await user.getIdTokenResult();
    return accessFromAuthClaims(token.claims as Record<string, unknown>);
  }

  /**
   * Une perfil RTDB + custom claims. En local (Auth real + RTDB emu)
   * el UID de clínica no está en el emulador; los claims del token
   * siguen mostrando staff + dueño.
   */
  async resolveAccess(): Promise<AuthAccess> {
    const user = await this.authService.waitForAuthUser();
    const uid = user?.uid ?? '';
    const cached = this.timeoutAccessCache;
    if (uid && cached && cached.uid === uid && Date.now() - cached.at < RTDB_TIMEOUT_ACCESS_CACHE_MS) {
      return cached.value;
    }
    if (uid && this.accessInflight?.uid === uid) {
      return this.accessInflight.promise;
    }
    const recentFailure = this.timeoutFailure;
    if (uid && recentFailure?.uid === uid && Date.now() - recentFailure.at < this.failureReuseMs) {
      throw recentFailure.error;
    }

    const promise = this.resolveAccessUncached(user);
    if (uid) {
      this.accessInflight = { uid, promise };
    }
    try {
      const access = await promise;
      if (uid && this.timeoutFailure?.uid === uid) {
        this.timeoutFailure = null;
      }
      return access;
    } catch (error) {
      if (uid && isRtdbUnavailableError(error)) {
        this.timeoutFailure = { uid, at: Date.now(), error };
      }
      throw error;
    } finally {
      if (this.accessInflight?.promise === promise) {
        this.accessInflight = null;
      }
    }
  }

  private async resolveAccessUncached(user: { uid: string } | null): Promise<AuthAccess> {
    let perfil: AuthPerfil | null = null;
    let rtdbTimedOut = false;
    if (user?.uid) {
      const read = await this.readPerfil(user.uid);
      perfil = read.perfil;
      rtdbTimedOut = read.timedOut;
    }

    let claims: ClaimsAccess = { staffAccess: false, clientAccess: false };
    try {
      claims = await this.getAccessFromClaims();
    } catch {
      // Token claims no disponibles (red / Auth); se usa solo el perfil RTDB.
    }

    const access = resolveAccessFromSources(perfil, claims, rtdbTimedOut);
    if (rtdbTimedOut && user?.uid) {
      this.timeoutAccessCache = { uid: user.uid, at: Date.now(), value: access };
    }
    return access;
  }

  async hasStaffAccess(): Promise<boolean> {
    const access = await this.resolveAccess();
    return access.staffAccess;
  }

  async hasClientAccess(): Promise<boolean> {
    const access = await this.resolveAccess();
    return access.clientAccess;
  }

  /** Requiere cambio de contraseña (perfil RTDB o custom claim). */
  async mustChangePassword(): Promise<boolean> {
    const access = await this.resolveAccess();
    if (access.mustChangePassword === true) return true;
    if (access.perfil?.mustChangePassword === false) return false;

    const user = await this.authService.waitForAuthUser();
    if (!user) return false;
    const token = await user.getIdTokenResult();
    return token.claims['mustChangePassword'] === true;
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
    return staffRole === 'administrador' || staffRole === 'super_admin';
  }

  /** Rol operativo normalizado (AuthPerfiles → claims → Katzen/Usuarios). */
  async getEffectiveStaffRole(): Promise<string> {
    const access = await this.resolveAccess();
    const fromProfile = normalizeStaffRole(access.staffRole || access.perfil?.staffRole);
    if (fromProfile) {
      return fromProfile;
    }

    const user = await this.authService.waitForAuthUser();
    if (!user?.uid) {
      return 'doctor';
    }

    try {
      const usuario = await firstRtdbValue(
        this.db.object<{ perfil?: string }>(`Katzen/Usuarios/${user.uid}`).valueChanges()
      );
      return mapUsuarioPerfilToStaffRole(usuario?.perfil);
    } catch (error) {
      if (!isRtdbReadTimeout(error)) {
        throw error;
      }
      this.logger.warn('Usuarios no respondió a tiempo; rol por defecto');
      return mapUsuarioPerfilToStaffRole(undefined);
    }
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
