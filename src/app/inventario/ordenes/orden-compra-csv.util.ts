import { CsvColumn } from '../../core/utils/csv-export.util';
import { OrdenCompra } from '../../shared/inventario.models';

export interface OrdenCompraCsvRow {
  folio: string;
  fecha: string;
  proveedor: string;
  estado: string;
  items: string;
  subtotal: string;
  iva: string;
  total: string;
  observaciones: string;
}

export function mapOrdenACsvRow(orden: OrdenCompra, proveedorNombre: string): OrdenCompraCsvRow {
  const items = (orden.items || [])
    .map((i) => `${i.producto_nombre || i.producto_id} x${Number(i.cantidad_solicitada) || 0}`)
    .join('; ');
  const money = (n: number | undefined) => (Number(n) || 0).toFixed(2);
  return {
    folio: String(orden.folio || ''),
    fecha: String(orden.fecha_orden || '').slice(0, 10),
    proveedor: proveedorNombre || '—',
    estado: String(orden.estado || ''),
    items,
    subtotal: money(orden.subtotal),
    iva: money(orden.iva),
    total: money(orden.total),
    observaciones: String(orden.observaciones || ''),
  };
}

export function columnasCsvOrdenes(): CsvColumn<OrdenCompraCsvRow>[] {
  return [
    { header: 'Folio', value: (r) => r.folio },
    { header: 'Fecha', value: (r) => r.fecha },
    { header: 'Proveedor', value: (r) => r.proveedor },
    { header: 'Estado', value: (r) => r.estado },
    { header: 'Items', value: (r) => r.items },
    { header: 'Subtotal', value: (r) => r.subtotal },
    { header: 'IVA', value: (r) => r.iva },
    { header: 'Total', value: (r) => r.total },
    { header: 'Observaciones', value: (r) => r.observaciones },
  ];
}

export function nombreArchivoCsvOrdenes(fechaIso = new Date().toISOString().slice(0, 10)): string {
  return `ordenes-compra-${fechaIso}.csv`;
}
