import {
  AuthSessionService,
  AUTH_PORTAL_LOCK_LOCAL_KEY,
  AUTH_PORTAL_LOCK_TAB_KEY
} from './auth-session.service';

describe('AuthSessionService portal entry lock', () => {
  let service: AuthSessionService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    service = new AuthSessionService();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('bloquea entrada portal en sessionStorage cuando remember=false', () => {
    service.startSession('uid-1', false);
    service.setPortalEntryLock(true);
    expect(service.isPortalEntryLocked()).toBe(true);
    expect(sessionStorage.getItem(AUTH_PORTAL_LOCK_TAB_KEY)).toBe('1');
    expect(localStorage.getItem(AUTH_PORTAL_LOCK_LOCAL_KEY)).toBeNull();
  });

  it('clearSession limpia el lock', () => {
    service.startSession('uid-1', true);
    service.setPortalEntryLock(true);
    service.clearSession();
    expect(service.isPortalEntryLocked()).toBe(false);
  });

  it('startSession no borra el portal lock (regresión dual → contexto)', () => {
    service.startSession('uid-1', false);
    service.setPortalEntryLock(true);
    expect(service.isPortalEntryLocked()).toBe(true);
    service.startSession('uid-1', false);
    expect(service.isPortalEntryLocked()).toBe(true);
  });
});
