/** Movimiento de caja (ingresos / egresos simples). Spec 014. */
export type CajaTipoMovimiento = 'ingreso' | 'egreso';
export type CajaMetodoPago = 'efectivo' | 'tarjeta' | 'transferencia';

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
}
