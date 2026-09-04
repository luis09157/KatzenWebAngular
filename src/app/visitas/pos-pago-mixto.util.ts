import { CajaMetodoPago } from '../finanzas/caja.models';
import { roundMoney } from './visitas.util';

export interface PartePagoMixto {
  metodo: CajaMetodoPago;
  monto: number;
}

export interface MontosMixto {
  efectivo?: number;
  tarjeta?: number;
  transferencia?: number;
}

export function armarPartesPagoMixto(montos: MontosMixto): PartePagoMixto[] {
  const keys: CajaMetodoPago[] = ['efectivo', 'tarjeta', 'transferencia'];
  return keys
    .map(metodo => ({ metodo, monto: roundMoney(Number(montos[metodo]) || 0) }))
    .filter(p => p.monto > 0);
}

export function totalPartesPago(partes: PartePagoMixto[]): number {
  return roundMoney(partes.reduce((s, p) => s + p.monto, 0));
}

export function validarPagoContraSaldo(
  partes: PartePagoMixto[],
  saldo: number
): { ok: true; total: number } | { ok: false; error: string; total: number } {
  const total = totalPartesPago(partes);
  const s = roundMoney(saldo);
  if (!partes.length || !(total > 0)) {
    return { ok: false, error: 'Indica al menos un monto a cobrar.', total };
  }
  if (total > s + 0.001) {
    return { ok: false, error: 'La suma no puede ser mayor al saldo del ticket.', total };
  }
  return { ok: true, total };
}

export function mensajePagoInvalido(valid: {
  ok: boolean;
  error?: string;
  total: number;
}): string | null {
  if (valid.ok) {
    return null;
  }
  return valid.error || 'Revisa el monto';
}
