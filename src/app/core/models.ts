/**
 * Interfaces mínimas para entidades de la app.
 * Compatibles con la estructura actual de Firebase; permiten campos adicionales.
 */

export interface Paciente {
  id?: string;
  nombre?: string;
  especie?: string;
  raza?: string;
  sexo?: string;
  estado?: string;
  edad?: string;
  color?: string;
  peso?: string | number;
  cliente_id?: string;
  idCliente?: string;
  activo?: boolean;
  foto?: string;
  fecha_creacion?: string;
  fecha_registro?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface Cliente {
  id?: string;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  telefono?: string;
  correo?: string;
  expediente?: string;
  direccion?: string;
  activo?: boolean;
  [key: string]: unknown;
}

export interface Cita {
  id?: string;
  cliente_id?: string;
  paciente_id?: string;
  fecha?: string;
  fecha_hora?: string;
  hora?: string;
  motivo?: string;
  estado?: string;
  veterinario_id?: string;
  activo?: boolean;
  [key: string]: unknown;
}

export interface Historial {
  id?: string;
  paciente_id?: string;
  fecha_registro?: string;
  diagnostico_presuntivo?: string;
  manejo_terapeutico?: string;
  receta?: string;
  activo?: boolean;
  [key: string]: unknown;
}
