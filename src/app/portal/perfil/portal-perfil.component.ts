import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PortalAuthService } from '../services/portal-auth.service';
import { PortalDataService } from '../services/portal-data.service';
import { PortalSessionService } from '../services/portal-session.service';
import { AuthProfileService } from '../../core/services/auth-profile.service';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { FirebaseFunctionsService } from '../../core/services/firebase-functions.service';
import { PortalFcmService, PortalFcmStatus } from '../../core/services/portal-fcm.service';
import { PortalPwaService } from '../services/portal-pwa.service';
import { isPortalClienteActive, PORTAL_LOAD_ERROR } from '../utils/portal-client-access.util';

@Component({
  selector: 'app-portal-perfil',
  templateUrl: './portal-perfil.component.html',
  styleUrls: ['./portal-perfil.component.css']
})
export class PortalPerfilComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
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

  pushStatus: PortalFcmStatus | 'idle' = 'idle';
  pushDetail = '';
  registeringPush = false;
  pushPermission: NotificationPermission | 'unsupported' = 'unsupported';
  installAvailable = false;
  installingPwa = false;
  showIosInstallHint = false;

  constructor(
    private portalSession: PortalSessionService,
    private portalData: PortalDataService,
    private portalAuth: PortalAuthService,
    private authProfileService: AuthProfileService,
    private firebaseFunctions: FirebaseFunctionsService,
    private portalFcm: PortalFcmService,
    private portalPwa: PortalPwaService,
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
      this.pushPermission = this.portalFcm.currentPermission();
      this.showIosInstallHint = this.portalPwa.showIosInstallHint();
      this.portalPwa.installAvailable$.pipe(takeUntil(this.destroy$)).subscribe((v) => {
        this.installAvailable = v;
      });
    } catch {
      this.errorMessage = PORTAL_LOAD_ERROR;
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  etiquetaBotonPush(): string {
    if (this.registeringPush) return 'Activando…';
    if (this.pushPermission === 'granted' || this.pushStatus === 'registered') {
      return 'Avisos activados';
    }
    if (this.pushPermission === 'denied') return 'Permiso denegado en el navegador';
    return 'Activar avisos push';
  }

  async instalarPortal(): Promise<void> {
    this.installingPwa = true;
    try {
      const outcome = await this.portalPwa.promptInstall();
      if (outcome === 'accepted') {
        Swal.fire({
          icon: 'success',
          title: 'Portal instalado',
          text: 'Ya puedes abrir KatzenVet desde el icono de inicio.'
        });
      } else if (outcome === 'unavailable') {
        Swal.fire({
          icon: 'info',
          title: 'Instalar desde el navegador',
          text: 'Usa el menú del navegador → Instalar aplicación. En iPhone: Compartir → Añadir a pantalla de inicio.'
        });
      }
    } finally {
      this.installingPwa = false;
    }
  }

  async activarNotificacionesPush(): Promise<void> {
    this.registeringPush = true;
    this.pushDetail = '';
    try {
      const result = await this.portalFcm.registerPortalToken();
      this.pushStatus = result.status;
      this.pushDetail = result.detail || '';
      this.pushPermission = this.portalFcm.currentPermission();
      if (result.status === 'registered') {
        Swal.fire({
          icon: 'success',
          title: 'Avisos activados',
          text: 'Te avisaremos cerca de la fecha acordada en clínica, no el día en que se vacunó a largo plazo.'
        });
      } else if (result.status === 'no_vapid') {
        Swal.fire({
          icon: 'info',
          title: 'Push pendiente de configuración',
          text: this.pushDetail
        });
      } else if (result.status === 'denied') {
        Swal.fire({
          icon: 'warning',
          title: 'Permiso denegado',
          text: 'Habilita notificaciones en la configuración del navegador.'
        });
      } else if (result.status !== 'unsupported') {
        Swal.fire({
          icon: 'warning',
          title: 'No se pudo activar',
          text: this.pushDetail || 'Intenta de nuevo más tarde.'
        });
      }
    } finally {
      this.registeringPush = false;
    }
  }
}
