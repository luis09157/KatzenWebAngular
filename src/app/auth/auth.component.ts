import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { AuthSessionService } from '../core/services/auth-session.service';
import { AppCheckService } from '../core/app-check.service';
import { FirebaseFunctionsService } from '../core/services/firebase-functions.service';
import { PwaInstallService } from '../core/services/pwa-install.service';
import { PwaManifestService } from '../core/services/pwa-manifest.service';
import { Router } from '@angular/router';
import { mensajeErrorLoginStaff } from '../core/utils/login-error-copy.util';
import { LOGIN_ROUTE_DEADLINE, rtdbUnavailableError, settleLoginRoute } from '../core/utils/rtdb-read-timeout.util';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent implements OnInit, OnDestroy {
  email = '';
  password = '';
  hidePassword = true;
  keepSessionActive = false;
  loading = false;
  checkingSession = true;
  loginError = '';
  /** Spec 087 — instalar PWA clínica. */
  installAvailable = false;
  installingPwa = false;
  showIosInstallHint = false;
  alreadyInstalled = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private authProfileService: AuthProfileService,
    private authSession: AuthSessionService,
    private appCheck: AppCheckService,
    private firebaseFunctions: FirebaseFunctionsService,
    private pwaInstall: PwaInstallService,
    private pwaManifest: PwaManifestService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.pwaManifest.setKind('admin');
    this.pwaInstall.init();
    this.alreadyInstalled = this.pwaInstall.isStandalone();
    this.showIosInstallHint = this.pwaInstall.showIosInstallHint();
    this.pwaInstall.installAvailable$.pipe(takeUntil(this.destroy$)).subscribe((v) => {
      this.alreadyInstalled = this.pwaInstall.isStandalone();
      this.installAvailable = v && !this.alreadyInstalled;
    });
    try {
      const entered = await settleLoginRoute((cancelled) => this.tryEnterIfActiveSession(cancelled));
      if (entered === LOGIN_ROUTE_DEADLINE) {
        this.loginError = mensajeErrorLoginStaff(rtdbUnavailableError());
      }
    } catch {
      this.loginError = mensajeErrorLoginStaff(rtdbUnavailableError());
    } finally {
      this.checkingSession = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Sesión Firebase activa → /admin/inicio (staff y dual).
   * El selector de contexto solo aplica al login fresco, no al auto-enter.
   */
  private async tryEnterIfActiveSession(cancelled: () => boolean = () => false): Promise<boolean> {
    const user = await this.authService.waitForAuthUser();
    if (cancelled() || !user) {
      return false;
    }

    // Si hay marcador Katzen + Firebase user → entrar.
    // Sin marcador (tras «Cerrar sesión»), no recrear sesión.
    if (!(await this.authService.ensureActiveSession({ bootstrapIfMissing: true }))) {
      return false;
    }

    try {
      await this.firebaseFunctions.syncMyClaims();
    } catch {
      // Continuar con perfil RTDB / claims ya emitidos.
    }
    this.appCheck.ensureInitialized();
    if (cancelled()) {
      return false;
    }

    if (this.authSession.hasPendingContextChoice() && (await this.authProfileService.isDual())) {
      if (cancelled()) {
        return false;
      }
      await this.router.navigate(['/auth/contexto']);
      return true;
    }

    // Sesión abierta por portal: no saltar a admin desde /admin/login.
    if (this.authSession.isPortalEntryLocked()) {
      if (await this.authProfileService.hasClientAccess()) {
        if (cancelled()) {
          return false;
        }
        await this.router.navigate(['/portal/mascotas']);
        return true;
      }
      return false;
    }

    const hasStaff = await this.authProfileService.hasStaffAccess();
    if (cancelled()) {
      return false;
    }
    if (!hasStaff) {
      if (await this.authProfileService.hasClientAccess()) {
        if (cancelled()) {
          return false;
        }
        await this.router.navigate(['/portal/mascotas']);
        return true;
      }
      return false;
    }

    this.authSession.setStaffEntryIntent(true);
    await this.router.navigate(['/admin/inicio']);
    return true;
  }

  async login() {
    if (this.loading) {
      return;
    }
    this.loginError = '';
    if (!this.email || !this.password) {
      this.loginError = 'Escribe tu correo y contraseña.';
      return;
    }
    this.loading = true;
    try {
      await this.authService.login(this.email, this.password, this.keepSessionActive);
      this.authSession.setPortalEntryLock(false);
      this.authSession.setStaffEntryIntent(true);
      // Sync antes de App Check: si no, el preflight lleva X-Firebase-AppCheck y la función vieja responde 400 sin CORS.
      await this.firebaseFunctions.syncMyClaims();
      this.appCheck.ensureInitialized();
      const hasStaff = await this.authProfileService.hasStaffAccess();
      if (!hasStaff) {
        await this.authService.signOutOnly();
        this.loginError = 'No encontramos tu perfil de personal. Si eres dueño, entra por «Soy cliente».';
        return;
      }
      await this.navigateAfterStaffLogin();
    } catch (error) {
      this.loginError = mensajeErrorLoginStaff(error);
    } finally {
      this.loading = false;
    }
  }

  /** Dual → selector de contexto; solo staff → admin. */
  private async navigateAfterStaffLogin(): Promise<void> {
    if (await this.authProfileService.isDual()) {
      this.authSession.setPendingContextChoice(true);
      await this.router.navigate(['/auth/contexto']);
      return;
    }
    if (await this.authProfileService.hasStaffAccess()) {
      await this.router.navigate(['/admin/inicio']);
    }
  }

  async instalarAppClinica(): Promise<void> {
    if (this.installingPwa) return;
    this.installingPwa = true;
    try {
      const result = await this.pwaInstall.promptInstall();
      if (result === 'unavailable') {
        this.showIosInstallHint = this.pwaInstall.showIosInstallHint();
      }
    } finally {
      this.installingPwa = false;
    }
  }

  irAlPortal(): void {
    this.router.navigate(['/portal/login']);
  }

  irAlInicio(): void {
    this.router.navigate(['/']);
  }
}
