import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/** Mensajes canónicos del overlay global (español latino). */
export const LOADING_MESSAGES = {
  loading: 'Cargando…',
  saving: 'Guardando…',
  deleting: 'Eliminando…',
  updating: 'Actualizando…',
  /** Cobro POS / caja */
  charging: 'Cobrando…',
  /** Catálogos / listas grandes */
  loadingCatalog: 'Cargando productos…',
  loadingPanel: 'Cargando panel…',
} as const;

export type LoadingMessage = (typeof LOADING_MESSAGES)[keyof typeof LOADING_MESSAGES] | string;

/**
 * Servicio global de loading. Una sola barra en la app para cualquier operación async.
 * Contador: varias operaciones simultáneas no ocultan la barra hasta que todas terminen.
 *
 * Regla: cada `show()` debe emparejarse con un `hide()` (preferir `finally` / `wrap`).
 * **Prohibido** `show()` inmediatamente antes de `dialogRef.close()` — si el padre no hace
 * `hide()` (p. ej. «Llegó un paciente»), el overlay queda eterno. Spec **005**.
 * No llamar `show()` en el diálogo y otra vez en el padre al cerrar — duplica el contador.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private count = 0;
  private readonly loading$ = new BehaviorSubject<boolean>(false);
  private readonly message$ = new BehaviorSubject<string>(LOADING_MESSAGES.loading);

  get isLoading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  /** Texto del overlay (p. ej. «Guardando…»). */
  get message(): Observable<string> {
    return this.message$.asObservable();
  }

  /**
   * Muestra el overlay. `message` opcional; por defecto «Cargando…».
   * Callers existentes sin argumento siguen funcionando.
   */
  show(message: LoadingMessage = LOADING_MESSAGES.loading): void {
    this.count++;
    this.message$.next(message || LOADING_MESSAGES.loading);
    this.loading$.next(true);
  }

  hide(): void {
    this.count = Math.max(0, this.count - 1);
    if (this.count === 0) {
      this.loading$.next(false);
      this.message$.next(LOADING_MESSAGES.loading);
    } else {
      this.loading$.next(true);
    }
  }

  /**
   * Apaga el overlay sin importar el contador.
   * Solo recuperación / red de seguridad (p. ej. tras cerrar un wizard); no usar en flujo normal.
   */
  forceHide(): void {
    this.count = 0;
    this.loading$.next(false);
    this.message$.next(LOADING_MESSAGES.loading);
  }

  /**
   * Ejecuta una Promise mostrando loading y cerrando siempre (success y error).
   */
  wrap<T>(fn: () => Promise<T>, message: LoadingMessage = LOADING_MESSAGES.loading): Promise<T> {
    this.show(message);
    return fn()
      .then((result) => {
        this.hide();
        return result;
      })
      .catch((err) => {
        this.hide();
        throw err;
      });
  }
}
