import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppCheckService } from '../../core/app-check.service';
import { PortalAuthService } from '../services/portal-auth.service';
import { PortalSessionService, PortalSession } from '../services/portal-session.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { mensajeErrorLoginPortal, mensajeEstadoLoginPortal } from '../utils/portal-login-error.util';

@Component({
  selector: 'app-portal-login',
  templateUrl: './portal-login.component.html',
  styleUrls: ['./portal-login.component.css'],
})
export class PortalLoginComponent implements OnInit {
  email = '';
  password = '';
  hidePassword = true;
  keepSessionActive = false;
  loading = false;
  checkingSession = true;
  activeSession: PortalSession | null = null;
  showSessionPrompt = false;
  loginError = '';

  constructor(
    private portalAuth: PortalAuthService,
    private portalSession: PortalSessionService,
    private authSession: AuthSessionService,
    private appCheck: AppCheckService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.appCheck.ensureInitialized();
    try {
      if (await this.portalAuth.enterIfRememberedSession()) {
        return;
      }

      this.activeSession = await this.portalSession.resolveSession();
      this.showSessionPrompt = !!this.activeSession && !this.authSession.isRememberedSessionActive();
      if (this.activeSession?.email) {
        this.email = this.activeSession.email;
      }
    } finally {
      this.checkingSession = false;
    }
  }

  async login(): Promise<void> {
    if (this.loading) {
      return;
    }
    const email = this.email.trim();
    this.loginError = '';
    if (!email || !this.password) {
      this.loginError = 'Escribe el correo y la contraseña que te dimos en la clínica o por correo.';
      return;
    }

    this.loading = true;
    try {
      const result = await this.portalAuth.login(email, this.password, this.keepSessionActive);
      if (result === 'inactive' || result === 'none' || result === 'staff') {
        this.loginError = mensajeEstadoLoginPortal(result);
        return;
      }
      await this.portalAuth.navigateAfterLogin(result);
    } catch (error) {
      this.loginError = mensajeErrorLoginPortal(error);
    } finally {
      this.loading = false;
    }
  }

  continuarSesion(): void {
    this.router.navigate(['/portal/mascotas']);
  }

  async cerrarSesion(): Promise<void> {
    await this.portalAuth.logout();
    this.activeSession = null;
    this.password = '';
  }

  irALanding(): void {
    this.router.navigate(['/']);
  }

  irALandingRegistro(): void {
    this.router.navigate(['/'], { queryParams: { abrirRegistro: '1' } });
  }
}
