import {
  Visita,
  VisitaEstado,
  VisitaKpis,
  VisitaLinea
} from './visitas.models';

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
