/** Estancia de pensión / alojamiento — spec 022 (scaffold MVP). */
export type TamanoMascotaPension = 'pequeno' | 'mediano' | 'grande';
export type EstadoPension =
  | 'reservada'
  | 'activa'
  | 'finalizada'
  | 'cancelada';

export interface PensionEstancia {
  id?: string;
  paciente_id: string;
  paciente?: string;
  cliente_id: string;
  cliente?: string;
  fecha_ingreso: string;
  fecha_salida_prevista?: string;
  fecha_salida_real?: string;
  tamano_mascota?: TamanoMascotaPension;
  precio_dia: number;
  precio_total?: number;
  costo_dia?: number;
  costo_total_estimado?: number;
  estado: EstadoPension;
  notas?: string;
  cajaMovimientoId?: string;
  plantillaCostoId?: string;
  /** Spec 039/040 — ticket de visita. */
  visitaId?: string;
  cobradaEnVisitaId?: string;
  activo: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: string;
}

export interface PensionEstanciaFormData {
  paciente_id: string;
  paciente?: string;
  cliente_id: string;
  cliente?: string;
  fecha_ingreso: string;
  fecha_salida_prevista?: string;
  tamano_mascota?: TamanoMascotaPension;
  precio_dia: number;
  precio_total?: number;
  costo_dia?: number;
  estado: EstadoPension;
  notas?: string;
}

export const TAMANO_PENSION_LABELS: Record<TamanoMascotaPension, string> = {
  pequeno: 'Pequeño',
  mediano: 'Mediano',
  grande: 'Grande'
};

export const ESTADO_PENSION_LABELS: Record<EstadoPension, string> = {
  reservada: 'Reservada',
  activa: 'Activa',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada'
};
