import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { AuthProfileService } from '../../core/services/auth-profile.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { FirebaseFunctionsService } from '../../core/services/firebase-functions.service';
import { PortalDataService } from './portal-data.service';
import { PortalSessionService } from './portal-session.service';
import { isPortalClienteActive } from '../utils/portal-client-access.util';

export type PortalLoginResult = 'client' | 'staff' | 'dual' | 'none' | 'inactive';

@Injectable({ providedIn: 'root' })
export class PortalAuthService {
  constructor(
    private authService: AuthService,
    private authProfileService: AuthProfileService,
    private authSession: AuthSessionService,
    private firebaseFunctions: FirebaseFunctionsService,
    private portalData: PortalDataService,
    private portalSession: PortalSessionService,
    private router: Router
  ) {}

  /**
   * Si ya hay sesión Firebase usable como cliente, entra al portal
   * (remembered o sesión de pestaña). Nunca contexto/admin.
   */
  async enterIfRememberedSession(): Promise<boolean> {
    const user = await this.authService.getActiveAuthUser();
    if (!user) {
      return false;
    }

    await this.firebaseFunctions.syncMyClaims();

    if (await this.tryEnterPortalAsClient()) {
      return true;
    }

    return false;
  }

  async login(email: string, password: string, rememberSession = false): Promise<PortalLoginResult> {
    await this.authService.login(email, password, rememberSession);
    this.authSession.setStaffEntryIntent(false);
    await this.firebaseFunctions.syncMyClaims();

    const hasClient = await this.authProfileService.hasClientAccess();
    const hasStaff = await this.authProfileService.hasStaffAccess();

    if (hasClient) {
      const clienteId = await this.authProfileService.getClienteId();
      if (clienteId) {
        const cliente = await this.portalData.getCliente(clienteId);
        if (!isPortalClienteActive(cliente)) {
          await this.authService.signOutOnly();
          return 'inactive';
        }
      }
      this.authSession.setPortalEntryLock(true);
      return hasStaff ? 'dual' : 'client';
    }

    if (hasStaff) {
      await this.authService.signOutOnly();
      return 'staff';
    }

    await this.authService.signOutOnly();
    return 'none';
  }

  async logout(): Promise<void> {
    await this.authService.signOutOnly();
    await this.router.navigate(['/']);
  }

  async navigateAfterLogin(result: PortalLoginResult): Promise<void> {
    if (result === 'dual' || result === 'client') {
      this.authSession.setStaffEntryIntent(false);
      this.authSession.setPortalEntryLock(true);
      await this.router.navigateByUrl('/portal/mascotas');
      return;
    }
    await this.router.navigateByUrl('/portal/login');
  }

  private async tryEnterPortalAsClient(): Promise<boolean> {
    const hasClient = await this.authProfileService.hasClientAccess();
    if (!hasClient) {
      return false;
    }

    const portalSession = await this.portalSession.resolveSession();
    if (!portalSession) {
      return false;
    }

    this.authSession.setStaffEntryIntent(false);
    this.authSession.setPortalEntryLock(true);
    await this.router.navigateByUrl('/portal/mascotas');
    return true;
  }
}
