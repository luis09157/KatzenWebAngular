/** Consentimientos clínicos informados. Spec 037. */

export type ConsentimientoTipo =
  | 'cirugia'
  | 'anestesia'
  | 'egreso'
  | 'hospitalizacion'
  | 'eutanasia'
  | 'tratamiento'
  | 'otro';

export type ConsentimientoEstado = 'vigente' | 'revocado';

export const CONSENTIMIENTO_TIPO_LABELS: Record<ConsentimientoTipo, string> = {
  cirugia: 'Cirugía',
  anestesia: 'Anestesia',
  egreso: 'Egreso / alta',
  hospitalizacion: 'Hospitalización',
  eutanasia: 'Eutanasia',
  tratamiento: 'Tratamiento',
  otro: 'Otro'
};

export const CONSENTIMIENTO_ESTADO_LABELS: Record<ConsentimientoEstado, string> = {
  vigente: 'Vigente',
  revocado: 'Revocado'
};

export const CONSENTIMIENTO_TIPOS: ConsentimientoTipo[] = [
  'cirugia',
  'anestesia',
  'egreso',
  'hospitalizacion',
  'eutanasia',
  'tratamiento',
  'otro'
];

export interface Consentimiento {
  id?: string;
  cliente_id: string;
  cliente?: string;
  paciente_id: string;
  paciente?: string;
  tipo: ConsentimientoTipo;
  fecha: string;
  firmado_por: string;
  parentesco?: string;
  staff_uid?: string;
  staff_nombre?: string;
  notas?: string;
  estado: ConsentimientoEstado;
  activo: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  sucursalId?: string;
}

export interface ConsentimientoFormData {
  cliente_id: string;
  cliente?: string;
  paciente_id: string;
  paciente?: string;
  tipo: ConsentimientoTipo;
  fecha: string;
  firmado_por: string;
  parentesco?: string;
  staff_uid?: string;
  staff_nombre?: string;
  notas?: string;
  estado?: ConsentimientoEstado;
}

export interface ConsentimientoKpis {
  total: number;
  vigentes: number;
  delMes: number;
  revocados: number;
}
