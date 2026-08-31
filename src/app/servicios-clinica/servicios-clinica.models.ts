/** Catálogo de servicios de clínica (no stock). Spec 056. */

export type TipoServicioClinica = 'consulta' | 'diagnostico' | 'domicilio' | 'otro';

export const TIPOS_SERVICIO_CLINICA: TipoServicioClinica[] = [
  'consulta',
  'diagnostico',
  'domicilio',
  'otro'
];

export const TIPO_SERVICIO_CLINICA_LABELS: Record<TipoServicioClinica, string> = {
  consulta: 'Consulta',
  diagnostico: 'Diagnóstico',
  domicilio: 'Domicilio',
  otro: 'Otro / honorarios'
};

export interface ServicioClinica {
  id?: string;
  nombre: string;
  tipo: TipoServicioClinica;
  precio_venta: number;
  /** Neto: lo que cuesta a la clínica. Aditivo. */
  precio_costo?: number;
  /** Precio al público incluye IVA si true. Aditivo. */
  aplicaIva?: boolean;
  /** % IVA (default 16). Aditivo. */
  tasaIva?: number;
  activo: boolean;
  notas?: string;
  sucursalId?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
}

export interface ServicioClinicaFormData {
  nombre: string;
  tipo: TipoServicioClinica;
  precio_venta: number;
  precio_costo?: number;
  aplicaIva?: boolean;
  tasaIva?: number;
  notas?: string;
  activo?: boolean;
}
