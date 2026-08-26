/**
 * Lógica pura de agenda de citas (solapamiento / duración).
 * Probable con mocks locales — sin Firebase.
 */

export const CITA_DURACION_DEFAULT_MIN = 30;
export const CITA_DURACION_MINIMA_MIN = 5;

export interface CitaAgendaLike {
  id?: string;
  fecha?: string;
  fecha_hora?: string;
  hora?: string;
  veterinario?: string;
  duracion_minutos?: number | string | null;
  estado?: string;
  activo?: boolean;
}

/** Duración efectiva en minutos (legacy sin campo → 30). */
export function resolveDuracionMinutos(cita: CitaAgendaLike | null | undefined): number {
  const raw = cita?.duracion_minutos;
  const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
  if (!Number.isFinite(n) || n < CITA_DURACION_MINIMA_MIN) {
    return CITA_DURACION_DEFAULT_MIN;
  }
  return Math.floor(n);
}

/** Inicio de la cita en epoch ms; null si no se puede parsear. */
export function resolveCitaStartMs(cita: CitaAgendaLike): number | null {
  const fechaRaw = cita.fecha || cita.fecha_hora;
  if (!fechaRaw) {
    return null;
  }

  let date: Date;
  if (typeof fechaRaw === 'string' && fechaRaw.includes('T')) {
    date = new Date(fechaRaw);
  } else if (typeof fechaRaw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaRaw)) {
    const [y, m, d] = fechaRaw.split('-').map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date(fechaRaw);
  }

  if (isNaN(date.getTime())) {
    return null;
  }

  if (cita.hora && /^\d{1,2}:\d{2}/.test(cita.hora)) {
    const [h, min] = cita.hora.split(':').map(Number);
    date.setHours(h, min, 0, 0);
  }

  return date.getTime();
}

export function intervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && startB < endA;
}

export function normalizeVeterinarioNombre(nombre: string | null | undefined): string {
  return String(nombre || '').trim().toLowerCase();
}

/**
 * ¿La candidata solapa con alguna cita activa del mismo veterinario?
 * Excluye canceladas, inactivas y la propia cita (mismo id).
 */
export function findVeterinarioOverlap(
  candidata: CitaAgendaLike,
  existentes: CitaAgendaLike[]
): CitaAgendaLike | null {
  const vet = normalizeVeterinarioNombre(candidata.veterinario);
  if (!vet) {
    return null;
  }

  const startA = resolveCitaStartMs(candidata);
  if (startA == null) {
    return null;
  }
  const endA = startA + resolveDuracionMinutos(candidata) * 60_000;

  for (const otra of existentes) {
    if (otra.activo === false) {
      continue;
    }
    if (String(otra.estado || '').toLowerCase() === 'cancelada') {
      continue;
    }
    if (candidata.id && otra.id && candidata.id === otra.id) {
      continue;
    }
    if (normalizeVeterinarioNombre(otra.veterinario) !== vet) {
      continue;
    }

    const startB = resolveCitaStartMs(otra);
    if (startB == null) {
      continue;
    }
    const endB = startB + resolveDuracionMinutos(otra) * 60_000;
    if (intervalsOverlap(startA, endA, startB, endB)) {
      return otra;
    }
  }

  return null;
}
