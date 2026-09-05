import { CajaCorte } from './caja.models';

export const HORA_CORTE_DEFAULT = 18;

export interface CajaTurnoLike {
  abiertaEn?: string;
  fondoInicial?: number;
  corteId?: string;
}

/** Fecha local YYYY-MM-DD. */
export function fechaTurnoLocal(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function turnoEstaAbierto(turno: CajaTurnoLike | null | undefined): boolean {
  if (!turno?.abiertaEn) return false;
  return !String(turno.corteId || '').trim();
}

export function yaHayCorteDelDia(
  cortes: Array<Pick<CajaCorte, 'fecha' | 'activo'> | null | undefined> | null | undefined,
  fecha: string
): boolean {
  const f = String(fecha || '').slice(0, 10);
  if (!f) return false;
  return (cortes || []).some((c) => !!c && c.activo !== false && String(c.fecha || '').slice(0, 10) === f);
}

/** Fondo del siguiente turno = efectivo que quedó en el último corte (o 0). */
export function fondoInicialDesdeUltimoCorte(
  cortes:
    | Array<Pick<CajaCorte, 'fecha' | 'createdAt' | 'activo' | 'efectivoContado' | 'esperado'> | null | undefined>
    | null
    | undefined
): number {
  const activos = (cortes || []).filter((c): c is NonNullable<typeof c> => !!c && c.activo !== false);
  if (!activos.length) return 0;
  activos.sort((a, b) => {
    const fa = String(a.fecha || '');
    const fb = String(b.fecha || '');
    if (fa !== fb) return fb.localeCompare(fa);
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
  const last = activos[0];
  const n = Number(last.efectivoContado);
  if (Number.isFinite(n) && n >= 0) return Math.round(n * 100) / 100;
  const esp = Number(last.esperado);
  return Number.isFinite(esp) && esp >= 0 ? Math.round(esp * 100) / 100 : 0;
}

export function puedeGuardarCorteDelDia(
  cortes: Array<Pick<CajaCorte, 'fecha' | 'activo'> | null | undefined> | null | undefined,
  fecha: string
): boolean {
  return !yaHayCorteDelDia(cortes, fecha);
}

/**
 * Banner «Hacer corte»: turno abierto, sin corte, y (hora ≥ 18 o ya hubo ventas).
 */
export function debeMostrarBannerCorte(input: {
  turnoAbierto: boolean;
  hayCorteHoy: boolean;
  huboVentasHoy: boolean;
  horaLocal: number;
  umbralHora?: number;
}): boolean {
  if (!input.turnoAbierto || input.hayCorteHoy) return false;
  const umbral = input.umbralHora ?? HORA_CORTE_DEFAULT;
  const hora = Number(input.horaLocal);
  if (Number.isFinite(hora) && hora >= umbral) return true;
  return !!input.huboVentasHoy;
}
