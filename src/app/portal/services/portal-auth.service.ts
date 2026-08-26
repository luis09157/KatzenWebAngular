import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { AuthProfileService } from '../../core/services/auth-profile.service';
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
    private firebaseFunctions: FirebaseFunctionsService,
    private portalData: PortalDataService,
    private portalSession: PortalSessionService,
    private router: Router
  ) {}

  /** Entra directo si hay sesión guardada con "Mantener sesión activa". */
  async enterIfRememberedSession(): Promise<boolean> {
    const user = await this.authService.getRememberedAuthUser();
    if (!user) {
      return false;
    }

    await this.firebaseFunctions.syncMyClaims();

    if (await this.authProfileService.isDual()) {
      await this.router.navigate(['/auth/contexto']);
      return true;
    }

    const portalSession = await this.portalSession.resolveSession();
    if (portalSession) {
      await this.router.navigate(['/portal/mascotas']);
      return true;
    }

    if (await this.authProfileService.hasStaffAccess()) {
      await this.router.navigate(['/admin/inicio']);
      return true;
    }

    return false;
  }

  async login(email: string, password: string, rememberSession = false): Promise<PortalLoginResult> {
    await this.authService.login(email, password, rememberSession);
    await this.firebaseFunctions.syncMyClaims();

    const hasClient = await this.authProfileService.hasClientAccess();
    const hasStaff = await this.authProfileService.hasStaffAccess();

    if (hasClient && hasStaff) {
      const clienteId = await this.authProfileService.getClienteId();
      if (clienteId) {
        const cliente = await this.portalData.getCliente(clienteId);
        if (!isPortalClienteActive(cliente)) {
          // Dual con portal inactivo: aún puede usar admin
          return 'staff';
        }
      }
      return 'dual';
    }

    if (hasClient) {
      const clienteId = await this.authProfileService.getClienteId();
      if (clienteId) {
        const cliente = await this.portalData.getCliente(clienteId);
        if (!isPortalClienteActive(cliente)) {
          await this.authService.logout();
          return 'inactive';
        }
      }
      return 'client';
    }
    if (hasStaff) {
      return 'staff';
    }
    await this.authService.logout();
    return 'none';
  }

  async logout(): Promise<void> {
    await this.authService.signOutOnly();
    await this.router.navigate(['/']);
  }

  async navigateAfterLogin(result: PortalLoginResult): Promise<void> {
    if (result === 'dual') {
      await this.router.navigate(['/auth/contexto']);
      return;
    }
    if (result === 'client') {
      await this.router.navigate(['/portal/mascotas']);
      return;
    }
    if (result === 'staff') {
      await this.router.navigate(['/admin/inicio']);
      return;
    }
    await this.router.navigate(['/portal/login']);
  }
}
