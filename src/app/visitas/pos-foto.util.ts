/** Foto / placeholder del POS táctil (055). No escribe inventario. */

export type PosFotoKind =
  | 'producto'
  | 'consulta'
  | 'vacuna'
  | 'medicamento'
  | 'banio'
  | 'corte'
  | 'servicio';

export function urlFotoProducto(producto?: { imagen_url?: string } | null): string {
  return String(producto?.imagen_url || '').trim();
}

export function tieneFotoProducto(producto?: { imagen_url?: string } | null): boolean {
  return !!urlFotoProducto(producto);
}

export function iconoPlaceholderPos(kind: PosFotoKind): string {
  switch (kind) {
    case 'consulta':
      return 'medical_services';
    case 'vacuna':
      return 'vaccines';
    case 'medicamento':
      return 'medication';
    case 'banio':
    case 'corte':
      return 'spa';
    case 'servicio':
      return 'room_service';
    default:
      return 'inventory_2';
  }
}

export function kindPlaceholderProducto(categoria?: string): PosFotoKind {
  const c = String(categoria || '').trim();
  if (c === 'medicamento' || c === 'vacuna') return c;
  if (c === 'consulta') return 'consulta';
  return 'producto';
}

export function kindPlaceholderLinea(categoria?: string, tieneProducto?: boolean): PosFotoKind {
  const c = String(categoria || '').trim();
  if (c === 'venta_producto' || tieneProducto) return 'producto';
  if (c === 'consulta' || c === 'vacuna' || c === 'banio' || c === 'corte') return c;
  return 'servicio';
}
