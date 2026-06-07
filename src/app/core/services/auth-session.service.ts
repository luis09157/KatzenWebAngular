import { Injectable } from '@angular/core';

export const AUTH_SESSION_LOCAL_KEY = 'katzen.auth.session.v1';
export const AUTH_SESSION_TAB_KEY = 'katzen.auth.session.tab.v1';
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
    this.clearSession();

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
    return session;
  }

  clearSession(): void {
    localStorage.removeItem(AUTH_SESSION_LOCAL_KEY);
    sessionStorage.removeItem(AUTH_SESSION_TAB_KEY);
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
