import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { PortalAuthService } from '../services/portal-auth.service';

@Component({
  selector: 'app-portal-layout',
  templateUrl: './portal-layout.component.html',
  styleUrls: ['./portal-layout.component.css']
})
export class PortalLayoutComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  showBack = false;
  pageTitle = 'Mis mascotas';

  constructor(
    private router: Router,
    private portalAuth: PortalAuthService
  ) {}

  ngOnInit(): void {
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

  private updateFromUrl(url: string): void {
    this.showBack = /\/portal\/mascotas\/[^/]+/.test(url);
    if (url.includes('/notificaciones')) this.pageTitle = 'Avisos';
    else if (url.includes('/perfil')) this.pageTitle = 'Mi cuenta';
    else if (/\/vacunas/.test(url)) this.pageTitle = 'Vacunas';
    else if (/\/citas/.test(url)) this.pageTitle = 'Citas';
    else if (/\/historial/.test(url)) this.pageTitle = 'Historial';
    else if (/\/mascotas\/.+/.test(url) && !/\/vacunas|citas|historial/.test(url)) this.pageTitle = 'Expediente';
    else this.pageTitle = 'Mis mascotas';
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
