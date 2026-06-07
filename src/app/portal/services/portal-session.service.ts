import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { AuthProfileService } from '../../core/services/auth-profile.service';
import { PortalDataService } from './portal-data.service';
import { isPortalClienteActive } from '../utils/portal-client-access.util';

export interface PortalSession {
  uid: string;
  clienteId: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class PortalSessionService {
  constructor(
    private afAuth: AngularFireAuth,
    private authService: AuthService,
    private authProfileService: AuthProfileService,
    private portalData: PortalDataService
  ) {}

  async resolveSession(): Promise<PortalSession | null> {
    if (!(await this.authService.ensureActiveSession())) {
      return null;
    }

    const user = await firstValueFrom(this.afAuth.authState.pipe(take(1)));
    if (!user) return null;

    const hasClient = await this.authProfileService.hasClientAccess();
    if (!hasClient) return null;

    const clienteId = await this.authProfileService.getClienteId();
    if (!clienteId) return null;

    const cliente = await this.portalData.getCliente(clienteId);
    if (!isPortalClienteActive(cliente)) return null;

    const perfil = await this.authProfileService.getMyProfile();
    return {
      uid: user.uid,
      clienteId,
      email: perfil?.email || user.email || ''
    };
  }

  async getClienteId(): Promise<string | null> {
    const session = await this.resolveSession();
    return session?.clienteId ?? null;
  }
}
