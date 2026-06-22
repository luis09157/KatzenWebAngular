import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import Swal from 'sweetalert2';
import { PortalAuthService } from '../services/portal-auth.service';
import { PortalDataService } from '../services/portal-data.service';
import { PortalSessionService } from '../services/portal-session.service';
import { AuthProfileService } from '../../core/services/auth-profile.service';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { FirebaseFunctionsService } from '../../core/services/firebase-functions.service';
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

  mustChangePassword = false;
  changingPassword = false;
  showPasswordForm = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  constructor(
    private portalSession: PortalSessionService,
    private portalData: PortalDataService,
    private portalAuth: PortalAuthService,
    private authProfileService: AuthProfileService,
    private firebaseFunctions: FirebaseFunctionsService,
    private errorMessages: ErrorMessagesService,
    private afAuth: AngularFireAuth,
    private router: Router,
    private route: ActivatedRoute
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
      this.mustChangePassword = await this.authProfileService.mustChangePassword();
      this.showPasswordForm =
        this.mustChangePassword || this.route.snapshot.queryParamMap.get('cambiarPassword') === '1';
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

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
  }

  private validatePasswordForm(): string | null {
    if (!this.currentPassword.trim()) return 'Ingresa tu contraseña actual.';
    if (this.newPassword.length < 8) return 'La nueva contraseña debe tener al menos 8 caracteres.';
    if (this.newPassword !== this.confirmPassword) return 'La confirmación no coincide.';
    if (this.newPassword === this.currentPassword) return 'La nueva contraseña debe ser distinta a la actual.';
    return null;
  }

  async changePassword(): Promise<void> {
    const validationError = this.validatePasswordForm();
    if (validationError) {
      Swal.fire({ icon: 'warning', title: 'Revisa los datos', text: validationError });
      return;
    }

    const user = await this.afAuth.currentUser;
    const email = user?.email || this.email;
    if (!user || !email) {
      Swal.fire({ icon: 'warning', title: 'Sesión no válida', text: 'Vuelve a iniciar sesión e intenta de nuevo.' });
      return;
    }

    this.changingPassword = true;
    try {
      const credential = firebase.auth.EmailAuthProvider.credential(email, this.currentPassword);
      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(this.newPassword);
      await this.firebaseFunctions.clearMustChangePassword();
      await this.firebaseFunctions.syncMyClaims();

      this.mustChangePassword = false;
      this.showPasswordForm = false;
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';

      await this.router.navigate(['/portal/perfil'], { replaceUrl: true });

      Swal.fire({
        icon: 'success',
        title: 'Contraseña actualizada',
        text: 'Tu acceso al portal quedó configurado correctamente.'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo cambiar la contraseña',
        text: this.errorMessages.getUserMessage(error, 'cambiar contraseña portal')
      });
    } finally {
      this.changingPassword = false;
    }
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
