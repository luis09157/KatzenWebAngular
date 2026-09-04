import { CajaMovimiento } from './caja.models';
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
