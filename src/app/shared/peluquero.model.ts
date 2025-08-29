export interface Peluquero {
  id?: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  especialidad: string;
  experiencia_anos: number;
  horario_trabajo: {
    inicio: string;
    fin: string;
  };
  dias_trabajo: string[];
  tarifa_base: number;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export interface PeluqueroFormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  especialidad: string;
  experiencia_anos: number;
  horario_trabajo: {
    inicio: string;
    fin: string;
  };
  dias_trabajo: string[];
  tarifa_base: number;
}

export const ESPECIALIDADES_PELUQUERO = [
  'Baños y corte general',
  'Corte de razas específicas',
  'Tratamientos especiales',
  'Peluquería felina',
  'Peluquería canina',
  'Estética completa'
] as const;

export const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo'
] as const;
