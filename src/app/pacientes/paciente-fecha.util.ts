/**
 * Fecha / edad / tiempo relativo del expediente paciente (spec 077).
 * Extraído de `pacientes.component` sin cambiar copy.
 */

const LOCALE_FECHA = 'es-ES';
const OPTS_FECHA_HORA: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
};

function parseFechaFlexible(fecha: unknown): Date | null {
  if (!fecha) return null;
  try {
    if (fecha instanceof Date) {
      return isNaN(fecha.getTime()) ? null : fecha;
    }
    if (typeof fecha === 'string' || typeof fecha === 'number') {
      const date = new Date(fecha);
      return isNaN(date.getTime()) ? null : date;
    }
  } catch {
    return null;
  }
  return null;
}

/** Historial clínico / vacunas — fallback «N/P». */
export function formatearFechaExpediente(fecha: unknown): string {
  const date = parseFechaFlexible(fecha);
  if (!date) return 'N/P';
  try {
    return date.toLocaleDateString(LOCALE_FECHA, OPTS_FECHA_HORA);
  } catch {
    return 'N/P';
  }
}

/** Log de actividades — fallback «Fecha no disponible». */
export function formatearFechaLogActividad(fecha: string | null | undefined): string {
  if (!fecha) return 'Fecha no disponible';
  const date = parseFechaFlexible(fecha);
  if (!date) return 'Fecha no disponible';
  try {
    return date.toLocaleDateString(LOCALE_FECHA, OPTS_FECHA_HORA);
  } catch {
    return 'Fecha no disponible';
  }
}

/** Tiempo relativo tipo timeline («Hoy», «Ayer», «Hace N días»…). */
export function getTiempoTranscurrido(fecha: unknown, ahora: Date = new Date()): string {
  const fechaHistorial = parseFechaFlexible(fecha);
  if (!fechaHistorial) return '';
  try {
    const diferencia = ahora.getTime() - fechaHistorial.getTime();
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias} días`;
    if (dias < 30) {
      const semanas = Math.floor(dias / 7);
      return `Hace ${semanas} semana${semanas > 1 ? 's' : ''}`;
    }
    const meses = Math.floor(dias / 30);
    return `Hace ${meses} mes${meses > 1 ? 'es' : ''}`;
  } catch {
    return '';
  }
}

/**
 * Edad desde string `D/M/YYYY` (campo `Mascota.edad` legacy en UI).
 * Copy: «Edad no registrada» si inválido.
 */
export function calcularEdadPaciente(fechaNacimiento: string | null | undefined, hoy: Date = new Date()): string {
  if (!fechaNacimiento) return 'Edad no registrada';

  try {
    const partes = String(fechaNacimiento).split('/');
    if (partes.length !== 3) return 'Edad no registrada';

    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const anio = parseInt(partes[2], 10);

    const fechaNac = new Date(anio, mes, dia);
    if (isNaN(fechaNac.getTime())) return 'Edad no registrada';

    const diferencia = hoy.getTime() - fechaNac.getTime();
    const anios = Math.floor(diferencia / (1000 * 60 * 60 * 24 * 365));
    const meses = Math.floor((diferencia % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));

    if (anios > 0) {
      return `${anios} año${anios > 1 ? 's' : ''} y ${meses} mes${meses > 1 ? 'es' : ''}`;
    }
    return `${meses} mes${meses > 1 ? 'es' : ''}`;
  } catch {
    return 'Edad no registrada';
  }
}

/** Resumen especie / raza / color del encabezado. */
export function getPacienteInfoResumen(
  paciente:
    | {
        especie?: string;
        raza?: string;
        color?: string;
      }
    | null
    | undefined
): string {
  if (!paciente) return 'Información no disponible';
  const info: string[] = [];
  if (paciente.especie) info.push(paciente.especie);
  if (paciente.raza) info.push(paciente.raza);
  if (paciente.color) info.push(paciente.color);
  return info.length > 0 ? info.join(', ') : 'Información no disponible';
}
