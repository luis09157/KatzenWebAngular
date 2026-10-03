import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { AuthComponent } from './auth.component';
import { AuthService } from './auth.service';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { AuthSessionService } from '../core/services/auth-session.service';
import { AppCheckService } from '../core/app-check.service';
import { FirebaseFunctionsService } from '../core/services/firebase-functions.service';
import { PwaInstallService } from '../core/services/pwa-install.service';
import { PwaManifestService } from '../core/services/pwa-manifest.service';
import { BehaviorSubject } from 'rxjs';

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;

  const authService = {
    waitForAuthUser: jasmine.createSpy('waitForAuthUser').and.resolveTo(null),
    ensureActiveSession: jasmine.createSpy('ensureActiveSession').and.resolveTo(true),
    login: jasmine.createSpy('login'),
    logout: jasmine.createSpy('logout'),
    signOutOnly: jasmine.createSpy('signOutOnly').and.resolveTo(undefined),
  };
  const authProfileService = {
    hasStaffAccess: jasmine.createSpy('hasStaffAccess').and.resolveTo(false),
    hasClientAccess: jasmine.createSpy('hasClientAccess').and.resolveTo(false),
    isDual: jasmine.createSpy('isDual').and.resolveTo(false),
  };
  const authSession = {
    isPortalEntryLocked: jasmine.createSpy('isPortalEntryLocked').and.returnValue(false),
    setStaffEntryIntent: jasmine.createSpy('setStaffEntryIntent'),
    setPortalEntryLock: jasmine.createSpy('setPortalEntryLock'),
    setPendingContextChoice: jasmine.createSpy('setPendingContextChoice'),
    hasPendingContextChoice: jasmine.createSpy('hasPendingContextChoice').and.returnValue(false),
  };
  const appCheck = { ensureInitialized: jasmine.createSpy('ensureInitialized') };
  const firebaseFunctions = {
    syncMyClaims: jasmine.createSpy('syncMyClaims').and.resolveTo(undefined),
  };
  const router = {
    navigate: jasmine.createSpy('navigate').and.resolveTo(true),
  };
  const pwaInstall = {
    installAvailable$: new BehaviorSubject(false),
    init: jasmine.createSpy('init'),
    isStandalone: jasmine.createSpy('isStandalone').and.returnValue(false),
    showIosInstallHint: jasmine.createSpy('showIosInstallHint').and.returnValue(false),
    promptInstall: jasmine.createSpy('promptInstall').and.resolveTo('unavailable'),
  };
  const pwaManifest = {
    setKind: jasmine.createSpy('setKind'),
  };

  beforeEach(async () => {
    authService.waitForAuthUser.and.resolveTo(null);
    authService.ensureActiveSession.and.resolveTo(true);
    authProfileService.hasStaffAccess.and.resolveTo(false);
    authProfileService.hasClientAccess.and.resolveTo(false);
    authProfileService.isDual.and.resolveTo(false);
    authSession.isPortalEntryLocked.and.returnValue(false);
    authSession.hasPendingContextChoice.and.returnValue(false);

    await TestBed.configureTestingModule({
      declarations: [AuthComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AuthProfileService, useValue: authProfileService },
        { provide: AuthSessionService, useValue: authSession },
        { provide: AppCheckService, useValue: appCheck },
        { provide: FirebaseFunctionsService, useValue: firebaseFunctions },
        { provide: Router, useValue: router },
        { provide: PwaInstallService, useValue: pwaInstall },
        { provide: PwaManifestService, useValue: pwaManifest },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    authService.waitForAuthUser.calls.reset();
    authService.ensureActiveSession.calls.reset();
    authProfileService.hasStaffAccess.calls.reset();
    authProfileService.hasClientAccess.calls.reset();
    authProfileService.isDual.calls.reset();
    authSession.isPortalEntryLocked.calls.reset();
    authSession.setStaffEntryIntent.calls.reset();
    router.navigate.calls.reset();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('sin sesión activa muestra el formulario', async () => {
    authService.waitForAuthUser.and.resolveTo(null);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.checkingSession).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('con sesión staff redirige a /admin/inicio', async () => {
    authService.waitForAuthUser.and.resolveTo({ uid: 'staff-1' });
    authProfileService.hasStaffAccess.and.resolveTo(true);
    authProfileService.isDual.and.resolveTo(false);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(authSession.setStaffEntryIntent).toHaveBeenCalledWith(true);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/inicio']);
  });

  it('con sesión dual redirige a /admin/inicio (auto-enter, no contexto)', async () => {
    authService.waitForAuthUser.and.resolveTo({ uid: 'dual-1' });
    authProfileService.hasStaffAccess.and.resolveTo(true);
    authProfileService.isDual.and.resolveTo(true);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(authSession.setStaffEntryIntent).toHaveBeenCalledWith(true);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/inicio']);
    expect(router.navigate).not.toHaveBeenCalledWith(['/auth/contexto']);
  });

  it('con portalLock activo redirige al portal, no al admin', async () => {
    authService.waitForAuthUser.and.resolveTo({ uid: 'client-1' });
    authSession.isPortalEntryLocked.and.returnValue(true);
    authProfileService.hasClientAccess.and.resolveTo(true);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/portal/mascotas']);
    expect(authSession.setStaffEntryIntent).not.toHaveBeenCalled();
  });

  it('mantiene spinner mientras waitForAuthUser está pendiente', async () => {
    let resolveUser!: (user: { uid: string } | null) => void;
    authService.waitForAuthUser.and.returnValue(
      new Promise((resolve) => {
        resolveUser = resolve;
      })
    );

    fixture.detectChanges();
    expect(component.checkingSession).toBeTrue();

    authProfileService.hasStaffAccess.and.resolveTo(true);
    authProfileService.isDual.and.resolveTo(false);
    resolveUser({ uid: 'staff-tab' });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    expect(component.checkingSession).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/inicio']);
  });
});
