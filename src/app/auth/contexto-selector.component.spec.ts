import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { ContextoSelectorComponent } from './contexto-selector.component';
import { AuthService } from './auth.service';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { AuthSessionService } from '../core/services/auth-session.service';
import { FirebaseFunctionsService } from '../core/services/firebase-functions.service';
import { AppCheckService } from '../core/app-check.service';

describe('ContextoSelectorComponent', () => {
  let component: ContextoSelectorComponent;
  let fixture: ComponentFixture<ContextoSelectorComponent>;

  const authService = {
    waitForAuthUser: jasmine.createSpy('waitForAuthUser').and.resolveTo(null),
    signOutOnly: jasmine.createSpy('signOutOnly').and.resolveTo(undefined),
  };
  const authProfileService = {
    resolveAccess: jasmine.createSpy('resolveAccess').and.resolveTo({
      staffAccess: true,
      clientAccess: true,
      perfil: null,
    }),
  };
  const authSession = {
    hasPendingContextChoice: jasmine.createSpy('hasPendingContextChoice').and.returnValue(false),
    hasStaffEntryIntent: jasmine.createSpy('hasStaffEntryIntent').and.returnValue(false),
    isPortalEntryLocked: jasmine.createSpy('isPortalEntryLocked').and.returnValue(false),
    setPortalEntryLock: jasmine.createSpy('setPortalEntryLock'),
    clearPendingContextChoice: jasmine.createSpy('clearPendingContextChoice'),
    setStaffEntryIntent: jasmine.createSpy('setStaffEntryIntent'),
  };
  const firebaseFunctions = {
    syncMyClaims: jasmine.createSpy('syncMyClaims').and.resolveTo(null),
  };
  const appCheck = { ensureInitialized: jasmine.createSpy('ensureInitialized') };
  const router = { navigate: jasmine.createSpy('navigate').and.resolveTo(true) };

  beforeEach(async () => {
    authService.waitForAuthUser.and.resolveTo(null);
    authSession.hasPendingContextChoice.and.returnValue(false);
    authSession.hasStaffEntryIntent.and.returnValue(false);
    authSession.isPortalEntryLocked.and.returnValue(false);
    firebaseFunctions.syncMyClaims.and.resolveTo(null);
    authProfileService.resolveAccess.and.resolveTo({
      staffAccess: true,
      clientAccess: true,
      perfil: null,
    });

    await TestBed.configureTestingModule({
      declarations: [ContextoSelectorComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AuthProfileService, useValue: authProfileService },
        { provide: AuthSessionService, useValue: authSession },
        { provide: FirebaseFunctionsService, useValue: firebaseFunctions },
        { provide: AppCheckService, useValue: appCheck },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ContextoSelectorComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    authService.waitForAuthUser.calls.reset();
    authProfileService.resolveAccess.calls.reset();
    authSession.hasPendingContextChoice.calls.reset();
    authSession.hasStaffEntryIntent.calls.reset();
    authSession.isPortalEntryLocked.calls.reset();
    firebaseFunctions.syncMyClaims.calls.reset();
    appCheck.ensureInitialized.calls.reset();
    router.navigate.calls.reset();
  });

  it('sin sesión manda al login', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
  });

  it('con chooser pendiente muestra destinos aunque syncMyClaims no responda', async () => {
    authService.waitForAuthUser.and.resolveTo({ uid: 'dual-1' });
    authSession.hasPendingContextChoice.and.returnValue(true);
    firebaseFunctions.syncMyClaims.and.returnValue(new Promise(() => undefined));

    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(component.loading).toBeFalse();
    expect(component.error).toBe('');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('si el perfil no responde y hay chooser, deja los dos destinos', async () => {
    authService.waitForAuthUser.and.resolveTo({ uid: 'dual-1' });
    authSession.hasPendingContextChoice.and.returnValue(true);
    authProfileService.resolveAccess.and.returnValue(Promise.reject(new Error('red')));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.loading).toBeFalse();
    expect(component.error).toBe('');
    expect(appCheck.ensureInitialized).toHaveBeenCalled();
  });
});
