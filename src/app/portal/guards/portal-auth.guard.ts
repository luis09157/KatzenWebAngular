import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { PortalSessionService } from '../services/portal-session.service';
import { AuthProfileService } from '../../core/services/auth-profile.service';
import { FirebaseFunctionsService } from '../../core/services/firebase-functions.service';

@Injectable({ providedIn: 'root' })
export class PortalAuthGuard implements CanActivate {
  constructor(
    private portalSession: PortalSessionService,
    private authProfileService: AuthProfileService,
    private firebaseFunctions: FirebaseFunctionsService,
    private router: Router
  ) {}

  async canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    await this.firebaseFunctions.syncMyClaims();

    const session = await this.portalSession.resolveSession();
    if (session) {
      const mustChange = await this.authProfileService.mustChangePassword();
      const onPerfil = state.url.includes('/portal/perfil');
      if (mustChange && !onPerfil) {
        await this.router.navigate(['/portal/perfil'], { queryParams: { cambiarPassword: '1' } });
        return false;
      }
      return true;
    }

    const hasStaff = await this.authProfileService.hasStaffAccess();
    const hasClient = await this.authProfileService.hasClientAccess();

    // Solo staff (sin portal): al admin. Dual con cliente inactivo/session null no debe ciclar.
    if (hasStaff && !hasClient) {
      await this.router.navigate(['/admin/inicio']);
      return false;
    }

    // Dual con clientAccess pero session null (portal inactivo): ofrecer contexto o admin
    if (hasStaff && hasClient) {
      await this.router.navigate(['/auth/contexto']);
      return false;
    }

    await this.router.navigate(['/portal/login']);
    return false;
  }
}
