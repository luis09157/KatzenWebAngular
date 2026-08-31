import {
  Visita,
  VisitaEstado,
  VisitaKpis,
  VisitaLinea
} from './visitas.models';
import { snapshotEconomiaLinea } from '../core/utils/precio-margen.util';

export function roundMoney(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function sumLineas(lineas: VisitaLinea[] | undefined | null): number {
  if (!Array.isArray(lineas) || !lineas.length) return 0;
  return roundMoney(lineas.reduce((s, l) => s + (Number(l?.monto) || 0), 0));
}

export function deriveEstado(total: number, pagado: number, cancelada = false): VisitaEstado {
  if (cancelada) return 'cancelada';
  const t = roundMoney(total);
  const p = roundMoney(pagado);
  const saldo = roundMoney(t - p);
  if (t <= 0 && p <= 0) return 'abierta';
  if (saldo <= 0 && p > 0) return 'cerrada';
  if (p > 0 && saldo > 0) return 'parcial';
  return 'abierta';
}

export function recalcularVisita(
  visita: Pick<Visita, 'lineas' | 'pagado'> & { estado?: VisitaEstado }
): { total: number; pagado: number; saldo: number; estado: VisitaEstado } {
  const total = sumLineas(visita.lineas);
  const pagado = roundMoney(Math.max(0, Number(visita.pagado) || 0));
  const saldo = roundMoney(Math.max(0, total - pagado));
  const cancelada = visita.estado === 'cancelada';
  return {
    total,
    pagado: Math.min(pagado, total),
    saldo: cancelada ? 0 : saldo,
    estado: deriveEstado(total, Math.min(pagado, total), cancelada)
  };
}

/** Agrega saldo CxC desde visitas activas con deuda. */
export function agregarSaldoCliente(visitas: Visita[]): number {
  return roundMoney(
    (visitas || [])
      .filter(
        (v) =>
          v &&
          v.activo !== false &&
          v.estado !== 'cancelada' &&
          (v.estado === 'abierta' || v.estado === 'parcial' || (Number(v.saldo) || 0) > 0)
      )
      .reduce((s, v) => s + Math.max(0, Number(v.saldo) || 0), 0)
  );
}

export function calcularVisitaKpis(visitas: Visita[], hoyIso: string): VisitaKpis {
  const activas = (visitas || []).filter((v) => v.activo !== false && v.estado !== 'cancelada');
  const hoy = activas.filter((v) => v.fecha === hoyIso);
  return {
    visitasHoy: hoy.length,
    abiertas: activas.filter((v) => v.estado === 'abierta').length,
    parciales: activas.filter((v) => v.estado === 'parcial').length,
    saldoPorCobrar: agregarSaldoCliente(activas),
    cerradasHoy: hoy.filter((v) => v.estado === 'cerrada').length
  };
}

export function nuevaLineaId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ln_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function hoyLocalIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Spec 055 — cantidad POS (mínimo 1). */
export function cantidadLinea(linea: Pick<VisitaLinea, 'cantidad'> | null | undefined): number {
  return Math.max(1, Number(linea?.cantidad) || 1);
}

export function nombreBaseLinea(descripcion: string | null | undefined): string {
  return String(descripcion || '')
    .replace(/\s*×\s*\d+\s*$/, '')
    .trim();
}

export function precioUnitarioLinea(
  linea: Pick<VisitaLinea, 'monto' | 'cantidad'> | null | undefined
): number {
  if (!linea) return 0;
  return roundMoney((Number(linea.monto) || 0) / cantidadLinea(linea));
}

/**
 * Ajusta cantidad y monto. `null` = hay que quitar la línea (cantidad menor a 1).
 */
export function ajustarCantidadLinea(linea: VisitaLinea, delta: number): VisitaLinea | null {
  const next = cantidadLinea(linea) + delta;
  if (next < 1) return null;
  const unit = precioUnitarioLinea(linea);
  const base = nombreBaseLinea(linea.descripcion);
  const esProducto = linea.categoria === 'venta_producto';
  const qtyPrev = cantidadLinea(linea);
  const unitCosto = (Number(linea.costo) || 0) / qtyPrev;
  const tieneEconomia =
    linea.costo != null || linea.iva != null || linea.ganancia != null || linea.aplicaIva != null;
  const eco = tieneEconomia
    ? snapshotEconomiaLinea({
        precioVenta: linea.precio_venta ?? unit,
        costo: unitCosto,
        aplicaIva: linea.aplicaIva === true,
        tasaIva: linea.tasaIva,
        cantidad: next
      })
    : {};
  return {
    ...linea,
    cantidad: next,
    monto: roundMoney(unit * next),
    descripcion: esProducto ? `${base} × ${next}` : linea.descripcion,
    ...eco
  };
}

export function contarArticulos(lineas: VisitaLinea[] | null | undefined): number {
  if (!Array.isArray(lineas) || !lineas.length) return 0;
  return lineas.reduce((s, l) => s + cantidadLinea(l), 0);
}
