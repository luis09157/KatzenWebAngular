import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../logger.service';
import { registerFirebaseMessagingSw } from '../utils/firebase-messaging-sw-register';
import { mensajeFcmHumano } from '../../portal/utils/portal-fcm-copy.util';

export type PortalFcmStatus = 'unsupported' | 'no_vapid' | 'denied' | 'registered' | 'error';

export type FcmPlatform = 'portal_web' | 'admin_web';

@Injectable({ providedIn: 'root' })
export class PortalFcmService {
  private messaging: firebase.messaging.Messaging | null = null;

  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFireDatabase,
    private logger: LoggerService
  ) {}

  /** SC-025: no re-pide el diálogo nativo si ya hay decisión. */
  currentPermission(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /** Spec 023 / 031 — VAPID + SW listo; no re-pide permiso si ya está granted. */
  async registerPortalToken(): Promise<{ status: PortalFcmStatus; detail?: string }> {
    return this.registerToken('portal_web');
  }

  /** Spec 052 ola 2 — avisos de vacunas al staff (mismo nodo FcmTokens/{uid}). */
  async registerStaffToken(): Promise<{ status: PortalFcmStatus; detail?: string }> {
    return this.registerToken('admin_web');
  }

  async registerToken(platform: FcmPlatform): Promise<{ status: PortalFcmStatus; detail?: string }> {
    const iosSafari = this.isIosSafari();
    const standalone = this.isStandalone();

    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      return {
        status: 'unsupported',
        detail: mensajeFcmHumano('unsupported', { iosSafari, standalone }),
      };
    }

    const vapidKey = environment.fcmVapidKey?.trim();
    if (!vapidKey) {
      return {
        status: 'no_vapid',
        detail: mensajeFcmHumano('no_vapid', { iosSafari, standalone }),
      };
    }

    const user = await this.afAuth.currentUser;
    if (!user?.uid) {
      return {
        status: 'error',
        detail:
          platform === 'admin_web'
            ? 'Inicia sesión en el panel para activar avisos de la clínica.'
            : 'Inicia sesión en el portal para activar avisos.',
      };
    }

    try {
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      if (permission !== 'granted') {
        return {
          status: 'denied',
          detail: mensajeFcmHumano('denied', { iosSafari, standalone }),
        };
      }

      const registration = await registerFirebaseMessagingSw();
      await navigator.serviceWorker.ready;

      this.messaging = this.messaging ?? firebase.messaging();
      const token = await this.messaging.getToken({
        vapidKey,
        serviceWorkerRegistration: registration,
      });
      if (!token) {
        return {
          status: 'error',
          detail: mensajeFcmHumano('error', { iosSafari, standalone }),
        };
      }

      const tokenKey = this.tokenKey(token);
      await this.db.object(`Katzen/FcmTokens/${user.uid}/${tokenKey}`).set({
        token,
        platform,
        updatedAt: new Date().toISOString(),
        activo: true,
      });

      return { status: 'registered', detail: mensajeFcmHumano('registered') };
    } catch (error) {
      this.logger.error('Error registrando avisos:', error);
      return {
        status: 'error',
        detail: mensajeFcmHumano('error', { iosSafari, standalone }),
      };
    }
  }

  private isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    const nav = window.navigator as Navigator & { standalone?: boolean };
    return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
  }

  private isIosSafari(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    const iOS =
      /iPad|iPhone|iPod/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    return iOS && /WebKit/.test(ua) && !/CriOS|FxiOS/.test(ua);
  }

  private tokenKey(token: string): string {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    return `web_${Math.abs(hash).toString(36)}`;
  }
}
