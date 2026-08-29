import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { AuthSessionService } from '../core/services/auth-session.service';
import { FirebaseFunctionsService } from '../core/services/firebase-functions.service';
import { LoggerService } from '../core/logger.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private authProfileService: AuthProfileService,
    private authSession: AuthSessionService,
    private firebaseFunctions: FirebaseFunctionsService,
    private router: Router,
    private logger: LoggerService
  ) {}

  async canActivate(): Promise<boolean> {
    const user = await this.authService.waitForAuthUser();
    if (!user) {
      this.logger.log('AuthGuard: no autenticado');
      await this.router.navigate(['/admin/login']);
      return false;
    }

    if (!(await this.authService.ensureActiveSession())) {
      await this.router.navigate(['/admin/login']);
      return false;
    }

    await this.firebaseFunctions.syncMyClaims();

    // Sesión iniciada por portal/landing: no permitir panel admin (dual incluido).
    if (this.authSession.isPortalEntryLocked()) {
      this.logger.log('AuthGuard: bloqueado por entrada portal');
      await this.router.navigate(['/portal/mascotas']);
      return false;
    }

    const hasStaff = await this.authProfileService.hasStaffAccess();
    if (!hasStaff) {
      this.logger.log('AuthGuard: sin acceso staff');
      // Dual/client-only: no cerrar sesión a la fuerza si puede ir al portal
      if (await this.authProfileService.hasClientAccess()) {
        await this.router.navigate(['/portal/mascotas']);
        return false;
      }
      await this.authService.logout();
      return false;
    }

    return true;
  }
}
