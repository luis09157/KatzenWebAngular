import { Injectable } from '@angular/core';

export const AUTH_SESSION_LOCAL_KEY = 'katzen.auth.session.v1';
export const AUTH_SESSION_TAB_KEY = 'katzen.auth.session.tab.v1';
/** Entrada por portal (landing /portal/login): bloquea UI y rutas admin en esta sesión. */
export const AUTH_PORTAL_LOCK_LOCAL_KEY = 'katzen.auth.portalLock.v1';
export const AUTH_PORTAL_LOCK_TAB_KEY = 'katzen.auth.portalLock.tab.v1';
/** Login staff: permite mostrar /auth/contexto. Sin este flag, contexto → portal. */
export const AUTH_STAFF_INTENT_KEY = 'katzen.auth.staffIntent.v1';
export const AUTH_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface StoredAuthSession {
  uid: string;
  issuedAt: number;
  remember: boolean;
  expiresAt?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  startSession(uid: string, remember: boolean): StoredAuthSession {
    // Preservar lock de entrada portal: ensureActiveSession puede re-crear sesión
    // y no debe abrir el selector admin a duales que entraron por landing.
    const portalLocked = this.isPortalEntryLocked();
    const staffIntent = this.hasStaffEntryIntent();

    localStorage.removeItem(AUTH_SESSION_LOCAL_KEY);
    sessionStorage.removeItem(AUTH_SESSION_TAB_KEY);

    const issuedAt = Date.now();
    const session: StoredAuthSession = {
      uid,
      issuedAt,
      remember,
      expiresAt: remember ? issuedAt + AUTH_SESSION_TTL_MS : undefined
    };

    const storage = remember ? localStorage : sessionStorage;
    const key = remember ? AUTH_SESSION_LOCAL_KEY : AUTH_SESSION_TAB_KEY;
    storage.setItem(key, JSON.stringify(session));

    if (portalLocked) {
      this.setPortalEntryLock(true);
    }
    if (staffIntent) {
      this.setStaffEntryIntent(true);
    }
    return session;
  }

  clearSession(): void {
    localStorage.removeItem(AUTH_SESSION_LOCAL_KEY);
    sessionStorage.removeItem(AUTH_SESSION_TAB_KEY);
    this.clearPortalLock();
    this.clearStaffEntryIntent();
  }

  /**
   * Login desde landing / portal: no mostrar selector ni panel admin
   * aunque el UID tenga dualAccess (aislamiento de punto de entrada).
   */
  setPortalEntryLock(locked: boolean): void {
    this.clearPortalLock();
    if (!locked) {
      return;
    }
    this.clearStaffEntryIntent();
    const session = this.getSession();
    const remember = !!session?.remember;
    const storage = remember ? localStorage : sessionStorage;
    const key = remember ? AUTH_PORTAL_LOCK_LOCAL_KEY : AUTH_PORTAL_LOCK_TAB_KEY;
    storage.setItem(key, '1');
    if (remember) {
      sessionStorage.setItem(AUTH_PORTAL_LOCK_TAB_KEY, '1');
    }
  }

  isPortalEntryLocked(): boolean {
    return (
      localStorage.getItem(AUTH_PORTAL_LOCK_LOCAL_KEY) === '1' ||
      sessionStorage.getItem(AUTH_PORTAL_LOCK_TAB_KEY) === '1'
    );
  }

  clearPortalLock(): void {
    localStorage.removeItem(AUTH_PORTAL_LOCK_LOCAL_KEY);
    sessionStorage.removeItem(AUTH_PORTAL_LOCK_TAB_KEY);
  }

  /** Marca que el usuario entró por /admin/login (único origen del selector dual). */
  setStaffEntryIntent(enabled: boolean): void {
    this.clearStaffEntryIntent();
    if (!enabled) {
      return;
    }
    sessionStorage.setItem(AUTH_STAFF_INTENT_KEY, '1');
  }

  hasStaffEntryIntent(): boolean {
    return sessionStorage.getItem(AUTH_STAFF_INTENT_KEY) === '1';
  }

  clearStaffEntryIntent(): void {
    sessionStorage.removeItem(AUTH_STAFF_INTENT_KEY);
  }

  getSession(): StoredAuthSession | null {
    return (
      this.readSession(localStorage, AUTH_SESSION_LOCAL_KEY) ??
      this.readSession(sessionStorage, AUTH_SESSION_TAB_KEY)
    );
  }

  getRememberedSession(): StoredAuthSession | null {
    const session = this.readSession(localStorage, AUTH_SESSION_LOCAL_KEY);
    if (!session?.remember || this.isExpired(session)) {
      return null;
    }
    return session;
  }

  isRememberedSessionActive(): boolean {
    return this.getRememberedSession() !== null;
  }

  isExpired(session: StoredAuthSession | null = this.getSession()): boolean {
    if (!session || !session.remember) {
      return false;
    }
    return Date.now() > (session.expiresAt ?? 0);
  }

  isValidForUid(uid: string): boolean {
    const session = this.getSession();
    if (!session) {
      return false;
    }
    return session.uid === uid && !this.isExpired(session);
  }

  private readSession(storage: Storage, key: string): StoredAuthSession | null {
    try {
      const raw = storage.getItem(key);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as StoredAuthSession;
      if (!parsed?.uid) {
        return null;
      }

      if (parsed.remember === undefined && parsed.expiresAt) {
        parsed.remember = true;
      }

      return parsed;
    } catch {
      return null;
    }
  }
}
