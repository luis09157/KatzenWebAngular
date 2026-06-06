import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import Swal from 'sweetalert2';
import { PortalAuthService } from '../services/portal-auth.service';
import { PortalDataService } from '../services/portal-data.service';
import { PortalSessionService } from '../services/portal-session.service';
import { isPortalClienteActive, PORTAL_LOAD_ERROR } from '../utils/portal-client-access.util';

@Component({
  selector: 'app-portal-perfil',
  templateUrl: './portal-perfil.component.html',
  styleUrls: ['./portal-perfil.component.css']
})
export class PortalPerfilComponent implements OnInit {
  loading = true;
  errorMessage = '';
  cliente: Record<string, unknown> | null = null;
  email = '';

  constructor(
    private portalSession: PortalSessionService,
    private portalData: PortalDataService,
    private portalAuth: PortalAuthService,
    private afAuth: AngularFireAuth,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const session = await this.portalSession.resolveSession();
      if (!session) {
        await this.router.navigate(['/portal/login']);
        return;
      }
      this.email = session.email;
      this.cliente = await this.portalData.getCliente(session.clienteId);
    } catch {
      this.errorMessage = PORTAL_LOAD_ERROR;
    } finally {
      this.loading = false;
    }
  }

  nombreCompleto(): string {
    if (!this.cliente) return '—';
    return [this.cliente['nombre'], this.cliente['apellidoPaterno'], this.cliente['apellidoMaterno']]
      .filter(Boolean)
      .join(' ');
  }

  direccion(): string {
    if (!this.cliente) return '—';
    const parts = [
      [this.cliente['calle'], this.cliente['numero']].filter(Boolean).join(' '),
      this.cliente['colonia'],
      this.cliente['municipio']
    ].filter(Boolean);
    return parts.join(', ') || '—';
  }

  portalActivo(): boolean {
    return isPortalClienteActive(this.cliente);
  }

  iniciales(): string {
    const nombre = this.nombreCompleto();
    if (!nombre || nombre === '—') return '?';
    const parts = nombre.trim().split(/\s+/);
    return parts.slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('') || '?';
  }

  async resetPassword(): Promise<void> {
    const user = await this.afAuth.currentUser;
    const email = user?.email || this.email;
    if (!email) {
      Swal.fire({ icon: 'warning', title: 'Correo no disponible', text: 'No encontramos un correo asociado a tu cuenta.' });
      return;
    }
    try {
      await this.afAuth.sendPasswordResetEmail(email);
      Swal.fire({ icon: 'success', title: 'Correo enviado', text: 'Revisa tu bandeja para restablecer la contraseña.' });
    } catch {
      Swal.fire({ icon: 'error', title: 'No se pudo enviar', text: 'Intenta de nuevo más tarde o contacta a la clínica.' });
    }
  }

  async logout(): Promise<void> {
    await this.portalAuth.logout();
  }
}
