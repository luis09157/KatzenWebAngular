/** Movimiento de caja (ingresos / egresos). Specs 014 + 021. */
export type CajaTipoMovimiento = 'ingreso' | 'egreso';
export type CajaMetodoPago = 'efectivo' | 'tarjeta' | 'transferencia';

/** Categoría operativa / P&L simple (021). Opcional en legacy. */
export type CajaCategoria =
  | 'banio'
  | 'corte'
  | 'cirugia'
  | 'venta_producto'
  | 'consulta'
  | 'publicidad'
  | 'operativo'
  | 'otro';

export const CAJA_CATEGORIA_LABELS: Record<CajaCategoria, string> = {
  banio: 'Baño / peluquería',
  corte: 'Corte',
  cirugia: 'Cirugía',
  venta_producto: 'Venta producto',
  consulta: 'Consulta',
  publicidad: 'Publicidad',
  operativo: 'Gasto operativo',
  otro: 'Otro'
};

/** Categorías típicas de ingreso. */
export const CAJA_CATEGORIAS_INGRESO: CajaCategoria[] = [
  'banio',
  'corte',
  'cirugia',
  'venta_producto',
  'consulta',
  'otro'
];

/** Categorías típicas de egreso. */
export const CAJA_CATEGORIAS_EGRESO: CajaCategoria[] = [
  'publicidad',
  'operativo',
  'otro'
];

export interface CajaMovimiento {
  id?: string;
  tipo: CajaTipoMovimiento;
  monto: number;
  metodoPago: CajaMetodoPago;
  /** Control fiscal por cobro (domain-context #20). */
  ivaDeclarado: boolean;
  concepto: string;
  /** Fecha del cobro YYYY-MM-DD (local clínica). */
  fecha: string;
  banioId?: string;
  citaId?: string;
  clienteId?: string;
  sucursalId?: string;
  notas?: string;
  /** Spec 021 — taxonomía P&L. */
  categoria?: CajaCategoria;
  plantillaCostoId?: string;
  /** Costo estimado del servicio / COGS asociado al cobro. */
  costoAsociado?: number;
  /** Solo ingresos con costo: monto − costoAsociado. */
  margenEstimado?: number;
  activo: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface CajaMovimientoFormData {
  tipo: CajaTipoMovimiento;
  monto: number;
  metodoPago: CajaMetodoPago;
  ivaDeclarado: boolean;
  concepto: string;
  fecha: string;
  banioId?: string;
  notas?: string;
  categoria?: CajaCategoria;
  plantillaCostoId?: string;
  costoAsociado?: number;
}

export interface CajaDiaKpis {
  totalIngresos: number;
  totalEgresos: number;
  neto: number;
  efectivo: number;
  tarjeta: number;
  transferencia: number;
  ivaDeclarado: number;
  ivaNoDeclarado: number;
  movimientosActivos: number;
  /** Spec 021 */
  totalCostosAsociados: number;
  margenEstimado: number;
  ingresosConCosto: number;
  ingresosSinCosto: number;
}

export type CajaPeriodoModo = 'dia' | 'mes';
