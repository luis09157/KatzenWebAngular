import { Cliente } from '../core/models';

/** Dirección legible del cliente para el domicilio (spec 107). */
export function direccionDeCliente(cliente: Cliente | null | undefined): {
  texto: string;
  colonia: string;
  municipio: string;
} {
  const c = (cliente || {}) as Record<string, unknown>;
  const s = (k: string) => String(c[k] ?? '').trim();
  const calle = [s('calle'), s('numero') ? `#${s('numero').replace(/^#/, '')}` : ''].filter(Boolean).join(' ');
  const colonia = s('colonia');
  const municipio = s('municipio');
  const texto = [calle, colonia, municipio].filter(Boolean).join(', ') || s('direccion');
  return { texto, colonia, municipio };
}
