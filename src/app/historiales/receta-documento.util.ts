/**
 * Spec 116.2 — receta para el dueño (vista, texto de WhatsApp, nombre del PDF).
 * Funciones puras. No se guarda nada: se arma con lo que ya tiene la consulta.
 * No incluye diagnóstico presuntivo ni notas internas (solo receta e indicaciones).
 */
import { CLINICA_NOMBRE_DEFAULT } from '../core/utils/clinica-config.util';
import { normalizarTelefonoMx, WHATSAPP_LADA_MX } from '../recordatorios/recordatorio-whatsapp.util';

export interface RecetaHistorialInput {
  fecha_registro?: string | null;
  receta?: string | null;
  manejo_terapeutico?: string | null;
  peso?: string | number | null;
  medico_atendio?: string | null;
  paciente_nombre?: string | null;
  cliente?: string | null;
}

export interface RecetaPacienteInput {
  nombre?: string | null;
  especie?: string | null;
  raza?: string | null;
  sexo?: string | null;
  peso?: string | number | null;
  expediente?: string | null;
}

export interface RecetaClienteInput {
  nombre?: string | null;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  telefono?: string | number | null;
}

export interface RecetaView {
  clinica: string;
  fecha: string;
  paciente: string;
  pacienteDetalle: string;
  expediente: string;
  peso: string;
  dueno: string;
  duenoNombre: string;
  receta: string;
  indicaciones: string;
  veterinario: string;
  /** 10 dígitos o null. */
  telefono10: string | null;
}

const MESES = [
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

function limpio(v: unknown): string {
  return String(v ?? '')
    .replace(/\r\n?/g, '\n')
    .trim();
}

/** ¿La consulta tiene algo que mandar al dueño? */
export function tieneContenidoReceta(h: RecetaHistorialInput | null | undefined): boolean {
  return !!(limpio(h?.receta) || limpio(h?.manejo_terapeutico));
}

/** `2026-10-29 13:45:00` (texto local de la consulta) → `29 de octubre de 2026`. */
export function fechaRecetaTexto(fechaRegistro: unknown, hoy: Date = new Date()): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(limpio(fechaRegistro));
  let d: Date;
  if (m) {
    d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  } else {
    d = hoy;
  }
  if (isNaN(d.getTime())) d = hoy;
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/** Peso legible: `5` → `5 kg`; deja tal cual si ya trae unidad. */
export function pesoTexto(peso: unknown): string {
  const t = limpio(peso);
  if (!t) return '';
  return /^\d+([.,]\d+)?$/.test(t) ? `${t} kg` : t;
}

/** `LUIS` → `Luis`; respeta nombres que ya vienen con mayúsculas y minúsculas. */
export function nombreParaSaludo(nombre: string): string {
  const t = limpio(nombre);
  if (!t || t !== t.toUpperCase()) return t;
  return t.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_m, a: string, b: string) => a + b.toUpperCase());
}

function nombreCompleto(c: RecetaClienteInput | null | undefined): string {
  return [c?.nombre, c?.apellidoPaterno, c?.apellidoMaterno]
    .map((x) => limpio(x))
    .filter(Boolean)
    .join(' ');
}

export function buildRecetaView(
  historial: RecetaHistorialInput,
  paciente: RecetaPacienteInput | null | undefined,
  cliente: RecetaClienteInput | null | undefined,
  clinica?: string | null,
  hoy: Date = new Date()
): RecetaView {
  const dueno = nombreCompleto(cliente) || limpio(historial.cliente);
  const detalle = [paciente?.especie, paciente?.raza, paciente?.sexo]
    .map((x) => limpio(x))
    .filter(Boolean)
    .join(' · ');
  return {
    clinica: limpio(clinica) || CLINICA_NOMBRE_DEFAULT,
    fecha: fechaRecetaTexto(historial.fecha_registro, hoy),
    paciente: limpio(paciente?.nombre) || limpio(historial.paciente_nombre) || 'Mascota',
    pacienteDetalle: detalle,
    expediente: limpio(paciente?.expediente),
    // El peso de la consulta manda; si no hay, el de la ficha.
    peso: pesoTexto(historial.peso) || pesoTexto(paciente?.peso),
    dueno,
    duenoNombre: nombreParaSaludo(limpio(cliente?.nombre).split(/\s+/)[0] || dueno.split(/\s+/)[0] || ''),
    receta: limpio(historial.receta),
    indicaciones: limpio(historial.manejo_terapeutico),
    veterinario: limpio(historial.medico_atendio),
    telefono10: normalizarTelefonoMx((cliente?.telefono ?? null) as string | number | null),
  };
}

/** Mensaje para WhatsApp: la receta va escrita (el dueño la lee sin abrir archivos). */
export function textoWhatsAppReceta(v: RecetaView): string {
  const saludo = v.duenoNombre ? `Hola ${v.duenoNombre}` : 'Hola';
  const partes = [`${saludo}, te compartimos la receta de ${v.paciente} (${v.fecha}).`];
  if (v.receta) partes.push(`💊 *Receta*\n${v.receta}`);
  if (v.indicaciones) partes.push(`📋 *Indicaciones*\n${v.indicaciones}`);
  if (v.veterinario) partes.push(`Atendió: ${v.veterinario}`);
  partes.push(`Cualquier duda, aquí estamos. — ${v.clinica}`);
  return partes.join('\n\n');
}

/** wa.me con el texto; `null` si el dueño no tiene teléfono de 10 dígitos. */
export function urlWhatsAppReceta(v: RecetaView): string | null {
  if (!v.telefono10) return null;
  return `https://wa.me/${WHATSAPP_LADA_MX}${v.telefono10}?text=${encodeURIComponent(textoWhatsAppReceta(v))}`;
}

/** `Receta-Firulais-2026-10-29.pdf` */
export function nombreArchivoPdfReceta(v: RecetaView, fechaRegistro?: string | null, hoy: Date = new Date()): string {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(limpio(fechaRegistro));
  const iso =
    m?.[1] ||
    `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  const nombre =
    v.paciente
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'Mascota';
  return `Receta-${nombre}-${iso}.pdf`;
}
