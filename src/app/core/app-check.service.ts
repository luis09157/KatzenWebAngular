import { Injectable } from '@angular/core';
import { getApp, getApps } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { environment } from '../../environments/environment';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class AppCheckService {
  private initialized = false;

  constructor(private logger: LoggerService) {}

  /** Inicializa reCAPTCHA/App Check solo en pantallas de login (no en landing pública). */
  ensureInitialized(): void {
    if (this.initialized) {
      return;
    }

    if (!environment.production || !environment.recaptchaSiteKey) {
      this.logger.log('App Check omitido (desarrollo o sin clave configurada)');
      return;
    }

    try {
      if (!getApps().length) {
        this.logger.warn('App Check: Firebase aún no está listo');
        return;
      }

      initializeAppCheck(getApp(), {
        provider: new ReCaptchaV3Provider(environment.recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true
      });

      this.initialized = true;
      this.logger.log('App Check inicializado en login');
    } catch (error) {
      this.logger.error('Error al inicializar App Check:', error);
    }
  }
}
