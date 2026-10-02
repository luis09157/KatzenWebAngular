import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, race, timer } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { LoggerService } from '../core/logger.service';
import { AuthSessionService } from '../core/services/auth-session.service';
import Swal from 'sweetalert2';

type AuthUser = firebase.User;

type FirebaseAuthLike = {
  currentUser: AuthUser | null;
  authStateReady?: () => Promise<void>;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  user$: Observable<AuthUser | null>;
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
    const persistence = rememberSession ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
    await this.afAuth.setPersistence(persistence);
    const credential = await this.afAuth.signInWithEmailAndPassword(email, password);
    const uid = credential.user?.uid;
    if (uid) {
      this.authSession.startSession(uid, rememberSession);
    }
    return credential;
  }

  async logout(): Promise<void> {
    this.logger.log('AuthService: Iniciando logout...');
    // Primero quitar marcadores Katzen: si GuestGuard corre antes de que
    // Firebase asiente user=null, no debe re-bootstrapear la sesión.
    this.authSession.clearSession();
    try {
      await this.afAuth.signOut();
    } catch (error) {
      this.logger.error('AuthService: Error en logout:', error);
    } finally {
      this.authSession.clearSession();
    }
    await this.waitUntilSignedOut(2500);
    this.logger.log('AuthService: Logout listo, redirigiendo a /admin/login');
    await this.router.navigateByUrl('/admin/login');
  }

  /** Espera a que Firebase deje currentUser en null tras signOut. */
  private async waitUntilSignedOut(timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const auth = await this.resolveFirebaseAuth();
      if (!auth?.currentUser) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
  }

  async signOutOnly(): Promise<void> {
    this.authSession.clearSession();
    try {
      await this.afAuth.signOut();
    } finally {
      this.authSession.clearSession();
    }
  }

  /**
   * Espera a que Firebase Auth asiente la persistencia.
   * No usa el primer `null` de authState como “sin sesión” (race clásico AngularFire).
   * Tras `authStateReady`, `currentUser` es la fuente de verdad (no AngularFire authState,
   * que en compat espera `getRedirectResult` y puede llegar tarde).
   */
  async waitForAuthUser(timeoutMs = 4000): Promise<AuthUser | null> {
    const auth = await this.resolveFirebaseAuth();
    if (auth?.currentUser) {
      return auth.currentUser;
    }

    if (auth && typeof auth.authStateReady === 'function') {
      await Promise.race([
        Promise.resolve(auth.authStateReady()).catch(() => undefined),
        new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
      ]);
      return auth.currentUser;
    }

    return firstValueFrom(
      race(
        timer(0, 50).pipe(
          map(() => auth?.currentUser ?? null),
          filter((user): user is AuthUser => !!user),
          take(1)
        ),
        this.afAuth.authState.pipe(
          filter((user): user is AuthUser => !!user),
          take(1)
        ),
        timer(timeoutMs).pipe(map(() => auth?.currentUser ?? null))
      )
    );
  }

  /** Usuario Firebase con sesión guardada ("Mantener sesión activa") aún vigente. */
  async getRememberedAuthUser(): Promise<AuthUser | null> {
    const remembered = this.authSession.getRememberedSession();
    if (!remembered) {
      return null;
    }

    const user = await this.waitForAuthUser();
    if (!user || user.uid !== remembered.uid) {
      return null;
    }

    if (!(await this.ensureActiveSession())) {
      return null;
    }

    return user;
  }

  /**
   * Usuario Firebase con sesión Katzen vigente.
   * Si hay Auth pero no marcador Katzen, retorna null (no recrea sesión):
   * eso evitaba que «Cerrar sesión» reabriera el panel al llegar a /admin/login
   * antes de que Firebase terminara el signOut. El bootstrap vive en ensureActiveSession.
   */
  async getActiveAuthUser(): Promise<AuthUser | null> {
    const user = await this.waitForAuthUser();
    if (!user) {
      return null;
    }

    const session = this.authSession.getSession();
    if (!session) {
      return null;
    }

    if (session.uid !== user.uid) {
      return null;
    }

    if (this.authSession.isExpired(session)) {
      this.authSession.startSession(user.uid, session.remember);
    }

    return user;
  }

  async ensureActiveSession(options?: { bootstrapIfMissing?: boolean }): Promise<boolean> {
    const user = await this.waitForAuthUser();
    if (!user) {
      return true;
    }

    let session = this.authSession.getSession();
    if (!session) {
      // Solo recrear marcador desde «Mantener sesión activa» (localStorage).
      // Nunca bootstrapear solo porque Firebase aún tiene user: eso hacía que
      // «Cerrar sesión» reabriera /admin al llegar a /admin/login.
      const remembered = this.authSession.getRememberedSession();
      if (options?.bootstrapIfMissing !== false && remembered) {
        this.authSession.startSession(user.uid, true);
        session = this.authSession.getSession();
      } else {
        if (options?.bootstrapIfMissing !== false) {
          this.logger.log('AuthService: Auth residual sin marcador Katzen → signOut');
          await this.signOutOnly();
        }
        return false;
      }
    }

    if (!session) {
      return false;
    }

    if (session.uid !== user.uid) {
      this.logger.log('AuthService: uid distinto al de la sesión Katzen');
      await this.signOutOnly();
      return false;
    }

    if (this.authSession.isExpired(session)) {
      this.logger.log('AuthService: sesión expirada');
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
        : 'Tu sesión expiró. Vuelve a iniciar sesión.',
    });
    this.sessionExpiredNoticePending = false;
  }

  isAuthenticated(): Observable<boolean> {
    return this.user$.pipe(map((user) => !!user));
  }

  async isAuthenticatedOnce(): Promise<boolean> {
    const user = await this.waitForAuthUser();
    return !!user;
  }

  getCurrentUser(): Observable<AuthUser | null> {
    return this.user$;
  }

  private async resolveFirebaseAuth(): Promise<FirebaseAuthLike | null> {
    try {
      return await Promise.resolve(this.afAuth as unknown as Promise<FirebaseAuthLike>);
    } catch {
      return null;
    }
  }
}
