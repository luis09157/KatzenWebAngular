import { Observable, TimeoutError, firstValueFrom } from 'rxjs';
import { take, timeout } from 'rxjs/operators';

/** Tope de una lectura RTDB en login. El SDK reintenta el WebSocket; sin esto el spinner no termina. */
export const RTDB_READ_TIMEOUT_MS = 8000;

export const RTDB_UNAVAILABLE_CODE = 'rtdb-unavailable';

/** Reutiliza el acceso armado con claims cuando el socket no respondió, para no esperar otro tope. */
export const RTDB_TIMEOUT_ACCESS_CACHE_MS = 10000;

export function isRtdbReadTimeout(error: unknown): boolean {
  return error instanceof TimeoutError || (error as { name?: string } | null)?.name === 'TimeoutError';
}

export function rtdbUnavailableError(): Error & { code: string } {
  const error = new Error('RTDB no respondió') as Error & { code: string };
  error.name = 'RtdbUnavailableError';
  error.code = RTDB_UNAVAILABLE_CODE;
  return error;
}

export function isRtdbUnavailableError(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === RTDB_UNAVAILABLE_CODE;
}

/** Primera emisión, o TimeoutError si el socket no entrega valor a tiempo. */
export function firstRtdbValue<T>(source: Observable<T>, ms = RTDB_READ_TIMEOUT_MS): Promise<T> {
  return firstValueFrom(source.pipe(take(1), timeout(ms)));
}

/** El guard no terminó a tiempo: hay que pintar el formulario, no dejar el outlet vacío. */
export const LOGIN_ROUTE_DEADLINE = 'login-route-deadline' as const;

/**
 * Cierra la ruta de login aunque Auth o RTDB no contesten.
 * Al cumplirse el plazo, `cancelled()` pasa a true y el trabajo no debe navegar.
 */
export function settleLoginRoute<T>(
  work: (cancelled: () => boolean) => Promise<T>,
  ms = RTDB_READ_TIMEOUT_MS
): Promise<T | typeof LOGIN_ROUTE_DEADLINE> {
  const gate = { closed: false };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<typeof LOGIN_ROUTE_DEADLINE>((resolve) => {
    timer = setTimeout(() => {
      gate.closed = true;
      resolve(LOGIN_ROUTE_DEADLINE);
    }, ms);
  });

  const ran = work(() => gate.closed).then(
    (value) => (gate.closed ? LOGIN_ROUTE_DEADLINE : value),
    (error: unknown) => {
      if (gate.closed) {
        return LOGIN_ROUTE_DEADLINE;
      }
      throw error;
    }
  );

  return Promise.race([ran, deadline]).finally(() => {
    gate.closed = true;
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  });
}
