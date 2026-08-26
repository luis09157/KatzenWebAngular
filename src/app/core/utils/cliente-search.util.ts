import { Cliente } from '../models';

/** Nombre completo del cliente (nombre + apellidos). */
export function getClienteNombreCompleto(cliente: Cliente | null | undefined): string {
  if (!cliente) return '';
  return [cliente.nombre, cliente.apellidoPaterno, cliente.apellidoMaterno]
    .filter(Boolean)
    .join(' ')
    .trim();
}

/** Etiqueta para autocomplete: nombre + teléfono si existe. */
export function getClienteDisplayLabel(cliente: Cliente | null | undefined): string {
  const nombre = getClienteNombreCompleto(cliente);
  const telefono = cliente?.telefono?.toString().trim();
  return telefono ? `${nombre} — ${telefono}` : nombre;
}

/**
 * Filtra clientes activos por nombre, apellidos, teléfono o expediente.
 * Reutilizado en citas, baños, pensión y demás pickers cliente→paciente.
 */
export function filtrarClientes(clientes: Cliente[], query: unknown): Cliente[] {
  const activos = (clientes || []).filter(c => c.activo !== false);
  if (!query || typeof query !== 'string') {
    return activos;
  }

  const filterValue = query.toLowerCase().trim();
  if (!filterValue) {
    return activos;
  }

  return activos.filter(cliente => {
    const nombre = (cliente.nombre || '').toLowerCase();
    const apellidoPaterno = (cliente.apellidoPaterno || '').toLowerCase();
    const apellidoMaterno = (cliente.apellidoMaterno || '').toLowerCase();
    const telefono = (cliente.telefono || '').toString();
    const expediente = cliente.expediente != null ? String(cliente.expediente) : '';
    const correo = (cliente.correo || '').toLowerCase();

    const nombreCompleto = `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim();
    const coincideNombreCompleto = nombreCompleto.includes(filterValue);

    const palabras = [nombre, apellidoPaterno, apellidoMaterno]
      .flatMap(part => part.split(' ').filter(Boolean));
    const coincidePorPalabras = palabras.some(
      palabra => palabra.includes(filterValue) || filterValue.includes(palabra)
    );

    return (
      coincideNombreCompleto ||
      coincidePorPalabras ||
      telefono.includes(filterValue) ||
      expediente.includes(filterValue) ||
      correo.includes(filterValue)
    );
  });
}
