import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { AuthSessionService } from '../core/services/auth-session.service';
import { FirebaseFunctionsService } from '../core/services/firebase-functions.service';
import { LOGIN_ROUTE_DEADLINE, settleLoginRoute } from '../core/utils/rtdb-read-timeout.util';

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
    try {
      const outcome = await settleLoginRoute((cancelled) => this.decide(cancelled));
      return outcome === LOGIN_ROUTE_DEADLINE ? true : outcome;
    } catch {
      // Un throw aquí cancela la navegación inicial y deja /admin/login en blanco.
      return true;
    }
  }

  private async decide(cancelled: () => boolean): Promise<boolean> {
    const user = await this.authService.waitForAuthUser();
    if (cancelled() || !user) {
      return true;
    }

    // Misma regla que AuthComponent: si hay marcador Katzen + Firebase user, entrar.
    // Sin marcador (p. ej. tras «Cerrar sesión»), ensureActiveSession limpia Auth residual
    // y deja ver el formulario — no reabre /admin.
    if (!(await this.authService.ensureActiveSession({ bootstrapIfMissing: true }))) {
      return true;
    }
    if (cancelled()) {
      return true;
    }

    try {
      await this.firebaseFunctions.syncMyClaims();
    } catch {
      // Perfil RTDB / claims locales siguen siendo suficientes para decidir.
    }
    if (cancelled()) {
      return true;
    }

    try {
      if (this.authSession.hasPendingContextChoice() && (await this.authProfile.isDual())) {
        if (cancelled()) {
          return true;
        }
        await this.router.navigate(['/auth/contexto']);
        return false;
      }

      if (this.authSession.isPortalEntryLocked()) {
        if (await this.authProfile.hasClientAccess()) {
          if (cancelled()) {
            return true;
          }
          await this.router.navigate(['/portal/mascotas']);
          return false;
        }
        return true;
      }

      if (await this.authProfile.hasStaffAccess()) {
        if (cancelled()) {
          return true;
        }
        this.authSession.setStaffEntryIntent(true);
        await this.router.navigate(['/admin/inicio']);
        return false;
      }

      if (await this.authProfile.hasClientAccess()) {
        if (cancelled()) {
          return true;
        }
        await this.router.navigate(['/portal/mascotas']);
        return false;
      }
    } catch {
      return true;
    }

    return true;
  }
}
