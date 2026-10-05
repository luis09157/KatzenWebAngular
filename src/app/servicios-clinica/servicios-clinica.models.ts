/** Catálogo de servicios de clínica (no stock). Spec 056 + taxonomía 093. */

/** Tipos de acto clínico (UI / altas nuevas). Spec 093 — sin `domicilio`. */
export type TipoServicioClinica = 'consulta' | 'diagnostico' | 'procedimiento' | 'otro';

/** Incluye `domicilio` solo para nodos legacy RTDB (lectura). */
export type TipoServicioClinicaLegacy = TipoServicioClinica | 'domicilio';

export const TIPOS_SERVICIO_CLINICA: TipoServicioClinica[] = ['consulta', 'diagnostico', 'procedimiento', 'otro'];

export const TIPO_SERVICIO_CLINICA_LABELS: Record<TipoServicioClinica, string> = {
  consulta: 'Consulta',
  diagnostico: 'Diagnóstico',
  procedimiento: 'Procedimiento',
  otro: 'Otro / honorarios',
};

export interface ServicioClinica {
  id?: string;
  nombre: string;
  tipo: TipoServicioClinica;
  /** Modalidad: se presta / cobra a domicilio. Aditivo 093; ausente/false = clínica. */
  esDomicilio?: boolean;
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
  esDomicilio?: boolean;
  precio_venta: number;
  precio_costo?: number;
  aplicaIva?: boolean;
  tasaIva?: number;
  notas?: string;
  activo?: boolean;
}
