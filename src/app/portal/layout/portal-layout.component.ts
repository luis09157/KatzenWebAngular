import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { PortalAuthService } from '../services/portal-auth.service';
import { PortalSessionService } from '../services/portal-session.service';
import { PortalDataService } from '../services/portal-data.service';
import { AuthProfileService } from '../../core/services/auth-profile.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { PortalPwaService } from '../services/portal-pwa.service';

@Component({
  selector: 'app-portal-layout',
  templateUrl: './portal-layout.component.html',
  styleUrls: ['./portal-layout.component.css'],
})
export class PortalLayoutComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  showBack = false;
  pageTitle = 'Tus mascotas';
  userDisplayName = '';
  userInitial = '?';
  sinLeer = 0;
  pageSubtitle = '';
  /** Dual / staff: atajo al panel admin. */
  canGoAdmin = false;

  constructor(
    private router: Router,
    private portalAuth: PortalAuthService,
    private portalSession: PortalSessionService,
    private portalData: PortalDataService,
    private authProfileService: AuthProfileService,
    private authSession: AuthSessionService,
    private portalPwa: PortalPwaService
  ) {}

  ngOnInit(): void {
    this.portalPwa.init();
    void this.loadUserHeader();
    this.updateFromUrl(this.router.url);
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((e: NavigationEnd) => this.updateFromUrl(e.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadUserHeader(): Promise<void> {
    try {
      // Atajo admin solo si la sesión NO nació en portal/landing (lock de entrada).
      this.canGoAdmin = (await this.authProfileService.hasStaffAccess()) && !this.authSession.isPortalEntryLocked();

      const session = await this.portalSession.resolveSession();
      if (!session) return;

      const emailName = session.email.split('@')[0] || '';
      let firstName = emailName;

      const cliente = await this.portalData.getCliente(session.clienteId);
      if (cliente?.['nombre']) {
        firstName = String(cliente['nombre']).trim().split(/\s+/)[0];
      }

      this.userDisplayName = firstName.toUpperCase();
      this.userInitial = firstName.charAt(0).toUpperCase() || '?';

      const notifs = await this.portalData.getNotificaciones(session.clienteId);
      this.sinLeer = notifs.filter((n) => !n.leida).length;
    } catch {
      this.sinLeer = 0;
    }
  }

  private updateFromUrl(url: string): void {
    this.showBack = /\/portal\/mascotas\/[^/]+/.test(url);
    this.pageSubtitle = '';

    if (url.includes('/notificaciones')) {
      this.pageTitle = 'Notificaciones';
      this.pageSubtitle = 'Avisos de la clínica: refuerzos en la fecha acordada, citas y novedades';
    } else if (url.includes('/perfil')) {
      this.pageTitle = 'Mi cuenta';
      this.pageSubtitle = 'Datos de contacto y configuración de tu acceso';
    } else if (/\/vacunas/.test(url)) {
      this.pageTitle = 'Vacunas';
      this.pageSubtitle = 'Historial y fechas acordadas en clínica';
    } else if (/\/citas/.test(url)) {
      this.pageTitle = 'Citas';
      this.pageSubtitle = 'Solo consulta · para agendar, llama a la clínica';
    } else if (/\/historial/.test(url)) {
      this.pageTitle = 'Historial clínico';
      this.pageSubtitle = 'Consultas y tratamientos registrados';
    } else if (/\/banos/.test(url)) {
      this.pageTitle = 'Baños y peluquería';
      this.pageSubtitle = 'Servicios de estética registrados';
    } else if (
      /\/mascotas\/.+/.test(url) &&
      !/\/vacunas|citas|historial|banos|pension|recordatorios|visitas|consentimientos/.test(url)
    ) {
      this.pageTitle = 'Expediente';
      this.pageSubtitle = 'Baños, vacunas y consultas en orden de fecha';
      void this.loadExpedienteTitle(url);
    } else {
      this.pageTitle = 'Tus mascotas';
      this.pageSubtitle = 'Entra a una mascota para ver su expediente';
    }
  }

  /** H1 «Expediente de {nombre}» cuando hay mascota en la URL. */
  private async loadExpedienteTitle(url: string): Promise<void> {
    const match = url.match(/\/portal\/mascotas\/([^/?#]+)/);
    const mascotaId = match?.[1];
    if (!mascotaId) return;
    try {
      const session = await this.portalSession.resolveSession();
      if (!session) return;
      const mascota = await this.portalData.getMascotaForCliente(mascotaId, session.clienteId);
      const nombre = String(mascota?.['nombre'] || '').trim();
      if (nombre) {
        const path = this.router.url.split('?')[0].replace(/\/$/, '');
        if (/\/portal\/mascotas\/[^/]+$/.test(path)) {
          this.pageTitle = `Expediente de ${nombre}`;
        }
      }
    } catch {
      /* título genérico «Expediente» ya aplicado */
    }
  }

  goBack(): void {
    if (/\/vacunas|citas|historial|banos|pension|recordatorios|visitas|consentimientos/.test(this.router.url)) {
      const parts = this.router.url.split('/');
      const mascotaId = parts[parts.indexOf('mascotas') + 1];
      this.router.navigate(['/portal/mascotas', mascotaId]);
      return;
    }
    this.router.navigate(['/portal/mascotas']);
  }

  async logout(): Promise<void> {
    await this.portalAuth.logout();
  }

  irAPanelAdmin(): void {
    if (this.authSession.isPortalEntryLocked()) {
      return;
    }
    this.router.navigate(['/admin/inicio']);
  }
}
