import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { AuthSessionService } from '../core/services/auth-session.service';
import { FirebaseFunctionsService } from '../core/services/firebase-functions.service';

/**
 * Rutas de login staff (`/admin/login`, `/auth`).
 * Si Auth ya tiene un user staff, redirige a `/admin/inicio` antes de pintar el formulario.
 */
@Injectable({ providedIn: 'root' })
export class StaffLoginGuestGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private authProfile: AuthProfileService,
    private authSession: AuthSessionService,
    private firebaseFunctions: FirebaseFunctionsService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    const user = await this.authService.getActiveAuthUser();
    if (!user) {
      return true;
    }

    try {
      await this.firebaseFunctions.syncMyClaims();
    } catch {
      // Perfil RTDB / claims locales siguen siendo suficientes para decidir.
    }

    if (this.authSession.isPortalEntryLocked()) {
      if (await this.authProfile.hasClientAccess()) {
        await this.router.navigate(['/portal/mascotas']);
        return false;
      }
      return true;
    }

    if (await this.authProfile.hasStaffAccess()) {
      this.authSession.setStaffEntryIntent(true);
      await this.router.navigate(['/admin/inicio']);
      return false;
    }

    if (await this.authProfile.hasClientAccess()) {
      await this.router.navigate(['/portal/mascotas']);
      return false;
    }

    return true;
  }
}
