import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AuthService } from '../../auth/auth.service';
import { AuthProfileService } from '../../core/services/auth-profile.service';
import { FirebaseFunctionsService } from '../../core/services/firebase-functions.service';
import { PortalDataService } from './portal-data.service';
import { isPortalClienteActive } from '../utils/portal-client-access.util';

export type PortalLoginResult = 'client' | 'staff' | 'none' | 'inactive';

@Injectable({ providedIn: 'root' })
export class PortalAuthService {
  constructor(
    private afAuth: AngularFireAuth,
    private authService: AuthService,
    private authProfileService: AuthProfileService,
    private firebaseFunctions: FirebaseFunctionsService,
    private portalData: PortalDataService,
    private router: Router
  ) {}

  async login(email: string, password: string): Promise<PortalLoginResult> {
    await this.authService.login(email, password);
    await this.firebaseFunctions.syncMyClaims();

    if (await this.authProfileService.hasClientAccess()) {
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
    if (await this.authProfileService.hasStaffAccess()) {
      return 'staff';
    }
    await this.authService.logout();
    return 'none';
  }

  async logout(): Promise<void> {
    await this.afAuth.signOut();
    await this.router.navigate(['/']);
  }

  async navigateAfterLogin(result: PortalLoginResult): Promise<void> {
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
