import { PeriodoPreset, PeriodoRango } from '../core/utils/periodo-filtro.util';

export interface OwnerKpisFinancieros {
  ventaBruta: number;
  costosAsociados: number;
  gastosOperativos: number;
  gananciaNeta: number;
  transaccionesPeriodo: number;
}

export interface OwnerKpisOperativos {
  citasHoy: number;
  citasPeriodo: number;
  baniosPeriodo: number;
  stockBajo: number;
  clientesNuevosPeriodo: number;
  pensionActivas: number;
}

export interface OwnerTopItem {
  rank: number;
  nombre: string;
  detalle: string;
  monto: number;
}

export interface OwnerSeriePunto {
  fecha: string;
  ingresos: number;
}

export interface OwnerDashboardSnapshot {
  rango: PeriodoRango;
  preset: PeriodoPreset;
  financieros: OwnerKpisFinancieros;
  operativos: OwnerKpisOperativos;
  serieIngresos: OwnerSeriePunto[];
  topServicios: OwnerTopItem[];
  topProductos: OwnerTopItem[];
  resumen: Array<{ label: string; value: number; tone: 'ok' | 'cost' | 'gasto' | 'neto' }>;
}
