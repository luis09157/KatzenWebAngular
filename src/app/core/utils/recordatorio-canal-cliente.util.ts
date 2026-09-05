/** Spec 072 — si el dueño puede recibir avisos (sin jerga técnica). */

export interface CanalRecordatorioCliente {
  correo?: string | null;
  portalEmail?: string | null;
  portalActivo?: boolean | null;
  authUid?: string | null;
  /** Hay token de avisos en el celular/navegador del dueño. */
  tieneAvisosPush?: boolean | null;
}

export interface CanalRecordatorioVista {
  recibira: boolean;
  faltantes: string[];
  mensaje: string;
}

function correoUtil(raw: string | null | undefined): string {
  const mail = String(raw || '').trim();
  if (!mail || mail.toLowerCase() === 'no proporcionado') return '';
  return mail.includes('@') ? mail : '';
}

export function evaluarCanalRecordatorioCliente(
  c: CanalRecordatorioCliente | null | undefined
): CanalRecordatorioVista {
  const src = c || {};
  const correo = correoUtil(src.correo) || correoUtil(src.portalEmail);
  const portalActivo = src.portalActivo === true && !!String(src.authUid || '').trim();
  const avisos = src.tieneAvisosPush === true;

  const faltantes: string[] = [];
  if (!correo) faltantes.push('correo');
  if (!portalActivo) faltantes.push('activar portal');
  if (!avisos) faltantes.push('permitir avisos');

  const recibira = correo.length > 0 || portalActivo || avisos;
  const lista = faltantes.join(' / ');
  const mensaje = recibira
    ? faltantes.length
      ? `Este dueño sí recibirá recordatorios — falta: ${lista}.`
      : 'Este dueño sí recibirá recordatorios.'
    : `Este dueño no recibirá recordatorios — falta: ${lista}.`;

  return { recibira, faltantes, mensaje };
}
