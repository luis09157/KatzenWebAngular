import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { AuthSessionService } from '../core/services/auth-session.service';
import { AppCheckService } from '../core/app-check.service';
import { FirebaseFunctionsService } from '../core/services/firebase-functions.service';
import { Router } from '@angular/router';
import { mensajeErrorLoginStaff } from '../core/utils/login-error-copy.util';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent implements OnInit {
  email = '';
  password = '';
  hidePassword = true;
  keepSessionActive = false;
  loading = false;
  checkingSession = true;
  loginError = '';

  constructor(
    private authService: AuthService,
    private authProfileService: AuthProfileService,
    private authSession: AuthSessionService,
    private appCheck: AppCheckService,
    private firebaseFunctions: FirebaseFunctionsService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.appCheck.ensureInitialized();
    try {
      await this.tryEnterIfActiveSession();
    } catch {
      // Fallback: formulario. El GuestGuard ya intentó el auto-redirect.
    } finally {
      this.checkingSession = false;
    }
  }

  /**
   * Sesión Firebase activa → /admin/inicio (staff y dual).
   * El selector de contexto solo aplica al login fresco, no al auto-enter.
   */
  private async tryEnterIfActiveSession(): Promise<boolean> {
    const user = await this.authService.getActiveAuthUser();
    if (!user) {
      return false;
    }

    try {
      await this.firebaseFunctions.syncMyClaims();
    } catch {
      // Continuar con perfil RTDB / claims ya emitidos.
    }

    if (this.authSession.hasPendingContextChoice() && (await this.authProfileService.isDual())) {
      await this.router.navigate(['/auth/contexto']);
      return true;
    }

    // Sesión abierta por portal: no saltar a admin desde /admin/login.
    if (this.authSession.isPortalEntryLocked()) {
      if (await this.authProfileService.hasClientAccess()) {
        await this.router.navigate(['/portal/mascotas']);
        return true;
      }
      return false;
    }

    const hasStaff = await this.authProfileService.hasStaffAccess();
    if (!hasStaff) {
      if (await this.authProfileService.hasClientAccess()) {
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
      await this.firebaseFunctions.syncMyClaims();
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

  irAlPortal(): void {
    this.router.navigate(['/portal/login']);
  }

  irAlInicio(): void {
    this.router.navigate(['/']);
  }
}
