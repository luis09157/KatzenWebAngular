import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { PortalAuthService } from '../services/portal-auth.service';

@Injectable({ providedIn: 'root' })
export class PortalGuestGuard implements CanActivate {
  constructor(private portalAuth: PortalAuthService) {}

  async canActivate(): Promise<boolean> {
    if (await this.portalAuth.enterIfRememberedSession()) {
      return false;
    }
    return true;
  }
}
