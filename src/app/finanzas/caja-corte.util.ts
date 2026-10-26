import { CajaCorte, CajaMovimiento } from './caja.models';
import { fondoInicialDesdeUltimoCorte } from './caja-turno.util';
import { roundMoney } from '../visitas/visitas.util';

export interface CorteCajaCalculo {
  ingresosEfectivo: number;
  egresosEfectivo: number;
  esperado: number;
  diferencia: number;
  cuadrado: boolean;
}

export function efectivoNetoDelDia(movimientos: CajaMovimiento[], fecha: string): { ingresos: number; egresos: number } {
  const delDia = (movimientos || []).filter(
    m => m.activo !== false && m.fecha === fecha && m.metodoPago === 'efectivo'
  );
  const ingresos = roundMoney(
    delDia.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + (Number(m.monto) || 0), 0)
  );
  const egresos = roundMoney(
    delDia.filter(m => m.tipo === 'egreso').reduce((s, m) => s + (Number(m.monto) || 0), 0)
  );
  return { ingresos, egresos };
}

/** esperado = fondo inicial + ingresos efectivo − egresos efectivo. */
export function calcularCorteCaja(input: {
  fondoInicial: number;
  ingresosEfectivo: number;
  egresosEfectivo: number;
  efectivoContado: number;
}): CorteCajaCalculo {
  const fondoInicial = roundMoney(Number(input.fondoInicial) || 0);
  const ingresosEfectivo = roundMoney(Number(input.ingresosEfectivo) || 0);
  const egresosEfectivo = roundMoney(Number(input.egresosEfectivo) || 0);
  const efectivoContado = roundMoney(Number(input.efectivoContado) || 0);
  const esperado = roundMoney(fondoInicial + ingresosEfectivo - egresosEfectivo);
  const diferencia = roundMoney(efectivoContado - esperado);
  return {
    ingresosEfectivo,
    egresosEfectivo,
    esperado,
    diferencia,
    cuadrado: Math.abs(diferencia) < 0.01
  };
}

/** Cortes activos de un día, del más viejo al más nuevo. */
export function cortesDelDia(cortes: CajaCorte[] | null | undefined, fecha: string): CajaCorte[] {
  const f = String(fecha || '').slice(0, 10);
  return (cortes || [])
    .filter((c) => !!c && c.activo !== false && String(c.fecha || '').slice(0, 10) === f)
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
}

/**
 * Movimientos del día que todavía no entran en ningún corte:
 * todos si no hay corte; si hay, los creados después del último corte (2026-10-26).
 */
export function movimientosPendientesDeCorte(
  movimientos: CajaMovimiento[] | null | undefined,
  cortes: CajaCorte[] | null | undefined,
  fecha: string
): CajaMovimiento[] {
  const f = String(fecha || '').slice(0, 10);
  const delDia = (movimientos || []).filter((m) => m && m.activo !== false && m.fecha === f);
  const previos = cortesDelDia(cortes, f);
  if (!previos.length) return delDia;
  const desde = String(previos[previos.length - 1].createdAt || '');
  return delDia.filter((m) => !!m.createdAt && String(m.createdAt) > desde);
}

/** Ingresos y egresos en efectivo de una lista ya filtrada. */
export function efectivoNeto(movimientos: CajaMovimiento[]): { ingresos: number; egresos: number } {
  const ef = (movimientos || []).filter((m) => m.activo !== false && m.metodoPago === 'efectivo');
  return {
    ingresos: roundMoney(ef.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + (Number(m.monto) || 0), 0)),
    egresos: roundMoney(ef.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + (Number(m.monto) || 0), 0)),
  };
}

/**
 * Fondo con el que arranca el corte:
 * - Corte complementario: lo que quedó en caja en el corte anterior del mismo día.
 * - Primer corte del día: el fondo del turno; si no hubo turno (día sin cobros), lo que quedó en el último corte anterior.
 */
export function fondoParaCorte(
  cortes: CajaCorte[] | null | undefined,
  fecha: string,
  fondoTurno?: number | null
): number {
  const f = String(fecha || '').slice(0, 10);
  const previosDia = cortesDelDia(cortes, f);
  if (previosDia.length) {
    return fondoInicialDesdeUltimoCorte([previosDia[previosDia.length - 1]]);
  }
  if (fondoTurno != null && Number.isFinite(Number(fondoTurno))) {
    return roundMoney(Number(fondoTurno));
  }
  const anteriores = (cortes || []).filter((c) => !!c && String(c.fecha || '').slice(0, 10) < f);
  return fondoInicialDesdeUltimoCorte(anteriores);
}

/** Lo que queda en caja tras el retiro (nunca negativo). */
export function fondoSiguienteTrasRetiro(efectivoContado: number, retiro: number): number {
  return roundMoney(Math.max(0, (Number(efectivoContado) || 0) - (Number(retiro) || 0)));
}
