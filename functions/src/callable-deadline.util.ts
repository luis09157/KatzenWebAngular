import { HttpsError } from 'firebase-functions/v2/https';

/**
 * Tope interno. Tiene que terminar antes que el timeout de Cloud Run
 * (syncMyClaims: 20s) para que el 503 salga de la función, con CORS.
 */
export const CALLABLE_IO_TIMEOUT_MS = 5000;

/**
 * Si RTDB o Auth no contestan, devolvemos error desde la función.
 * Un 504 del gateway no trae Access-Control-Allow-Origin y el navegador lo muestra como CORS.
 */
export function withDeadline<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new HttpsError('unavailable', `${label} no respondió a tiempo.`));
    }, ms);
  });
  promise.then(
    () => undefined,
    () => undefined
  );
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  });
}
