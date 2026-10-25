import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthAccess, AuthProfileService } from '../core/services/auth-profile.service';
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
    try {
      const user = await this.authService.waitForAuthUser();
      if (!user) {
        await this.router.navigate(['/admin/login']);
        return;
      }

      // Destinos ya: syncMyClaims no debe dejar el spinner si el preflight CORS falla o no responde.
      if (this.puedeElegirDestino()) {
        this.loading = false;
      }

      // Antes de App Check: el header X-Firebase-AppCheck tumba el preflight de la función aún no redesplegada.
      await this.firebaseFunctions.syncMyClaims();
      this.appCheck.ensureInitialized();

      const access = await this.resolveAccessConTope();
      await this.aplicarAcceso(access);
    } catch {
      this.appCheck.ensureInitialized();
      if (this.puedeElegirDestino()) {
        this.loading = false;
        return;
      }
      this.error = 'No pudimos verificar tu perfil. Intenta de nuevo.';
      this.loading = false;
    }
  }

  /** RTDB/claims no deben dejar el selector en spinner si la red no responde. */
  private resolveAccessConTope(): Promise<AuthAccess> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('perfil timeout')), 8000);
    });
    return Promise.race([this.authProfileService.resolveAccess(), timeout]).finally(() => {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    });
  }

  /** Login dual dejó el marcador, o el staff pidió entrar y no viene del portal. */
  private puedeElegirDestino(): boolean {
    return (
      this.authSession.hasPendingContextChoice() ||
      (this.authSession.hasStaffEntryIntent() && !this.authSession.isPortalEntryLocked())
    );
  }

  private async aplicarAcceso(access: AuthAccess): Promise<void> {
    const allowSelector = this.puedeElegirDestino();

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
