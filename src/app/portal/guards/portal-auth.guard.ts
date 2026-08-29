import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { PortalSessionService } from '../services/portal-session.service';
import { AuthProfileService } from '../../core/services/auth-profile.service';
import { FirebaseFunctionsService } from '../../core/services/firebase-functions.service';

/**
 * Protege rutas /portal/* autenticadas.
 * Nunca redirige a /auth/contexto ni a /admin: el selector dual solo existe
 * tras login staff. Entrada landing/portal debe quedarse en el portal.
 */
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

    await this.router.navigate(['/portal/login']);
    return false;
  }
}
