import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../logger.service';

export type PortalFcmStatus =
  | 'unsupported'
  | 'no_vapid'
  | 'denied'
  | 'registered'
  | 'error';

@Injectable({ providedIn: 'root' })
export class PortalFcmService {
  private messaging: firebase.messaging.Messaging | null = null;

  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFireDatabase,
    private logger: LoggerService
  ) {}

  /** Spec 023 fase B — requiere `environment.fcmVapidKey` y SW en `/firebase-messaging-sw.js`. */
  async registerPortalToken(): Promise<{ status: PortalFcmStatus; detail?: string }> {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      return { status: 'unsupported', detail: 'Este navegador no soporta notificaciones push.' };
    }

    const vapidKey = environment.fcmVapidKey?.trim();
    if (!vapidKey) {
      return {
        status: 'no_vapid',
        detail:
          'Falta configurar fcmVapidKey en environment (Firebase Console → Cloud Messaging → Web Push certificates).'
      };
    }

    const user = await this.afAuth.currentUser;
    if (!user?.uid) {
      return { status: 'error', detail: 'Inicia sesión en el portal para activar avisos.' };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { status: 'denied', detail: 'Permiso de notificaciones denegado.' };
      }

      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      this.messaging = this.messaging ?? firebase.messaging();
      const token = await this.messaging.getToken({ vapidKey });
      if (!token) {
        return { status: 'error', detail: 'No se pudo obtener el token FCM.' };
      }

      const tokenKey = this.tokenKey(token);
      await this.db.object(`Katzen/FcmTokens/${user.uid}/${tokenKey}`).set({
        token,
        platform: 'portal_web',
        updatedAt: new Date().toISOString(),
        activo: true
      });

      return { status: 'registered' };
    } catch (error) {
      this.logger.error('Error registrando FCM portal:', error);
      return {
        status: 'error',
        detail: error instanceof Error ? error.message : 'Error al registrar push.'
      };
    }
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
