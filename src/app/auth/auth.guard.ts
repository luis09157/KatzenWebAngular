import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { FirebaseFunctionsService } from '../core/services/firebase-functions.service';
import { LoggerService } from '../core/logger.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private authProfileService: AuthProfileService,
    private firebaseFunctions: FirebaseFunctionsService,
    private router: Router,
    private logger: LoggerService
  ) {}

  async canActivate(): Promise<boolean> {
    const isAuth = await this.authService.isAuthenticatedOnce();
    if (!isAuth) {
      this.logger.log('AuthGuard: no autenticado');
      await this.router.navigate(['/admin/login']);
      return false;
    }

    if (!(await this.authService.ensureActiveSession())) {
      await this.router.navigate(['/admin/login']);
      return false;
    }

    await this.firebaseFunctions.syncMyClaims();

    const hasStaff = await this.authProfileService.hasStaffAccess();
    if (!hasStaff) {
      this.logger.log('AuthGuard: sin acceso staff');
      await this.authService.logout();
      return false;
    }

    return true;
  }
}
