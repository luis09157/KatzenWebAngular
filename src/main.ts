import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

// Registrar el locale español
registerLocaleData(localeEs);

platformBrowserDynamic().bootstrapModule(AppModule, {
  providers: [
    { provide: 'LOCALE_ID', useValue: 'es-ES' }
  ]
})
  .catch(err => console.error(err));