import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import {
  PWA_APPLE_TITLE,
  PWA_MANIFEST_HREF,
  PwaManifestKind,
  resolvePwaManifestKind,
} from '../utils/pwa-manifest.util';

/**
 * Cambia el `<link rel="manifest">` según la ruta (spec 087).
 * Portal vs Clínica = dos PWAs en el mismo origen.
 */
@Injectable({ providedIn: 'root' })
export class PwaManifestService {
  private active: PwaManifestKind | null = null;
  private started = false;

  constructor(private router: Router) {}

  /** Escucha el router y aplica el manifest correcto. */
  start(): void {
    if (this.started || typeof document === 'undefined') return;
    this.started = true;
    this.applyForUrl(this.router.url || '/');
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.applyForUrl(e.urlAfterRedirects || e.url);
    });
  }

  getActiveKind(): PwaManifestKind | null {
    return this.active;
  }

  applyForUrl(url: string): void {
    this.setKind(resolvePwaManifestKind(url));
  }

  setKind(kind: PwaManifestKind): void {
    if (this.active === kind) return;
    this.active = kind;
    const href = PWA_MANIFEST_HREF[kind];
    let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    // Cache-bust leve para que el navegador relea al cambiar de kind.
    link.href = `${href}?v=${kind}`;

    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null;
    if (appleTitle) {
      appleTitle.content = PWA_APPLE_TITLE[kind];
    }

    document.dispatchEvent(new CustomEvent('katzen-pwa-manifest-changed', { detail: { kind } }));
  }
}
