import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Servicio global de loading. Una sola barra en la app para cualquier operación async.
 * Contador: varias operaciones simultáneas no ocultan la barra hasta que todas terminen.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private count = 0;
  private readonly loading$ = new BehaviorSubject<boolean>(false);

  get isLoading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  show(): void {
    this.count++;
    this.loading$.next(true);
  }

  hide(): void {
    this.count = Math.max(0, this.count - 1);
    this.loading$.next(this.count > 0);
  }

  wrap<T>(fn: () => Promise<T>): Promise<T> {
    this.show();
    return fn()
      .then(result => { this.hide(); return result; })
      .catch(err => { this.hide(); throw err; });
  }
}
