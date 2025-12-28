import { Injectable } from '@angular/core';
import { initializeApp } from '@angular/fire/app';
import { initializeAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AppCheckService {
  constructor() {
    this.initializeAppCheck();
  }

  private initializeAppCheck() {
    // Solo inicializar en producción
    if (environment.production && environment.recaptchaSiteKey !== 'TU_CLAVE_DEL_SITIO_AQUI') {
      try {
        const app = initializeApp(environment.firebase);
        
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(environment.recaptchaSiteKey),
          isTokenAutoRefreshEnabled: true
        });
        
        console.log('✅ App Check inicializado correctamente');
      } catch (error) {
        console.error('❌ Error al inicializar App Check:', error);
      }
    } else {
      console.log('⚠️ App Check no inicializado (desarrollo o clave no configurada)');
    }
  }
}

