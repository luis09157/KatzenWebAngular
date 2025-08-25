export interface Diagnostico {
  id?: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  sintomas?: string[];
  activo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  uso_count?: number; // Contador de uso
}

export interface DiagnosticoFormData {
  nombre: string;
  descripcion?: string;
  categoria?: string;
  sintomas?: string[];
}
