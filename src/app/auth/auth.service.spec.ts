import { TestBed } from '@angular/core/testing';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthSessionService } from '../core/services/auth-session.service';
import { LoggerService } from '../core/logger.service';

describe('AuthService.getActiveAuthUser', () => {
  let service: AuthService;
  let authState$: BehaviorSubject<{ uid: string } | null>;
  let currentUser: { uid: string } | null;
  let authSession: AuthSessionService;
  let signOut: jasmine.Spy;
  let afAuth: {
    authState: ReturnType<BehaviorSubject<{ uid: string } | null>['asObservable']>;
    currentUser: { uid: string } | null | Promise<{ uid: string } | null>;
    signOut: jasmine.Spy;
    authStateReady?: () => Promise<void>;
  };

  const logger = { log: jasmine.createSpy('log'), error: jasmine.createSpy('error') };
  const router = {
    navigate: jasmine.createSpy('navigate').and.resolveTo(true),
    navigateByUrl: jasmine.createSpy('navigateByUrl').and.resolveTo(true),
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    authState$ = new BehaviorSubject<{ uid: string } | null>(null);
    currentUser = null;
    signOut = jasmine.createSpy('signOut').and.resolveTo(undefined);

    afAuth = {
      authState: authState$.asObservable(),
      get currentUser() {
        return currentUser;
      },
      signOut,
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        AuthSessionService,
        { provide: AngularFireAuth, useValue: afAuth },
        { provide: Router, useValue: router },
        { provide: LoggerService, useValue: logger },
      ],
    });

    service = TestBed.inject(AuthService);
    authSession = TestBed.inject(AuthSessionService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('no toma el null inicial de authState: espera el user (race Firebase)', async () => {
    authSession.startSession('staff-race', false);
    const promise = service.getActiveAuthUser();

    await new Promise((r) => setTimeout(r, 40));
    currentUser = { uid: 'staff-race' };
    authState$.next({ uid: 'staff-race' });

    const user = await promise;
    expect(user?.uid).toBe('staff-race');
    expect(signOut).not.toHaveBeenCalled();
  });

  it('sin marcador Katzen no recrea sesión (evita re-login tras Cerrar sesión)', async () => {
    expect(sessionStorage.getItem('katzen.auth.session.tab.v1')).toBeNull();
    expect(localStorage.getItem('katzen.auth.session.v1')).toBeNull();

    currentUser = { uid: 'staff-local' };
    authState$.next({ uid: 'staff-local' });

    const user = await service.getActiveAuthUser();
    expect(user).toBeNull();
    expect(signOut).not.toHaveBeenCalled();
    expect(authSession.getSession()).toBeNull();
  });

  it('ensureActiveSession no bootstraps sin marcador (Auth residual tras logout)', async () => {
    currentUser = { uid: 'staff-boot' };
    authState$.next({ uid: 'staff-boot' });

    const ok = await service.ensureActiveSession({ bootstrapIfMissing: true });
    expect(ok).toBeFalse();
    expect(signOut).toHaveBeenCalled();
    expect(authSession.getSession()).toBeNull();
  });

  it('ensureActiveSession acepta sesión recordada vigente', async () => {
    authSession.startSession('staff-boot', true);
    currentUser = { uid: 'staff-boot' };
    authState$.next({ uid: 'staff-boot' });

    const ok = await service.ensureActiveSession({ bootstrapIfMissing: true });
    expect(ok).toBeTrue();
    expect(authSession.getSession()?.uid).toBe('staff-boot');
    expect(signOut).not.toHaveBeenCalled();
  });

  it('logout espera signOut y navega a login', async () => {
    authSession.startSession('staff-out', true);
    currentUser = { uid: 'staff-out' };
    router.navigateByUrl = jasmine.createSpy('navigateByUrl').and.resolveTo(true);

    await service.logout();

    expect(signOut).toHaveBeenCalled();
    expect(authSession.getSession()).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/login');
  });

  it('espera authState cuando hay sesión de pestaña aunque currentUser sea null al inicio', async () => {
    authSession.startSession('staff-tab', false);

    const promise = service.getActiveAuthUser();

    await new Promise((r) => setTimeout(r, 50));
    currentUser = { uid: 'staff-tab' };
    authState$.next({ uid: 'staff-tab' });

    const user = await promise;
    expect(user?.uid).toBe('staff-tab');
  });

  it('retorna null si la sesión de pestaña no coincide con Firebase', async () => {
    authSession.startSession('staff-tab', false);
    currentUser = { uid: 'other-user' };
    authState$.next({ uid: 'other-user' });

    const user = await service.getActiveAuthUser();
    expect(user).toBeNull();
    expect(signOut).not.toHaveBeenCalled();
  });

  it('retorna null cuando Auth asintió vacío (authStateReady)', async () => {
    afAuth.authStateReady = () => Promise.resolve();
    currentUser = null;
    authState$.next(null);

    const user = await service.getActiveAuthUser();
    expect(user).toBeNull();
  });

  it('tras authStateReady usa currentUser aunque authState hubiera emitido null primero', async () => {
    authSession.startSession('staff-ready', false);
    let resolveReady!: () => void;
    afAuth.authStateReady = () =>
      new Promise<void>((r) => {
        resolveReady = r;
      });
    currentUser = null;
    authState$.next(null);

    const promise = service.getActiveAuthUser();
    await new Promise((r) => setTimeout(r, 20));

    currentUser = { uid: 'staff-ready' };
    authState$.next({ uid: 'staff-ready' });
    resolveReady();

    const user = await promise;
    expect(user?.uid).toBe('staff-ready');
  });

  it('usa sesión recordada en localStorage', async () => {
    authSession.startSession('staff-remember', true);
    currentUser = { uid: 'staff-remember' };
    authState$.next({ uid: 'staff-remember' });

    const user = await service.getActiveAuthUser();
    expect(user?.uid).toBe('staff-remember');
  });
});
