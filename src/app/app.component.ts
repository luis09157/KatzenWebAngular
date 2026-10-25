import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, NavigationError, Router } from '@angular/router';
import { filter, take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { LoadingService } from './core/loading.service';
import { PwaInstallService } from './core/services/pwa-install.service';
import { PwaManifestService } from './core/services/pwa-manifest.service';
import { refreshFirebaseMessagingSw } from './core/utils/firebase-messaging-sw-register';
import { RTDB_READ_TIMEOUT_MS } from './core/utils/rtdb-read-timeout.util';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'katzenvet-angular';
  /** Splash hasta la 1ª navegación (cubre el hueco del GuestGuard). */
  bootReady = false;
  private bootFallbackTimer: number | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    public globalLoading: LoadingService,
    private router: Router,
    private pwaManifest: PwaManifestService,
    private pwaInstall: PwaInstallService
  ) {
    void refreshFirebaseMessagingSw();
  }

  ngOnInit(): void {
    // Spec 087: dos manifests (portal / clínica) según la ruta.
    this.pwaManifest.start();
    this.pwaInstall.init();

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd || e instanceof NavigationError),
        take(1),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.bootReady = true;
      });

    // El login abre el formulario a los 8 s si RTDB no responde.
    // Este respaldo va después: si se apaga antes, el outlet sigue vacío y la página queda en blanco.
    this.bootFallbackTimer = window.setTimeout(() => {
      this.bootReady = true;
    }, RTDB_READ_TIMEOUT_MS + 4000);
  }

  ngOnDestroy(): void {
    if (this.bootFallbackTimer != null) {
      window.clearTimeout(this.bootFallbackTimer);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
