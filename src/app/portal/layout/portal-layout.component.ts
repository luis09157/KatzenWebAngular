import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { PortalAuthService } from '../services/portal-auth.service';
import { PortalSessionService } from '../services/portal-session.service';
import { PortalDataService } from '../services/portal-data.service';

@Component({
  selector: 'app-portal-layout',
  templateUrl: './portal-layout.component.html',
  styleUrls: ['./portal-layout.component.css']
})
export class PortalLayoutComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  showBack = false;
  pageTitle = 'Mis mascotas';
  userDisplayName = '';
  userInitial = '?';
  sinLeer = 0;
  pageSubtitle = '';

  constructor(
    private router: Router,
    private portalAuth: PortalAuthService,
    private portalSession: PortalSessionService,
    private portalData: PortalDataService
  ) {}

  ngOnInit(): void {
    void this.loadUserHeader();
    this.updateFromUrl(this.router.url);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((e: NavigationEnd) => this.updateFromUrl(e.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadUserHeader(): Promise<void> {
    try {
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
      this.sinLeer = notifs.filter(n => !n.leida).length;
    } catch {
      this.sinLeer = 0;
    }
  }

  private updateFromUrl(url: string): void {
    this.showBack = /\/portal\/mascotas\/[^/]+/.test(url);
    this.pageSubtitle = '';

    if (url.includes('/notificaciones')) {
      this.pageTitle = 'Notificaciones';
      this.pageSubtitle = 'Avisos sobre vacunas, citas y novedades de tus mascotas';
    } else if (url.includes('/perfil')) {
      this.pageTitle = 'Mi cuenta';
      this.pageSubtitle = 'Datos de contacto y configuración de tu acceso';
    } else if (/\/vacunas/.test(url)) {
      this.pageTitle = 'Vacunas';
      this.pageSubtitle = 'Historial de vacunación';
    } else if (/\/citas/.test(url)) {
      this.pageTitle = 'Citas';
      this.pageSubtitle = 'Consultas y citas programadas';
    } else if (/\/historial/.test(url)) {
      this.pageTitle = 'Historial clínico';
      this.pageSubtitle = 'Consultas y tratamientos registrados';
    } else if (/\/mascotas\/.+/.test(url) && !/\/vacunas|citas|historial/.test(url)) {
      this.pageTitle = 'Expediente';
      this.pageSubtitle = 'Resumen del expediente médico';
    } else {
      this.pageTitle = 'Mis mascotas';
      this.pageSubtitle = 'Selecciona una mascota para consultar su expediente';
    }
  }

  goBack(): void {
    if (/\/vacunas|citas|historial/.test(this.router.url)) {
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
}
