import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
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

  async canActivate(): Promise<boolean> {
    await this.firebaseFunctions.syncMyClaims();

    const session = await this.portalSession.resolveSession();
    if (session) return true;

    if (await this.authProfileService.isStaff()) {
      await this.router.navigate(['/admin/inicio']);
      return false;
    }

    await this.router.navigate(['/portal/login']);
    return false;
  }
}
