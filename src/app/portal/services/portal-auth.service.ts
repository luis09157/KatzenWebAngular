import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AuthService } from '../../auth/auth.service';
import { AuthProfileService } from '../../core/services/auth-profile.service';
import { FirebaseFunctionsService } from '../../core/services/firebase-functions.service';

export type PortalLoginResult = 'client' | 'staff' | 'none';

@Injectable({ providedIn: 'root' })
export class PortalAuthService {
  constructor(
    private afAuth: AngularFireAuth,
    private authService: AuthService,
    private authProfileService: AuthProfileService,
    private firebaseFunctions: FirebaseFunctionsService,
    private router: Router
  ) {}

  async login(email: string, password: string): Promise<PortalLoginResult> {
    await this.authService.login(email, password);
    await this.firebaseFunctions.syncMyClaims();

    if (await this.authProfileService.isStaff()) {
      return 'staff';
    }
    if (await this.authProfileService.isClient()) {
      return 'client';
    }
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
    await this.authService.logout();
  }
}
