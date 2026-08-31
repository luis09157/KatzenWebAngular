import { Cliente } from '../models';
import { hydrateCliente } from './cliente-hydrate.util';
import { pickLegacyString } from './rtdb-row.util';
import { normalizarTextoBusqueda, textoCoincide } from './text-search.util';

/** Nombre completo del cliente (web + shape móvil Nombre / razón social). */
export function getClienteNombreCompleto(cliente: Cliente | null | undefined): string {
  if (!cliente) {
    return '';
  }
  const rec = cliente as Record<string, unknown>;
  const hidratado = rec['nombre'] || rec['Nombre']
    ? hydrateCliente(cliente.id, cliente)
    : cliente;
  const partes = [
    hidratado.nombre,
    hidratado.apellidoPaterno,
    hidratado.apellidoMaterno
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (partes) {
    return partes;
  }
  return pickLegacyString(rec, 'razonSocial', 'razon_social', 'razon', 'RazonSocial', 'Nombre');
}

/** Etiqueta para autocomplete: nombre + teléfono si existe. */
export function getClienteDisplayLabel(cliente: Cliente | null | undefined): string {
  const nombre = getClienteNombreCompleto(cliente);
  const telefono = cliente?.telefono?.toString().trim();
  return telefono ? `${nombre} — ${telefono}` : nombre;
}

/**
 * Filtra clientes activos por nombre (incl. Nombre/razón), apellidos, teléfono o expediente.
 * Normaliza acentos y espacios. Reutilizado en citas, baños, pensión y listado admin.
 */
export function filtrarClientes(clientes: Cliente[], query: unknown): Cliente[] {
  const activos = (clientes || []).filter(c => c.activo !== false);
  if (!query || typeof query !== 'string') {
    return activos;
  }

  const filterValue = String(query).trim();
  if (!filterValue) {
    return activos;
  }

  return activos.filter(cliente => clienteCoincideBusqueda(cliente, filterValue));
}

export function clienteCoincideBusqueda(cliente: Cliente | null | undefined, query: unknown): boolean {
  if (!cliente) {
    return false;
  }
  const rec = cliente as Record<string, unknown>;
  const haystack = [
    getClienteNombreCompleto(cliente),
    pickLegacyString(rec, 'Nombre', 'nombreCompleto'),
    cliente.telefono,
    cliente.correo,
    cliente.expediente,
    cliente.razonSocial
  ]
    .filter(Boolean)
    .join(' ');
  return textoCoincide(haystack, query);
}

export function haystackClienteParaFiltro(cliente: Cliente | null | undefined): string {
  return normalizarTextoBusqueda(
    [
      getClienteNombreCompleto(cliente),
      cliente?.telefono,
      cliente?.correo,
      cliente?.expediente,
      cliente?.razonSocial
    ]
      .filter(Boolean)
      .join(' ')
  );
}
