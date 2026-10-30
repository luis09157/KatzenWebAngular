/**
 * 2026-10-30 — «Resumen del módulo» con todo en cero no aporta: se oculta.
 * No se oculta si alguna tarjeta es un filtro (clickable), porque esas sirven para navegar.
 */
export interface KpiTarjetaLike {
  value: string | number | null | undefined;
  clickable?: boolean;
}

/** `0`, `'0'`, `'$0.00'`, `''`, `null` → cero. Texto no numérico (p. ej. «—») no cuenta como cero. */
export function esValorCero(v: string | number | null | undefined): boolean {
  if (v == null) return true;
  if (typeof v === 'number') return !v;
  const t = v.replace(/[$,\s%]/g, '').trim();
  if (t === '') return true;
  const n = Number(t);
  return !Number.isNaN(n) && n === 0;
}

export function resumenKpiVacio(tarjetas: ReadonlyArray<KpiTarjetaLike>): boolean {
  if (!tarjetas.length) return false;
  if (tarjetas.some((t) => t.clickable)) return false;
  return tarjetas.every((t) => esValorCero(t.value));
}
