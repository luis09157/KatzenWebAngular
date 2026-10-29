/**
 * 2026-10-29 — fecha y hora de una cita en hora LOCAL (Monterrey), sin importar a qué hora sea.
 * `fecha` se guarda como instante UTC (`…Z`): 11:00 MTY = 17:00Z; 18:00 MTY = 00:00Z del día siguiente.
 * Leer el texto («2026-10-29») en vez del instante cambiaba el día al abrir o al guardar.
 */
import { formatLocalDateToIso, parseIsoDateToLocalDate } from '../shared/datepicker/datepicker.util';

const dos = (n: number) => String(n).padStart(2, '0');

/** Instante con zona (`…Z` / `±hh:mm`). */
function conZona(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}.*(Z|[+-]\d{2}:?\d{2})$/i.test(s);
}

/** Día (`YYYY-MM-DD`) y hora (`HH:mm`) locales para mostrar / editar una cita. */
export function fechaHoraLocalDeCita(cita: { fecha?: unknown; fecha_hora?: unknown; hora?: unknown } | null | undefined): {
  fecha: string;
  hora: string;
} {
  const horaGuardada = /^\d{1,2}:\d{2}/.test(String(cita?.hora || '')) ? String(cita!.hora).slice(0, 5) : '';
  const fechaRaw = String(cita?.fecha || '').trim();
  if (fechaRaw && conZona(fechaRaw)) {
    const d = new Date(fechaRaw);
    if (!isNaN(d.getTime())) {
      return { fecha: formatLocalDateToIso(d), hora: horaGuardada || `${dos(d.getHours())}:${dos(d.getMinutes())}` };
    }
  }
  // Sin zona: el texto ya es local («2026-10-28», «2026-10-28T18:00»).
  const texto = fechaRaw || String(cita?.fecha_hora || '').trim();
  const m = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/.exec(texto);
  if (m) return { fecha: m[1], hora: horaGuardada || m[2] || '' };
  return { fecha: '', hora: horaGuardada };
}

/** Valor del control de fecha (Date del calendario o texto `YYYY-MM-DD`) → día local. */
export function diaLocalDeControl(valor: unknown): Date | null {
  if (valor instanceof Date) {
    return isNaN(valor.getTime()) ? null : new Date(valor.getFullYear(), valor.getMonth(), valor.getDate(), 12);
  }
  if (typeof valor === 'string') return parseIsoDateToLocalDate(valor);
  return null;
}

/** Día del control + `HH:mm` → instante local de la cita (a cualquier hora, sin límites). */
export function instanteLocalCita(valorFecha: unknown, hora: unknown): Date | null {
  const dia = diaLocalDeControl(valorFecha);
  if (!dia) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hora || ''));
  dia.setHours(m ? Number(m[1]) : 0, m ? Number(m[2]) : 0, 0, 0);
  return dia;
}

/** `fecha_hora` en hora de reloj local: `2026-10-28T18:00`. */
export function fechaHoraTextoLocal(d: Date): string {
  return `${formatLocalDateToIso(d)}T${dos(d.getHours())}:${dos(d.getMinutes())}`;
}
