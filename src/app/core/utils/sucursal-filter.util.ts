/** Muestra registros sin sucursal (legacy) o de la sucursal activa. */
export function filterBySucursal<T extends { sucursalId?: string }>(
  items: T[],
  sucursalId: string
): T[] {
  if (!sucursalId) {
    return items;
  }
  return items.filter(item => !item.sucursalId || item.sucursalId === sucursalId);
}
