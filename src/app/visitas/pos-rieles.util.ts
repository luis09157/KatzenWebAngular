import { CategoriaProducto, Producto } from '../shared/inventario.models';
import { esProductoDemoPos } from './pos-catalogo-demo.util';

/** Tres mundos de la misma caja Katzen (spec 055). */
export type PosRiel = 'petshop' | 'consulta' | 'peluqueria';

export const CATEGORIAS_PETSHOP: CategoriaProducto[] = ['alimento', 'accesorio', 'peluqueria'];
export const CATEGORIAS_CLINICAS: CategoriaProducto[] = [
  'medicamento',
  'vacuna',
  'quirurgico',
  'diagnostico'
];

export interface PosRielContexto {
  modoMostrador: boolean;
  clienteId?: string | null;
  pacienteId?: string | null;
}

export function esProductoClinico(producto: Pick<Producto, 'categoria'> | null | undefined): boolean {
  return CATEGORIAS_CLINICAS.includes((producto?.categoria || '') as CategoriaProducto);
}

export function esProductoPetshop(producto: Pick<Producto, 'categoria'> | null | undefined): boolean {
  if (!producto) return false;
  if (esProductoClinico(producto)) return false;
  return true;
}

export function rielRequiereDuenoYMascota(riel: PosRiel): boolean {
  return riel === 'consulta' || riel === 'peluqueria';
}

/** Walk-in/mostrador solo petshop. Consulta y peluquería piden dueño + mascota. */
export function puedeUsarRiel(riel: PosRiel, ctx: PosRielContexto): boolean {
  if (riel === 'petshop') return true;
  if (ctx.modoMostrador) return false;
  const cliente = String(ctx.clienteId || '').trim();
  const paciente = String(ctx.pacienteId || '').trim();
  return !!cliente && !!paciente && cliente !== '__mostrador__';
}

export function mensajeRielBloqueado(riel: PosRiel, ctx: PosRielContexto): string {
  if (puedeUsarRiel(riel, ctx)) return '';
  if (riel === 'consulta') {
    return 'La consulta y el medicamento necesitan dueño y mascota. El mostrador solo vende petshop.';
  }
  if (riel === 'peluqueria') {
    return 'La peluquería necesita dueño y mascota. Elige el cliente o registra el baño en Atención clínica.';
  }
  return '';
}

/** Riel visual: demo usa `rielPos`; catálogo real sigue petshop vs clínico. Peluquería real no es anaquel. */
export function rielDeProducto(producto: Producto | null | undefined): PosRiel | null {
  if (!producto) return null;
  if (
    esProductoDemoPos(producto) &&
    (producto.rielPos === 'petshop' ||
      producto.rielPos === 'consulta' ||
      producto.rielPos === 'peluqueria')
  ) {
    return producto.rielPos;
  }
  if (esProductoClinico(producto)) return 'consulta';
  if (esProductoPetshop(producto)) return 'petshop';
  return null;
}

export function filtrarProductosPorRiel(
  productos: Producto[] | null | undefined,
  riel: PosRiel
): Producto[] {
  const rows = (productos || []).filter((p) => p && p.activo !== false);
  return rows.filter((p) => rielDeProducto(p) === riel);
}
