import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { registerFirebaseMessagingSw } from '../../core/utils/firebase-messaging-sw-register';

/**
 * PWA solo portal (spec 052 ola 2). No se ofrece instalar el admin.
 * Convive con firebase-messaging-sw.js (mismo script).
 */
@Injectable({ providedIn: 'root' })
export class PortalPwaService {
  readonly installAvailable$ = new BehaviorSubject(false);
  private deferredPrompt: { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null =
    null;
  private initialized = false;

  init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      this.deferredPrompt = event as unknown as {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: string }>;
      };
      this.installAvailable$.next(true);
    });

    window.addEventListener('appinstalled', () => {
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

  /** iPhone/iPad Safari: no hay beforeinstallprompt; hay que usar Compartir → Inicio. */
  isIosSafari(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
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
