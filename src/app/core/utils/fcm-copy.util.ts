/** Copy FCM humano para dueños (portal). Spec 076 → core para que core/services no importe portal/. */

export type FcmCopyStatus = 'unsupported' | 'no_vapid' | 'denied' | 'registered' | 'error' | 'idle';

export interface FcmCopyOpts {
  iosSafari?: boolean;
  standalone?: boolean;
}

const IPHONE_HINT = 'En iPhone: Compartir → Añadir a inicio, luego Activar avisos.';

/** Copy para dueños. Nunca FCM / token / VAPID / Firebase. */
export function mensajeFcmHumano(status: FcmCopyStatus, opts: FcmCopyOpts = {}): string {
  const ios = opts.iosSafari === true && opts.standalone !== true;

  switch (status) {
    case 'registered':
      return 'Avisos activados. Te avisaremos cerca de la fecha acordada en clínica.';
    case 'denied':
      return ios
        ? `El navegador bloqueó los avisos. ${IPHONE_HINT}`
        : 'Bloqueaste los avisos. En el candado del navegador, permite notificaciones y vuelve a intentar.';
    case 'unsupported':
      return ios
        ? IPHONE_HINT
        : 'Este navegador no puede mostrar avisos. Prueba Chrome o Safari, o añade el portal a inicio.';
    case 'no_vapid':
      return 'Los avisos aún no están listos. Llama a la clínica si necesitas un recordatorio.';
    case 'error':
      return ios
        ? `No pudimos activar avisos. ${IPHONE_HINT}`
        : 'No pudimos activar avisos. Revisa la conexión e inténtalo de nuevo.';
    default:
      return '';
  }
}

export function hintFcmIos(opts: FcmCopyOpts = {}): string {
  if (opts.iosSafari === true && opts.standalone !== true) {
    return IPHONE_HINT;
  }
  return '';
}
