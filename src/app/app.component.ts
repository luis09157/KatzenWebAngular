import { Component, OnInit } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'katzenvet-angular';

  ngOnInit() {
    // Inicializar App Check en producción
    if (environment.production && environment.recaptchaSiteKey) {
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
      console.log('⚠️ App Check no inicializado (modo desarrollo)');
    }
  }
}