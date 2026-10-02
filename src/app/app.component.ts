import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, NavigationError, Router } from '@angular/router';
import { filter, take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { LoadingService } from './core/loading.service';
import { refreshFirebaseMessagingSw } from './core/utils/firebase-messaging-sw-register';

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
    private router: Router
  ) {
    void refreshFirebaseMessagingSw();
  }

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd || e instanceof NavigationError),
        take(1),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.bootReady = true;
      });

    // Red de seguridad: no dejar el splash eterno si no hay evento de router.
    this.bootFallbackTimer = window.setTimeout(() => {
      this.bootReady = true;
    }, 8000);
  }

  ngOnDestroy(): void {
    if (this.bootFallbackTimer != null) {
      window.clearTimeout(this.bootFallbackTimer);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
