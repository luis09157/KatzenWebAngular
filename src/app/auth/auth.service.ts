import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import type { User } from 'firebase/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoggerService } from '../core/logger.service';
import { AuthSessionService } from '../core/services/auth-session.service';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user$: Observable<User | null>;
  private sessionExpiredNoticePending = false;

  constructor(
    private afAuth: AngularFireAuth,
    private authSession: AuthSessionService,
    private router: Router,
    private logger: LoggerService
  ) {
    this.user$ = this.afAuth.authState;
  }

  async login(email: string, password: string, rememberSession = false) {
    const persistence = rememberSession
      ? firebase.auth.Auth.Persistence.LOCAL
      : firebase.auth.Auth.Persistence.SESSION;
    await this.afAuth.setPersistence(persistence);
    const credential = await this.afAuth.signInWithEmailAndPassword(email, password);
    const uid = credential.user?.uid;
    if (uid) {
      this.authSession.startSession(uid, rememberSession);
    }
    return credential;
  }

  logout() {
    this.logger.log('AuthService: Iniciando logout...');
    this.authSession.clearSession();
    return this.afAuth.signOut().then(() => {
      this.logger.log('AuthService: Logout exitoso, redirigiendo a /admin/login');
      this.router.navigate(['/admin/login']);
    }).catch(error => {
      this.logger.error('AuthService: Error en logout:', error);
      this.router.navigate(['/admin/login']);
    });
  }

  async signOutOnly(): Promise<void> {
    this.authSession.clearSession();
    await this.afAuth.signOut();
  }

  async ensureActiveSession(options?: { bootstrapIfMissing?: boolean }): Promise<boolean> {
    const user = await this.afAuth.currentUser;
    if (!user) {
      return true;
    }

    const session = this.authSession.getSession();
    if (!session) {
      if (options?.bootstrapIfMissing !== false) {
        this.authSession.startSession(user.uid, true);
        return true;
      }
      await this.signOutOnly();
      return false;
    }

    if (session.uid !== user.uid || this.authSession.isExpired(session)) {
      this.logger.log('AuthService: sesión expirada o uid distinto');
      await this.signOutOnly();
      await this.notifySessionExpired(session.remember);
      return false;
    }

    return true;
  }

  private async notifySessionExpired(wasRemembered: boolean): Promise<void> {
    if (this.sessionExpiredNoticePending) {
      return;
    }
    this.sessionExpiredNoticePending = true;
    await Swal.fire({
      icon: 'info',
      title: 'Sesión expirada',
      text: wasRemembered
        ? 'Tu sesión guardada expiró. Vuelve a iniciar sesión.'
        : 'Tu sesión expiró. Vuelve a iniciar sesión.'
    });
    this.sessionExpiredNoticePending = false;
  }

  isAuthenticated(): Observable<boolean> {
    return this.user$.pipe(map(user => !!user));
  }

  async isAuthenticatedOnce(): Promise<boolean> {
    const user = await this.afAuth.currentUser;
    return !!user;
  }

  getCurrentUser(): Observable<User | null> {
    return this.user$;
  }
}
