import { TestBed } from '@angular/core/testing';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthSessionService } from '../core/services/auth-session.service';
import { LoggerService } from '../core/logger.service';

describe('AuthService.getActiveAuthUser', () => {
  let service: AuthService;
  let authState$: BehaviorSubject<{ uid: string } | null>;
  let currentUser: { uid: string } | null;
  let authSession: AuthSessionService;

  const logger = { log: jasmine.createSpy('log'), error: jasmine.createSpy('error') };
  const router = { navigate: jasmine.createSpy('navigate').and.resolveTo(true) };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    authState$ = new BehaviorSubject<{ uid: string } | null>(null);
    currentUser = null;

    const afAuth = {
      authState: authState$.asObservable(),
      get currentUser() {
        return currentUser;
      },
      signOut: jasmine.createSpy('signOut').and.resolveTo(undefined)
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        AuthSessionService,
        { provide: AngularFireAuth, useValue: afAuth },
        { provide: Router, useValue: router },
        { provide: LoggerService, useValue: logger }
      ]
    });

    service = TestBed.inject(AuthService);
    authSession = TestBed.inject(AuthSessionService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('espera authState cuando hay sesión de pestaña aunque currentUser sea null al inicio', async () => {
    authSession.startSession('staff-tab', false);

    const promise = service.getActiveAuthUser();

    await new Promise(r => setTimeout(r, 50));
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
  });

  it('retorna null sin marcador de sesión si Firebase no resuelve a tiempo', async () => {
    currentUser = null;
    authState$.next(null);

    const user = await service.getActiveAuthUser();
    expect(user).toBeNull();
  });

  it('usa sesión recordada en localStorage', async () => {
    authSession.startSession('staff-remember', true);
    currentUser = { uid: 'staff-remember' };
    authState$.next({ uid: 'staff-remember' });

    const user = await service.getActiveAuthUser();
    expect(user?.uid).toBe('staff-remember');
  });
});
