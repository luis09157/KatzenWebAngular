/** Validaciones de acceso al portal de clientes. */

import { pacientePerteneceACliente } from '../../core/utils/paciente-cliente.util';

export const PORTAL_LOAD_ERROR =
  'No pudimos cargar tu información. Intenta de nuevo o contacta a la clínica.';

export const PORTAL_ACCESS_ERROR =
  'No tienes permiso para ver este contenido.';

export const PORTAL_INACTIVE_ERROR =
  'Tu acceso al portal no está activo. Comunícate con la clínica para activarlo.';

export function isPortalClienteActive(
  cliente: Record<string, unknown> | null | undefined
): boolean {
  if (!cliente) return false;
  return (
    cliente['portalActivo'] === true &&
    cliente['activo'] !== false &&
    !!cliente['authUid']
  );
}

export function mascotaPerteneceACliente(
  mascota: { idCliente?: string; cliente_id?: string } | null | undefined,
  clienteId: string
): boolean {
  return pacientePerteneceACliente(mascota, clienteId);
}
