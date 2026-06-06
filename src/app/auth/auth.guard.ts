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

    await this.firebaseFunctions.syncMyClaims();

    const isStaff = await this.authProfileService.isStaff();
    if (!isStaff) {
      this.logger.log('AuthGuard: sin perfil staff');
      await this.authService.logout();
      return false;
    }

    return true;
  }
}
