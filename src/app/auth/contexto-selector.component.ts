import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { AuthSessionService } from '../core/services/auth-session.service';
import { FirebaseFunctionsService } from '../core/services/firebase-functions.service';
import { AppCheckService } from '../core/app-check.service';

@Component({
  selector: 'app-contexto-selector',
  templateUrl: './contexto-selector.component.html',
  // Reutiliza el shell centrado del login admin (admin-auth-page / admin-auth-card).
  styleUrls: ['./auth.component.css', './contexto-selector.component.css'],
})
export class ContextoSelectorComponent implements OnInit {
  loading = true;
  choosing = false;
  error = '';

  constructor(
    private authService: AuthService,
    private authProfileService: AuthProfileService,
    private authSession: AuthSessionService,
    private firebaseFunctions: FirebaseFunctionsService,
    private appCheck: AppCheckService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.appCheck.ensureInitialized();
    try {
      const user = await this.authService.waitForAuthUser();
      if (!user) {
        await this.router.navigate(['/admin/login']);
        return;
      }

      await this.firebaseFunctions.syncMyClaims();
      const access = await this.authProfileService.resolveAccess();

      const allowSelector =
        this.authSession.hasPendingContextChoice() ||
        (this.authSession.hasStaffEntryIntent() && !this.authSession.isPortalEntryLocked());

      if (!allowSelector) {
        if (access.clientAccess) {
          this.authSession.setPortalEntryLock(true);
          await this.router.navigate(['/portal/mascotas']);
          return;
        }
        if (access.staffAccess) {
          await this.router.navigate(['/admin/inicio']);
          return;
        }
        this.error = 'Tu cuenta no tiene acceso al panel ni al portal.';
        this.loading = false;
        return;
      }

      if (access.staffAccess && access.clientAccess) {
        this.loading = false;
        return;
      }
      if (access.staffAccess) {
        await this.router.navigate(['/admin/inicio']);
        return;
      }
      if (access.clientAccess) {
        this.authSession.setPortalEntryLock(true);
        await this.router.navigate(['/portal/mascotas']);
        return;
      }

      this.error = 'Tu cuenta no tiene acceso al panel ni al portal.';
      this.loading = false;
    } catch {
      this.error = 'No pudimos verificar tu perfil. Intenta de nuevo.';
      this.loading = false;
    }
  }

  async irAdmin(): Promise<void> {
    if (this.choosing) return;
    this.choosing = true;
    try {
      this.authSession.clearPendingContextChoice();
      this.authSession.setPortalEntryLock(false);
      this.authSession.setStaffEntryIntent(true);
      await this.router.navigate(['/admin/inicio']);
    } finally {
      this.choosing = false;
    }
  }

  async irPortal(): Promise<void> {
    if (this.choosing) return;
    this.choosing = true;
    try {
      this.authSession.clearPendingContextChoice();
      this.authSession.setPortalEntryLock(true);
      this.authSession.setStaffEntryIntent(false);
      await this.router.navigate(['/portal/mascotas']);
    } finally {
      this.choosing = false;
    }
  }

  async cerrarSesion(): Promise<void> {
    await this.authService.signOutOnly();
    await this.router.navigate(['/']);
  }
}
