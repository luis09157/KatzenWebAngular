import { Injectable } from '@angular/core';
import { initializeApp } from '@angular/fire/app';
import { initializeAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';
import { environment } from '../../environments/environment';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class AppCheckService {
  constructor(private logger: LoggerService) {
    this.initializeAppCheck();
  }

  private initializeAppCheck() {
    if (environment.production && environment.recaptchaSiteKey !== 'TU_CLAVE_DEL_SITIO_AQUI') {
      try {
        const app = initializeApp(environment.firebase);
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(environment.recaptchaSiteKey),
          isTokenAutoRefreshEnabled: true
        });
        this.logger.log('✅ App Check inicializado correctamente');
      } catch (error) {
        this.logger.error('❌ Error al inicializar App Check:', error);
      }
    } else {
      this.logger.log('⚠️ App Check no inicializado (desarrollo o clave no configurada)');
    }
  }
}

