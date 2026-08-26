/** Filtros de período reutilizables (dashboard dueño + módulos). Spec 025. */

export type PeriodoPreset = 'este_mes' | 'mes_anterior' | '30d' | '60d' | 'custom';

export interface PeriodoRango {
  desde: string; // YYYY-MM-DD
  hasta: string;
  label: string;
}

export function hoyLocalIsoDate(ref: Date = new Date()): string {
  return formatLocalDate(ref);
}

export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso || '').slice(0, 10));
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function mesLocalIso(ref: Date = new Date()): string {
  return formatLocalDate(ref).slice(0, 7);
}

/** Rango inclusivo para preset o custom. */
export function resolverPeriodo(
  preset: PeriodoPreset,
  desdeCustom?: string,
  hastaCustom?: string,
  ref: Date = new Date()
): PeriodoRango {
  if (preset === 'custom' && desdeCustom && hastaCustom) {
    const a = desdeCustom.slice(0, 10);
    const b = hastaCustom.slice(0, 10);
    const [desde, hasta] = a <= b ? [a, b] : [b, a];
    return { desde, hasta, label: `Del ${formatLabelEs(desde)} al ${formatLabelEs(hasta)}` };
  }

  if (preset === 'mes_anterior') {
    const y = ref.getFullYear();
    const m = ref.getMonth(); // 0-based current
    const firstPrev = new Date(y, m - 1, 1);
    const lastPrev = new Date(y, m, 0);
    const desde = formatLocalDate(firstPrev);
    const hasta = formatLocalDate(lastPrev);
    return { desde, hasta, label: `Mes anterior (${desde.slice(0, 7)})` };
  }

  if (preset === '30d' || preset === '60d') {
    const days = preset === '30d' ? 29 : 59;
    const hastaD = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
    const desdeD = new Date(hastaD);
    desdeD.setDate(hastaD.getDate() - days);
    const desde = formatLocalDate(desdeD);
    const hasta = formatLocalDate(hastaD);
    return {
      desde,
      hasta,
      label: `Últimos ${preset === '30d' ? 30 : 60} días`
    };
  }

  // este_mes (default)
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const desde = formatLocalDate(new Date(y, m, 1));
  const hasta = formatLocalDate(new Date(y, m + 1, 0));
  return { desde, hasta, label: `Este mes (${desde.slice(0, 7)})` };
}

export function fechaEnRango(fechaRaw: string | undefined | null, rango: PeriodoRango): boolean {
  const f = normalizeFechaIso(fechaRaw);
  if (!f) return false;
  return f >= rango.desde && f <= rango.hasta;
}

/** Extrae YYYY-MM-DD de ISO, 'YYYY-MM-DD HH:mm' o Date string. */
export function normalizeFechaIso(fechaRaw: string | undefined | null): string | null {
  if (!fechaRaw) return null;
  const s = String(fechaRaw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!isNaN(d.getTime())) return formatLocalDate(d);
  return null;
}

export function formatLabelEs(iso: string): string {
  const d = parseLocalDate(iso);
  if (!d) return iso;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatMoneyMx(n: number | undefined | null, decimals = 2): string {
  const v = Number(n) || 0;
  return `$${v.toLocaleString('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
}

/** Serie diaria de un valor numérico en el rango (días sin dato = 0). */
export function serieDiariaEnRango(
  rango: PeriodoRango,
  puntos: Array<{ fecha: string; valor: number }>
): Array<{ fecha: string; valor: number }> {
  const map = new Map(puntos.map((p) => [p.fecha.slice(0, 10), p.valor]));
  const out: Array<{ fecha: string; valor: number }> = [];
  const cur = parseLocalDate(rango.desde);
  const end = parseLocalDate(rango.hasta);
  if (!cur || !end) return out;
  while (cur <= end) {
    const f = formatLocalDate(cur);
    out.push({ fecha: f, valor: map.get(f) || 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}
