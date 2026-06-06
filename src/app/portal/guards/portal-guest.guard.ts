import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { PortalSessionService } from '../services/portal-session.service';
import { AuthProfileService } from '../../core/services/auth-profile.service';
import { FirebaseFunctionsService } from '../../core/services/firebase-functions.service';

@Injectable({ providedIn: 'root' })
export class PortalGuestGuard implements CanActivate {
  constructor(
    private portalSession: PortalSessionService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    const session = await this.portalSession.resolveSession();
    if (session) {
      await this.router.navigate(['/portal/mascotas']);
      return false;
    }
    return true;
  }
}
