import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PortalAuthService } from '../services/portal-auth.service';
import { PortalSessionService, PortalSession } from '../services/portal-session.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-portal-login',
  templateUrl: './portal-login.component.html',
  styleUrls: ['./portal-login.component.css']
})
export class PortalLoginComponent implements OnInit {
  email = '';
  password = '';
  loading = false;
  checkingSession = true;
  activeSession: PortalSession | null = null;

  constructor(
    private portalAuth: PortalAuthService,
    private portalSession: PortalSessionService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.activeSession = await this.portalSession.resolveSession();
    if (this.activeSession?.email) {
      this.email = this.activeSession.email;
    }
    this.checkingSession = false;
  }

  async login(): Promise<void> {
    if (!this.email || !this.password) {
      Swal.fire({ icon: 'warning', title: 'Inicia sesión', text: 'Ingresa tu correo y contraseña de cliente.' });
      return;
    }

    this.loading = true;
    try {
      const result = await this.portalAuth.login(this.email, this.password);
      if (result === 'none') {
        await this.portalAuth.logout();
        Swal.fire({
          icon: 'warning',
          title: 'Sin acceso al portal',
          html: 'Tu cuenta no está registrada como <strong>cliente</strong>.<br>Si eres personal, usa el acceso staff.'
        });
        return;
      }
      if (result === 'staff') {
        Swal.fire({
          icon: 'info',
          title: 'Cuenta de staff',
          text: 'Te redirigimos al panel administrativo.',
          timer: 1800,
          showConfirmButton: false
        });
      }
      await this.portalAuth.navigateAfterLogin(result);
    } catch {
      Swal.fire({ icon: 'error', title: 'No pudimos iniciar sesión', text: 'Revisa tu correo y contraseña.' });
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
}
