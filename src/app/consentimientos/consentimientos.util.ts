import { Consentimiento, ConsentimientoKpis } from './consentimientos.models';

export function hoyLocalIsoDate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function mesActualPrefix(d = new Date()): string {
  return hoyLocalIsoDate(d).slice(0, 7);
}

export function calcularConsentimientoKpis(
  rows: Consentimiento[],
  mesPrefix = mesActualPrefix()
): ConsentimientoKpis {
  const activos = rows.filter((r) => r.activo !== false);
  return {
    total: activos.length,
    vigentes: activos.filter((r) => r.estado === 'vigente').length,
    delMes: activos.filter((r) => String(r.fecha || '').startsWith(mesPrefix)).length,
    revocados: activos.filter((r) => r.estado === 'revocado').length
  };
}
