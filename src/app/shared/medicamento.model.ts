export interface Medicamento {
  id?: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  dosis_estandar?: string;
  frecuencia_estandar?: string;
  duracion_estandar?: string;
  contraindicaciones?: string[];
  activo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  uso_count?: number; // Contador de uso
}

export interface MedicamentoFormData {
  nombre: string;
  descripcion?: string;
  categoria?: string;
  dosis_estandar?: string;
  frecuencia_estandar?: string;
  duracion_estandar?: string;
  contraindicaciones?: string[];
}
