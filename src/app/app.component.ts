import { Component, OnInit } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { environment } from '../environments/environment';
import { LoggerService } from './core/logger.service';
import { LoadingService } from './core/loading.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'katzenvet-angular';

  constructor(
    private logger: LoggerService,
    public globalLoading: LoadingService
  ) {}

  ngOnInit() {
    if (environment.production && environment.recaptchaSiteKey) {
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
      this.logger.log('⚠️ App Check no inicializado (modo desarrollo)');
    }
  }
}