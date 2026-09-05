/**
 * Spec 066 — recordatorio por WhatsApp (`wa.me/` con texto prellenado).
 * Funciones puras: sin Angular, sin Firebase. Lada país fija México (52).
 */

export const WHATSAPP_LADA_MX = '52';
export const NOMBRE_CLINICA_DEFAULT = 'KatzenVet';

const DIAS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
const MESES_CORTOS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Tipo de recordatorio → texto natural para el dueño. */
export const TIPO_RECORDATORIO_TEXTO: Record<string, string> = {
  vacuna: 'vacuna',
  desparasitacion: 'desparasitación',
  consulta: 'consulta',
  cirugia: 'cirugía',
  revision: 'revisión',
  medicamento: 'medicamento',
  banio: 'baño',
  bano: 'baño',
  baño: 'baño',
  otro: 'seguimiento',
};

export interface RecordatorioWhatsappInput {
  nombreDueno?: string | null;
  nombreMascota?: string | null;
  tipo?: string | null;
  /** ISO local (`2026-09-08T09:00`), `YYYY-MM-DD` o Date. */
  fecha?: string | Date | null;
  titulo?: string | null;
  clinica?: string | null;
}

/**
 * Deja solo dígitos y recorta lada país repetida.
 * `+52 55 1234 5678` → `5512345678`; `521 55…` (formato WhatsApp) → 10 dígitos.
 * Devuelve `null` si no quedan exactamente 10 dígitos.
 */
export function normalizarTelefonoMx(raw: string | number | null | undefined): string | null {
  const digits = String(raw ?? '').replace(/\D+/g, '');
  if (!digits) return null;
  let tel = digits;
  if (tel.length === 13 && tel.startsWith(WHATSAPP_LADA_MX + '1')) {
    tel = tel.slice(3);
  } else if (tel.length === 12 && tel.startsWith(WHATSAPP_LADA_MX)) {
    tel = tel.slice(2);
  } else if (tel.length === 11 && tel.startsWith('1')) {
    tel = tel.slice(1);
  }
  return tel.length === 10 ? tel : null;
}

/** Hay algo capturado en teléfono (aunque esté incompleto). */
export function tieneTelefonoCapturado(raw: string | number | null | undefined): boolean {
  return /\d/.test(String(raw ?? ''));
}

/** Parse tolerante: `YYYY-MM-DD`, `YYYY-MM-DDTHH:mm`, `YYYY-MM-DD HH:mm:ss` o Date. Local, sin UTC shift. */
export function parseFechaRecordatorio(fecha: string | Date | null | undefined): Date | null {
  if (!fecha) return null;
  if (fecha instanceof Date) return isNaN(fecha.getTime()) ? null : fecha;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(fecha).trim());
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(fecha);
  return isNaN(d.getTime()) ? null : d;
}

/** «lunes 8 de septiembre» (agrega « de 2027» solo si el año no es el actual). */
export function formatearFechaLargaEs(fecha: string | Date | null | undefined, hoy: Date = new Date()): string {
  const d = parseFechaRecordatorio(fecha);
  if (!d) return '';
  const base = `${DIAS_ES[d.getDay()]} ${d.getDate()} de ${MESES_ES[d.getMonth()]}`;
  return d.getFullYear() === hoy.getFullYear() ? base : `${base} de ${d.getFullYear()}`;
}

/** Fecha corta para el chip: «4 sep» (o «4 sep 2025» si es otro año). */
export function formatearFechaCortaEs(ts: number | null | undefined, hoy: Date = new Date()): string {
  if (!ts || !Number.isFinite(ts)) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  const base = `${d.getDate()} ${MESES_CORTOS_ES[d.getMonth()]}`;
  return d.getFullYear() === hoy.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

export function textoTipoRecordatorio(tipo: string | null | undefined): string {
  const key = String(tipo ?? '')
    .trim()
    .toLowerCase();
  return TIPO_RECORDATORIO_TEXTO[key] || 'seguimiento';
}

/** Mensaje completo listo para `wa.me/?text=`. */
export function buildMensajeWhatsappRecordatorio(input: RecordatorioWhatsappInput, hoy: Date = new Date()): string {
  const dueno = String(input.nombreDueno ?? '').trim();
  const mascota = String(input.nombreMascota ?? '').trim() || 'tu mascota';
  const tipo = textoTipoRecordatorio(input.tipo);
  const clinica = String(input.clinica ?? '').trim() || NOMBRE_CLINICA_DEFAULT;
  const fechaTxt = formatearFechaLargaEs(input.fecha, hoy);
  const titulo = String(input.titulo ?? '').trim();

  const saludo = dueno ? `Hola ${dueno}, te saludamos de ${clinica}.` : `Hola, te saludamos de ${clinica}.`;
  const detalle = titulo && titulo.toLowerCase() !== tipo ? ` (${titulo})` : '';
  const cuerpo = fechaTxt
    ? `Te recordamos que ${mascota} tiene ${tipo} el ${fechaTxt}${detalle}.`
    : `Te recordamos que ${mascota} tiene ${tipo} pendiente${detalle}.`;

  return `${saludo}\n${cuerpo}\nResponde este mensaje para confirmar.`;
}

/** `https://wa.me/52{tel10}?text=…` — `tel10` ya normalizado. */
export function buildWhatsappUrl(tel10: string, mensaje: string): string {
  return `https://wa.me/${WHATSAPP_LADA_MX}${tel10}?text=${encodeURIComponent(mensaje)}`;
}

/** `tel:+52{tel10}` para el botón Llamar. */
export function buildTelUrl(tel10: string): string {
  return `tel:+${WHATSAPP_LADA_MX}${tel10}`;
}
