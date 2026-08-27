/** Movimiento de caja (ingresos / egresos). Specs 014 + 021 + 022. */
export type CajaTipoMovimiento = 'ingreso' | 'egreso';
export type CajaMetodoPago = 'efectivo' | 'tarjeta' | 'transferencia';

/** Categoría operativa / P&L simple (021/022). Opcional en legacy. */
export type CajaCategoria =
  | 'banio'
  | 'corte'
  | 'cirugia'
  | 'venta_producto'
  | 'consulta'
  | 'vacuna'
  | 'pension'
  | 'publicidad'
  | 'proveedores'
  | 'gasolina'
  | 'operativo'
  | 'otro';

export const CAJA_CATEGORIA_LABELS: Record<CajaCategoria, string> = {
  banio: 'Baño / peluquería',
  corte: 'Corte',
  cirugia: 'Cirugía',
  venta_producto: 'Venta producto',
  consulta: 'Consulta',
  vacuna: 'Vacuna',
  pension: 'Pensión / alojamiento',
  publicidad: 'Publicidad',
  proveedores: 'Proveedores',
  gasolina: 'Gasolina',
  operativo: 'Operativo / generales',
  otro: 'Otro'
};

/** Categorías típicas de ingreso. */
export const CAJA_CATEGORIAS_INGRESO: CajaCategoria[] = [
  'banio',
  'corte',
  'cirugia',
  'venta_producto',
  'consulta',
  'vacuna',
  'pension',
  'otro'
];

/** Categorías tipificadas de egreso (022 Fase D — sin módulo Gastos). */
export const CAJA_CATEGORIAS_EGRESO: CajaCategoria[] = [
  'publicidad',
  'proveedores',
  'gasolina',
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
  /** Spec 032 — cobro ligado a ticket de visita. */
  visitaId?: string;
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
  /** Spec 022 — salidas de inventario ligadas al cobro. */
  movimientoInventarioIds?: string[];
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
  citaId?: string;
  /** Spec 032 — cobro ligado a ticket de visita. */
  visitaId?: string;
  clienteId?: string;
  notas?: string;
  categoria?: CajaCategoria;
  plantillaCostoId?: string;
  costoAsociado?: number;
  /** Spec 022 — IDs de movimientos de inventario ligados. */
  movimientoInventarioIds?: string[];
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

/** Día | semana (lun–dom de la fecha) | mes. Spec 022 C. */
export type CajaPeriodoModo = 'dia' | 'semana' | 'mes';

/** Punto para gráficas de rentabilidad (CSS, sin librería). */
export interface CajaChartBar {
  label: string;
  value: number;
  /** Clase CSS auxiliar (ok / egreso / warn). */
  tone?: 'ok' | 'egreso' | 'warn' | 'muted';
}

export interface CajaEgresoDesglose {
  categoria: CajaCategoria | 'sin_categoria';
  label: string;
  total: number;
}

/** Desglose de ingresos por categoría/servicio (spec 028). */
export interface CajaIngresoDesglose {
  categoria: CajaCategoria | 'sin_categoria';
  label: string;
  total: number;
  count: number;
}

/** Baño mínimo para refuerzo de ingresos sin caja (patrón owner-dashboard). */
export interface BanioIngresoRefuerzo {
  precio_total?: number;
  fecha_banio?: string;
  created_at?: string;
  estado?: string;
  cajaMovimientoId?: string;
  visitaId?: string;
  activo?: boolean;
}

/** Estancia pensión mínima para refuerzo ingresos sin caja (spec 031). */
export interface PensionIngresoRefuerzo {
  precio_total?: number;
  fecha_ingreso?: string;
  estado?: string;
  cajaMovimientoId?: string;
  cobradaEnVisitaId?: string;
  activo?: boolean;
}
