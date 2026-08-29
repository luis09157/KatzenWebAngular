/**
 * Motor puro de ventanas push (spec 052 ola 2).
 * Sin Firebase: testeable con node:test.
 *
 * Vacuna: no spamear el día que se aplicó un refuerzo a meses vista.
 * Ventanas: D-7 y D-0 (día del recordatorio). TZ clínica: America/Mexico_City
 * (equivalente a America/Monterrey, UTC-6 todo el año desde 2022).
 */

export const CLINIC_TZ = 'America/Mexico_City';
export const PUSH_ANTICIPACION_DIAS = [7, 0] as const;
export const PUSH_MAX_POR_RECORDATORIO = 2;
/** SC-019: no FCM al write si faltan más de N días. */
export const PUSH_SKIP_IF_MORE_THAN_DAYS = 8;
export const PUSH_QUIET_HOUR_START = 23;
export const PUSH_QUIET_HOUR_END = 8;

export type PushKind = 'd7' | 'd0';

export interface RecordatorioPushFields {
  paciente_id?: string;
  titulo?: string;
  descripcion?: string;
  estado?: string;
  activo?: boolean;
  tipo?: string;
  origen?: string;
  fecha_hora_recordatorio?: string;
  fecha_recordatorio?: string;
  skipPushOnCreate?: boolean;
  pushCount?: number;
  pushDueStatus?: string;
  pushKindsSent?: { d7?: string; d0?: string };
  pushStatus?: string;
  pushAt?: string;
  pushFingerprint?: string;
}

export function isVaccineReminder(r: RecordatorioPushFields | null | undefined): boolean {
  if (!r) return false;
  const tipo = String(r.tipo || '').toLowerCase();
  const origen = String(r.origen || '').toLowerCase();
  return tipo.includes('vacuna') || origen.includes('vacuna');
}

export function isDewormReminder(r: RecordatorioPushFields | null | undefined): boolean {
  if (!r) return false;
  const tipo = String(r.tipo || '').toLowerCase();
  const origen = String(r.origen || '').toLowerCase();
  return tipo.includes('desparasit') || origen.includes('desparasitacion');
}

export function isSchedulerReminder(r: RecordatorioPushFields | null | undefined): boolean {
  return isVaccineReminder(r) || isDewormReminder(r);
}

export function isPendingActive(r: RecordatorioPushFields | null | undefined): boolean {
  if (!r) return false;
  if (r.activo === false) return false;
  return String(r.estado || '').toLowerCase() === 'pendiente';
}

export function isMascotaFallecido(mascota: { estado?: string } | null | undefined): boolean {
  if (!mascota) return false;
  return String(mascota.estado || '').trim().toLowerCase() === 'fallecido';
}

/** YYYY-MM-DD en la TZ de la clínica. */
export function ymdInTimeZone(date: Date, timeZone: string = CLINIC_TZ): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return fmt.format(date);
}

export function hourInTimeZone(date: Date, timeZone: string = CLINIC_TZ): number {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    hour12: false
  });
  return Number(fmt.format(date));
}

/** Quiet hours 23:00–08:00 hora clínica (SC-021). Scheduler a las 10:00 no cae aquí. */
export function isQuietHours(date: Date, timeZone: string = CLINIC_TZ): boolean {
  const hour = hourInTimeZone(date, timeZone);
  return hour >= PUSH_QUIET_HOUR_START || hour < PUSH_QUIET_HOUR_END;
}

export function parseDueDayKey(r: RecordatorioPushFields): string | null {
  const raw = String(r.fecha_hora_recordatorio || r.fecha_recordatorio || '').trim();
  if (!raw) return null;
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const dmy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return null;
}

