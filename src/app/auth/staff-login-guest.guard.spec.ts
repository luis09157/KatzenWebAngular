import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { StaffLoginGuestGuard } from './staff-login-guest.guard';
import { AuthService } from './auth.service';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { AuthSessionService } from '../core/services/auth-session.service';
import { FirebaseFunctionsService } from '../core/services/firebase-functions.service';

describe('StaffLoginGuestGuard', () => {
  let guard: StaffLoginGuestGuard;

  const authService = {
    getActiveAuthUser: jasmine.createSpy('getActiveAuthUser').and.resolveTo(null)
  };
  const authProfile = {
    hasStaffAccess: jasmine.createSpy('hasStaffAccess').and.resolveTo(false),
    hasClientAccess: jasmine.createSpy('hasClientAccess').and.resolveTo(false)
  };
  const authSession = {
    isPortalEntryLocked: jasmine.createSpy('isPortalEntryLocked').and.returnValue(false),
    setStaffEntryIntent: jasmine.createSpy('setStaffEntryIntent')
  };
  const firebaseFunctions = {
    syncMyClaims: jasmine.createSpy('syncMyClaims').and.resolveTo(undefined)
  };
  const router = {
    navigate: jasmine.createSpy('navigate').and.resolveTo(true)
  };

  beforeEach(() => {
    authService.getActiveAuthUser.and.resolveTo(null);
    authProfile.hasStaffAccess.and.resolveTo(false);
    authProfile.hasClientAccess.and.resolveTo(false);
    authSession.isPortalEntryLocked.and.returnValue(false);
    router.navigate.calls.reset();
    authSession.setStaffEntryIntent.calls.reset();

    TestBed.configureTestingModule({
      providers: [
        StaffLoginGuestGuard,
        { provide: AuthService, useValue: authService },
        { provide: AuthProfileService, useValue: authProfile },
        { provide: AuthSessionService, useValue: authSession },
        { provide: FirebaseFunctionsService, useValue: firebaseFunctions },
        { provide: Router, useValue: router }
      ]
    });

    guard = TestBed.inject(StaffLoginGuestGuard);
  });

  it('sin sesión permite pintar el formulario', async () => {
    authService.getActiveAuthUser.and.resolveTo(null);
    await expectAsync(guard.canActivate()).toBeResolvedTo(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('con sesión staff redirige a /admin/inicio', async () => {
    authService.getActiveAuthUser.and.resolveTo({ uid: 'staff-1' });
    authProfile.hasStaffAccess.and.resolveTo(true);

    await expectAsync(guard.canActivate()).toBeResolvedTo(false);
    expect(authSession.setStaffEntryIntent).toHaveBeenCalledWith(true);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/inicio']);
  });

  it('con sesión dual desde login staff redirige a /admin/inicio', async () => {
    authService.getActiveAuthUser.and.resolveTo({ uid: 'dual-1' });
    authProfile.hasStaffAccess.and.resolveTo(true);
    authProfile.hasClientAccess.and.resolveTo(true);

    await expectAsync(guard.canActivate()).toBeResolvedTo(false);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/inicio']);
    expect(router.navigate).not.toHaveBeenCalledWith(['/auth/contexto']);
  });
});
