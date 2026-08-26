import { Cliente, Paciente } from '../../core/models';

/** Valor emitido al seleccionar cliente y paciente enlazados RTDB. */
export interface ClientePacienteSelection {
  cliente_id: string;
  cliente: string;
  paciente_id: string;
  paciente: string;
  clienteData?: Cliente;
  pacienteData?: Paciente;
}

/** Nombres de controles en el FormGroup padre (defaults pensión/citas). */
export interface ClientePacientePickerFields {
  clienteId?: string;
  pacienteId?: string;
  clienteNombre?: string;
  pacienteNombre?: string;
}

export const DEFAULT_CLIENTE_PACIENTE_FIELDS: Required<ClientePacientePickerFields> = {
  clienteId: 'cliente_id',
  pacienteId: 'paciente_id',
  clienteNombre: 'cliente',
  pacienteNombre: 'paciente'
};
