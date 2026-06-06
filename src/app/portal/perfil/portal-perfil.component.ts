import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import Swal from 'sweetalert2';
import { PortalAuthService } from '../services/portal-auth.service';
import { PortalDataService } from '../services/portal-data.service';
import { PortalSessionService } from '../services/portal-session.service';

@Component({
  selector: 'app-portal-perfil',
  templateUrl: './portal-perfil.component.html',
  styleUrls: ['./portal-perfil.component.css']
})
export class PortalPerfilComponent implements OnInit {
  loading = true;
  cliente: Record<string, unknown> | null = null;
  email = '';

  constructor(
    private portalSession: PortalSessionService,
    private portalData: PortalDataService,
    private portalAuth: PortalAuthService,
    private afAuth: AngularFireAuth
  ) {}

  async ngOnInit(): Promise<void> {
    const session = await this.portalSession.resolveSession();
    if (!session) return;
    this.email = session.email;
    this.cliente = await this.portalData.getCliente(session.clienteId);
    this.loading = false;
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
    if (!this.cliente) return false;
    return this.cliente['portalActivo'] === true &&
      this.cliente['activo'] !== false &&
      !!this.cliente['authUid'];
  }

  async resetPassword(): Promise<void> {
    const user = await this.afAuth.currentUser;
    const email = user?.email || this.email;
    if (!email) return;
    try {
      await this.afAuth.sendPasswordResetEmail(email);
      Swal.fire({ icon: 'success', title: 'Correo enviado', text: 'Revisa tu bandeja para restablecer la contraseña.' });
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo enviar el correo de recuperación.' });
    }
  }

  async logout(): Promise<void> {
    await this.portalAuth.logout();
  }
}
