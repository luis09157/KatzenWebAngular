import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { registerFirebaseMessagingSw } from '../utils/firebase-messaging-sw-register';

type DeferredPrompt = {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

/**
 * Install prompt compartido (portal + clínica). Spec 087.
 * El manifest activo lo define `PwaManifestService` según la ruta.
 */
@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  readonly installAvailable$ = new BehaviorSubject(false);
  private deferredPrompt: DeferredPrompt | null = null;
  private initialized = false;

  init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      this.deferredPrompt = event as unknown as DeferredPrompt;
      this.installAvailable$.next(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.installAvailable$.next(false);
    });

    // Al cambiar de manifest, el prompt anterior ya no aplica.
    document.addEventListener('katzen-pwa-manifest-changed', () => {
      this.deferredPrompt = null;
      this.installAvailable$.next(false);
    });

    if ('serviceWorker' in navigator) {
      void registerFirebaseMessagingSw().catch(() => undefined);
    }
  }

  isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    const nav = window.navigator as Navigator & { standalone?: boolean };
    return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
  }

  /** iPhone/iPad Safari: no hay beforeinstallprompt; Compartir → Inicio. */
  isIosSafari(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    const iOS =
      /iPad|iPhone|iPod/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    const webkit = /WebKit/.test(ua);
    const notCriOS = !/CriOS/.test(ua);
    const notFxiOS = !/FxiOS/.test(ua);
    return iOS && webkit && notCriOS && notFxiOS;
  }

  showIosInstallHint(): boolean {
    return this.isIosSafari() && !this.isStandalone();
  }

  async promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferredPrompt) return 'unavailable';
    await this.deferredPrompt.prompt();
    const choice = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.installAvailable$.next(false);
    return choice.outcome === 'accepted' ? 'accepted' : 'dismissed';
  }
}
