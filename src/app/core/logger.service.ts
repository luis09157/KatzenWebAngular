import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Servicio de logging. En producción no escribe log/warn en consola; los errores sí se registran
 * para monitoreo. En desarrollo reenvía todo a console.log / warn / error.
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {

  get isProduction(): boolean {
    return environment.production === true;
  }

  log(message?: string, ...optionalParams: unknown[]): void {
    if (!this.isProduction) {
      // eslint-disable-next-line no-console
      console.log(message, ...optionalParams);
    }
  }

  warn(message?: string, ...optionalParams: unknown[]): void {
    if (!this.isProduction) {
      // eslint-disable-next-line no-console
      console.warn(message, ...optionalParams);
    }
  }

  /** En producción también se registran errores para monitoreo. */
  error(message?: string, ...optionalParams: unknown[]): void {
    if (this.isProduction) {
      // eslint-disable-next-line no-console
      console.error(message, ...optionalParams);
    } else {
      // eslint-disable-next-line no-console
      console.error(message, ...optionalParams);
    }
  }

  debug(message?: string, ...optionalParams: unknown[]): void {
    if (!this.isProduction) {
      // eslint-disable-next-line no-console
      console.debug(message, ...optionalParams);
    }
  }
}