function parseYmdUtc(ymd: string): number | null {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Días de calendario (TZ clínica) hasta la fecha del recordatorio. Negativo = vencido. */
export function daysUntilDue(
  r: RecordatorioPushFields,
  now: Date = new Date(),
  timeZone: string = CLINIC_TZ
): number | null {
  const due = parseDueDayKey(r);
  if (!due) return null;
  const today = ymdInTimeZone(now, timeZone);
  const dueMs = parseYmdUtc(due);
  const todayMs = parseYmdUtc(today);
  if (dueMs == null || todayMs == null) return null;
  return Math.round((dueMs - todayMs) / 86400000);
}

export function kindForDaysUntil(days: number | null): PushKind | null {
  if (days === 7) return 'd7';
  if (days === 0) return 'd0';
  return null;
}

export function windowKindForReminder(
  r: RecordatorioPushFields,
  now: Date = new Date(),
  timeZone: string = CLINIC_TZ
): PushKind | null {
  return kindForDaysUntil(daysUntilDue(r, now, timeZone));
}

export function alreadySentKind(r: RecordatorioPushFields, kind: PushKind): boolean {
  const sent = r.pushKindsSent?.[kind];
  return typeof sent === 'string' && sent.length > 0;
}

export function pushCountOf(r: RecordatorioPushFields): number {
  const n = Number(r.pushCount);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function canSendKind(r: RecordatorioPushFields, kind: PushKind): boolean {
  if (alreadySentKind(r, kind)) return false;
  return pushCountOf(r) < PUSH_MAX_POR_RECORDATORIO;
}

/**
 * SC-019: diferir FCM/inbox al write si es vacuna o desparasitación (053) y faltan más de N días.
 * Baño/meds (no scheduler) → false (023 sigue al write).
 */
export function shouldDeferVaccineWritePush(
  r: RecordatorioPushFields,
  now: Date = new Date(),
  timeZone: string = CLINIC_TZ
): boolean {
  if (!isSchedulerReminder(r)) return false;
  if (!isPendingActive(r)) return false;
  if (r.skipPushOnCreate === true) {
    const days = daysUntilDue(r, now, timeZone);
    if (days == null) return true;
    return days > PUSH_SKIP_IF_MORE_THAN_DAYS;
  }
  const days = daysUntilDue(r, now, timeZone);
  if (days == null) return true;
  return days > PUSH_SKIP_IF_MORE_THAN_DAYS;
}

export function groupByClienteId<T extends { clienteId: string | null }>(
  items: T[]
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = item.clienteId || '';
    if (!key) continue;
    const list = map.get(key) || [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

export function ownerPushCopy(
  items: Array<{ titulo?: string; mascotaNombre?: string; kind: PushKind }>
): { title: string; body: string } {
  if (items.length === 0) {
    return { title: 'KatzenVet', body: 'Tienes un aviso de vacuna.' };
  }
  if (items.length === 1) {
    const it = items[0];
    const when = it.kind === 'd7' ? 'En 7 días' : 'Hoy';
    return {
      title: it.titulo || 'Refuerzo de vacuna',
      body: `${when}: ${it.mascotaNombre || 'tu mascota'} tiene un refuerzo acordado en clínica.`
    };
  }
  const names = items
    .map((i) => i.mascotaNombre)
    .filter((n): n is string => !!n && n.trim().length > 0);
  const unique = [...new Set(names)];
  const when = items.every((i) => i.kind === 'd7')
    ? 'En 7 días'
    : items.every((i) => i.kind === 'd0')
      ? 'Hoy'
      : 'Próximamente';
  return {
    title: `${when} ${items.length} vacunas`,
    body:
      unique.length > 0
        ? `${unique.join(', ')} tienen refuerzos acordados en clínica.`
        : 'Varias mascotas tienen refuerzos acordados en clínica.'
  };
}

export function staffPushCopy(
  kind: PushKind,
  count: number
): { title: string; body: string } {
  if (kind === 'd7') {
    return {
      title: `En 7 días: ${count} vacuna${count === 1 ? '' : 's'}`,
      body: 'Refuerzos programados la próxima semana. Revisa el listado de vacunas.'
    };
  }
  return {
    title: `Hoy ${count} vacuna${count === 1 ? '' : 's'}`,
    body: 'Hay refuerzos de vacuna para hoy. Revisa el módulo de vacunas.'
  };
}
