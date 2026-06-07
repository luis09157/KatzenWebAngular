/** Resuelve el ID de cliente en registros de paciente/mascota (RTDB usa ambos campos). */
export function getPacienteClienteId(
  paciente: { cliente_id?: string; idCliente?: string } | null | undefined
): string {
  return (paciente?.cliente_id || paciente?.idCliente || '').toString();
}

export function pacientePerteneceACliente(
  paciente: { cliente_id?: string; idCliente?: string } | null | undefined,
  clienteId: string | null | undefined
): boolean {
  if (!clienteId) {
    return false;
  }
  return getPacienteClienteId(paciente) === clienteId.toString();
}
