import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../logger.service';
import { registerFirebaseMessagingSw } from '../utils/firebase-messaging-sw-register';

export type PortalFcmStatus =
  | 'unsupported'
  | 'no_vapid'
  | 'denied'
  | 'registered'
  | 'error';

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

  async registerToken(
    platform: FcmPlatform
  ): Promise<{ status: PortalFcmStatus; detail?: string }> {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      return {
        status: 'unsupported',
        detail:
          platform === 'admin_web'
            ? 'Este navegador no soporta avisos push. En iPhone, añade el portal a inicio si usas el dueño.'
            : 'Este navegador no soporta notificaciones push. En iPhone: Compartir → Añadir a pantalla de inicio.'
      };
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
      return {
        status: 'error',
        detail:
          platform === 'admin_web'
            ? 'Inicia sesión en admin para activar avisos de la clínica.'
            : 'Inicia sesión en el portal para activar avisos.'
      };
    }

    try {
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      if (permission !== 'granted') {
        return { status: 'denied', detail: 'Permiso de notificaciones denegado.' };
      }

      const registration = await registerFirebaseMessagingSw();
      await navigator.serviceWorker.ready;

      this.messaging = this.messaging ?? firebase.messaging();
      const token = await this.messaging.getToken({
        vapidKey,
        serviceWorkerRegistration: registration
      });
      if (!token) {
        return { status: 'error', detail: 'No se pudo obtener el token FCM.' };
      }

      const tokenKey = this.tokenKey(token);
      await this.db.object(`Katzen/FcmTokens/${user.uid}/${tokenKey}`).set({
        token,
        platform,
        updatedAt: new Date().toISOString(),
        activo: true
      });

      return { status: 'registered' };
    } catch (error) {
      this.logger.error('Error registrando FCM:', error);
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
