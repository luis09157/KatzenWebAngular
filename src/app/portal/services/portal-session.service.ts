import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AuthProfileService } from '../../core/services/auth-profile.service';

export interface PortalSession {
  uid: string;
  clienteId: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class PortalSessionService {
  constructor(
    private afAuth: AngularFireAuth,
    private authProfileService: AuthProfileService
  ) {}

  async resolveSession(): Promise<PortalSession | null> {
    const user = await this.afAuth.currentUser;
    if (!user) return null;

    const perfil = await this.authProfileService.getMyProfile();
    if (perfil?.activo !== false && perfil?.role === 'client' && perfil.clienteId) {
      return {
        uid: user.uid,
        clienteId: perfil.clienteId,
        email: perfil.email || user.email || ''
      };
    }

    const token = await user.getIdTokenResult();
    const role = token.claims['role'];
    const clienteId = token.claims['clienteId'] as string | undefined;
    if (role === 'client' && clienteId) {
      return { uid: user.uid, clienteId, email: user.email || '' };
    }

    return null;
  }

  async getClienteId(): Promise<string | null> {
    const session = await this.resolveSession();
    return session?.clienteId ?? null;
  }
}
