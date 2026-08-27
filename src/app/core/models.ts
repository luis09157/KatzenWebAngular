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
  /** Spec 034 — fuente de verdad de alergias (aditivo). */
  alergias?: string[];
  /** Legacy / texto libre; se normaliza en lectura junto a `alergias`. */
  alergiasTexto?: string;
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
  /** Spec 024 — datos fiscales aditivos (sin timbrar). */
  rfc?: string;
  razonSocial?: string;
  usoCfdi?: string;
  regimenFiscal?: string;
  codigoPostalFiscal?: string;
  requiereFactura?: boolean;
  /** Spec 032 — CxC denormalizado (fuente de verdad: Visitas). */
  saldoPendiente?: number;
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
  /** Nombre del doctor asignado (formulario admin). */
  veterinario?: string;
  veterinario_id?: string;
  /** Duración del slot en minutos; default web 30. Campo aditivo RTDB. */
  duracion_minutos?: number;
  /** Obligatorio al cancelar; visible en portal. Campo aditivo RTDB. */
  motivo_cancelacion?: string;
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
  /** Notas solo staff/médicos — no mostrar en portal ni app móvil. */
  notas_internas?: string;
  activo?: boolean;
  [key: string]: unknown;
}
