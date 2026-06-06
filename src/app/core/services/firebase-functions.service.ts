import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { firstValueFrom } from 'rxjs';

export interface SyncClaimsResult {
  success?: boolean;
  role?: string;
  staffRole?: string;
  clienteId?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class FirebaseFunctionsService {
  constructor(
    private afAuth: AngularFireAuth,
    private fns: AngularFireFunctions
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
    } catch {
      return null;
    }
  }
}
