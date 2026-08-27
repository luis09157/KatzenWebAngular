/** Ticket unificado por visita + CxC. Spec 032. */
import { CajaCategoria } from '../finanzas/caja.models';

export type VisitaEstado = 'abierta' | 'parcial' | 'cerrada' | 'cancelada';

export type VisitaLineaCategoria =
  | 'consulta'
  | 'vacuna'
  | 'banio'
  | 'corte'
  | 'venta_producto'
  | 'pension'
  | 'cirugia'
  | 'otro';

export const VISITA_ESTADO_LABELS: Record<VisitaEstado, string> = {
  abierta: 'Abierta',
  parcial: 'Pago parcial',
  cerrada: 'Cerrada',
  cancelada: 'Cancelada'
};

export const VISITA_LINEA_CATEGORIA_LABELS: Record<VisitaLineaCategoria, string> = {
  consulta: 'Consulta',
  vacuna: 'Vacuna',
  banio: 'Baño / peluquería',
  corte: 'Corte',
  venta_producto: 'Producto',
  pension: 'Pensión',
  cirugia: 'Cirugía',
  otro: 'Otro'
};

/** Mapeo categoría de línea → categoría de caja al cobrar. */
export const VISITA_LINEA_A_CAJA: Record<VisitaLineaCategoria, CajaCategoria> = {
  consulta: 'consulta',
  vacuna: 'vacuna',
  banio: 'banio',
  corte: 'corte',
  venta_producto: 'venta_producto',
  pension: 'pension',
  cirugia: 'cirugia',
  otro: 'otro'
};

export interface VisitaLinea {
  id: string;
  descripcion: string;
  monto: number;
  categoria: VisitaLineaCategoria;
  citaId?: string;
  banioId?: string;
  vacunaId?: string;
  productoId?: string;
  pensionId?: string;
}

export interface Visita {
  id?: string;
  cliente_id: string;
  cliente?: string;
  paciente_id?: string;
  paciente?: string;
  fecha: string;
  estado: VisitaEstado;
  lineas: VisitaLinea[];
  total: number;
  pagado: number;
  saldo: number;
  cajaMovimientoIds?: string[];
  notas?: string;
  /** Spec 035 — staff que atendió (opcional). */
  atendidoPorUid?: string;
  atendidoPorNombre?: string;
  activo: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  sucursalId?: string;
}

export interface VisitaFormData {
  cliente_id: string;
  cliente?: string;
  paciente_id?: string;
  paciente?: string;
  fecha: string;
  notas?: string;
  atendidoPorUid?: string;
  atendidoPorNombre?: string;
  lineas?: VisitaLinea[];
}

export interface VisitaKpis {
  visitasHoy: number;
  abiertas: number;
  parciales: number;
  saldoPorCobrar: number;
  cerradasHoy: number;
}
