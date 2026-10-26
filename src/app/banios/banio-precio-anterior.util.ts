import { normalizeFechaIso } from '../core/utils/periodo-filtro.util';

/**
 * Precio anterior de peluquería (Luis, 2026-10-26): el precio se decide al momento,
 * pero si la mascota ya tiene baños, se sugiere lo que se le cobró la última vez.
 * Prefiere el mismo servicio; si no hay, el último baño con precio.
 */
export interface BanioConPrecio {
  id?: string;
  tipo_servicio?: string | null;
  precio_total?: number | string | null;
  fecha_banio?: string | null;
  created_at?: string | null;
  estado?: string | null;
  activo?: boolean | null;
}

export interface PrecioAnteriorBanio {
  precio: number;
  fechaIso: string;
  tipoServicio: string;
  mismoServicio: boolean;
}

/** Tipos viejos que equivalen a los nuevos (baños de 2024 usan los nombres anteriores). */
const EQUIVALENTES: Record<string, string> = {
  'baño_básico': 'baño',
  'baño_completo': 'baño_con_corte',
  corte_pelo: 'baño_con_corte',
  deslanado: 'baño_con_deslanado',
};

function tipoCanonico(t: string | null | undefined): string {
  const v = String(t || '');
  return EQUIVALENTES[v] || v;
}

function fechaDe(b: BanioConPrecio): string {
  return normalizeFechaIso(b.fecha_banio || '') || normalizeFechaIso(b.created_at || '') || '';
}

export function precioAnteriorBanio(
  banios: BanioConPrecio[] | null | undefined,
  opts: { tipoServicio?: string | null; excluirId?: string | null } = {}
): PrecioAnteriorBanio | null {
  const validos = (banios || [])
    .filter(
      (b) =>
        !!b &&
        b.activo !== false &&
        String(b.estado || '').toLowerCase() !== 'cancelado' &&
        (!opts.excluirId || b.id !== opts.excluirId) &&
        Number(b.precio_total) > 0
    )
    .sort((a, b) => fechaDe(b).localeCompare(fechaDe(a)));
  if (!validos.length) return null;
  const tipo = tipoCanonico(opts.tipoServicio);
  const mismo = tipo ? validos.find((b) => tipoCanonico(b.tipo_servicio) === tipo) : undefined;
  const elegido = mismo || validos[0];
  return {
    precio: Math.round(Number(elegido.precio_total) * 100) / 100,
    fechaIso: fechaDe(elegido),
    tipoServicio: String(elegido.tipo_servicio || ''),
    mismoServicio: !!mismo,
  };
}
