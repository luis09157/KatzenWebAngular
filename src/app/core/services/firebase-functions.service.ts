import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../logger.service';

export interface SyncClaimsResult {
  success?: boolean;
  role?: string;
  staffRole?: string;
  clienteId?: string;
  message?: string;
}

export interface ProvisionStaffResult {
  success?: boolean;
  uid?: string;
  email?: string;
  staffRole?: string;
  message?: string;
}

export interface UpdateStaffResult {
  success?: boolean;
  uid?: string;
  staffRole?: string;
  message?: string;
}

export interface ProvisionStaffInput {
  email: string;
  password: string;
  nombre: string;
  telefono: string;
  perfil: string;
}

export interface UpdateStaffInput {
  uid: string;
  nombre?: string;
  telefono?: string;
  perfil?: string;
  activo?: boolean;
  email?: string;
}

export interface PortalClientActionResult {
  success?: boolean;
  message?: string;
  emailSent?: boolean;
  uid?: string;
  clienteId?: string;
  email?: string;
}

export interface PortalClientActionInput {
  clienteId: string;
}

export interface RegisterPortalOwnerInput {
  nombre: string;
  apellidoPaterno?: string;
  correo: string;
  telefono?: string;
  acceptPrivacy: boolean;
}

export interface RegisterPortalOwnerResult {
  success?: boolean;
  message?: string;
  emailSent?: boolean;
  clienteId?: string;
  email?: string;
  /** Spec 047: true si se vinculó a ficha clínica existente. */
  linkedExisting?: boolean;
}

export interface LinkStaffPortalInput {
  staffUid: string;
  clienteId: string;
}

export interface LinkStaffPortalResult {
  success?: boolean;
  uid?: string;
  clienteId?: string;
  dualAccess?: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class FirebaseFunctionsService {
  constructor(
    private afAuth: AngularFireAuth,
    private fns: AngularFireFunctions,
    private logger: LoggerService
  ) {}

  /** Sincroniza custom claims desde Katzen/AuthPerfiles (Cloud Function syncMyClaims). */
  async syncMyClaims(): Promise<SyncClaimsResult | null> {
    const user = await this.afAuth.currentUser;
    if (!user) return null;

    try {
      const callable = this.fns.httpsCallable<Record<string, never>, SyncClaimsResult>('syncMyClaims');
      const result = await firstValueFrom(callable({}));
      await user.getIdToken(true);
      return result ?? null;
    } catch (error) {
      this.logger.warn('syncMyClaims no disponible — usando perfil RTDB/claims existentes', error);
      return null;
    }
  }

  /** Crea cuenta Auth + AuthPerfiles + Usuarios (solo admin). */
  async provisionStaffUser(input: ProvisionStaffInput): Promise<ProvisionStaffResult> {
    const callable = this.fns.httpsCallable<ProvisionStaffInput, ProvisionStaffResult>('provisionStaffUser');
    return firstValueFrom(callable(input));
  }

  /** Actualiza staff en RTDB + Auth y re-sincroniza claims (solo admin). */
  async updateStaffUser(input: UpdateStaffInput): Promise<UpdateStaffResult> {
    const callable = this.fns.httpsCallable<UpdateStaffInput, UpdateStaffResult>('updateStaffUser');
    return firstValueFrom(callable(input));
  }

  async provisionPortalClient(clienteId: string): Promise<PortalClientActionResult> {
    const callable = this.fns.httpsCallable<PortalClientActionInput, PortalClientActionResult>('provisionPortalClient');
    return firstValueFrom(callable({ clienteId }));
  }

  /** Self-registro dueño desde landing (callable pública). */
  async registerPortalOwner(input: RegisterPortalOwnerInput): Promise<RegisterPortalOwnerResult> {
    const callable = this.fns.httpsCallable<RegisterPortalOwnerInput, RegisterPortalOwnerResult>(
      'registerPortalOwner'
    );
    return firstValueFrom(callable(input));
  }

  async deactivatePortalClient(clienteId: string): Promise<PortalClientActionResult> {
    const callable = this.fns.httpsCallable<PortalClientActionInput, PortalClientActionResult>('deactivatePortalClient');
    return firstValueFrom(callable({ clienteId }));
  }

  async resendPortalClientAccess(clienteId: string): Promise<PortalClientActionResult> {
    const callable = this.fns.httpsCallable<PortalClientActionInput, PortalClientActionResult>('resendPortalClientAccess');
    return firstValueFrom(callable({ clienteId }));
  }

  /** Vincula Cliente a staff existente (perfil dual). Solo admin. */
  async linkStaffPortalCliente(staffUid: string, clienteId: string): Promise<LinkStaffPortalResult> {
    const callable = this.fns.httpsCallable<LinkStaffPortalInput, LinkStaffPortalResult>('linkStaffPortalCliente');
    return firstValueFrom(callable({ staffUid, clienteId }));
  }

  /** Quita vínculo dual (staff solo admin). Solo admin. Spec 015. */
  async unlinkStaffPortalCliente(staffUid: string): Promise<LinkStaffPortalResult> {
    const callable = this.fns.httpsCallable<{ staffUid: string }, LinkStaffPortalResult>(
      'unlinkStaffPortalCliente'
    );
    return firstValueFrom(callable({ staffUid }));
  }

  async clearMustChangePassword(): Promise<{ success?: boolean; message?: string }> {
    const callable = this.fns.httpsCallable<Record<string, never>, { success?: boolean; message?: string }>(
      'clearMustChangePassword'
    );
    const result = await firstValueFrom(callable({}));
    const user = await this.afAuth.currentUser;
    if (user) {
      await user.getIdToken(true);
    }
    return result;
  }
}
