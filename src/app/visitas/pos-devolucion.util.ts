import { VisitaLinea } from './visitas.models';
import { roundMoney } from './visitas.util';

export function puedeDevolverLinea(
  linea: Pick<VisitaLinea, 'monto'> & { fueDevuelto?: boolean } | null | undefined
): boolean {
  if (!linea || linea.fueDevuelto) {
    return false;
  }
  return roundMoney(Number(linea.monto) || 0) > 0;
}

export function lineasADevolver(lineas: VisitaLinea[], ids: string[]): VisitaLinea[] {
  const set = new Set(ids);
  return (lineas || []).filter(l => set.has(l.id) && puedeDevolverLinea(l));
}

/** Reintegro de anaquel: solo líneas con producto y cantidad. */
export function reintegrosInventario(lineas: VisitaLinea[]): { productoId: string; cantidad: number }[] {
  const map = new Map<string, number>();
  for (const l of lineas) {
    const pid = String(l.productoId || '').trim();
    const qty = Number(l.cantidad) || 0;
    if (!pid || qty <= 0) {
      continue;
    }
    map.set(pid, (map.get(pid) || 0) + qty);
  }
  return [...map.entries()].map(([productoId, cantidad]) => ({ productoId, cantidad }));
}

export function montoDevolucion(lineas: VisitaLinea[]): number {
  return roundMoney(lineas.reduce((s, l) => s + (Number(l.monto) || 0), 0));
}

export function marcarLineasDevueltas(
  lineas: VisitaLinea[],
  ids: string[],
  cuandoIso: string
): VisitaLinea[] {
  const set = new Set(ids);
  return (lineas || []).map(l =>
    set.has(l.id) ? { ...l, fueDevuelto: true, devueltaEn: cuandoIso } : l
  );
}
