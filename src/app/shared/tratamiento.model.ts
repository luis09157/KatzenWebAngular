export interface Tratamiento {
  id?: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  procedimientos?: string[];
  duracion_estimada?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  uso_count?: number; // Contador de uso
}

export interface TratamientoFormData {
  nombre: string;
  descripcion?: string;
  categoria?: string;
  procedimientos?: string[];
  duracion_estimada?: string;
}
