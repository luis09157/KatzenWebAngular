import { TAMANO_PENSION_LABELS, TamanoMascotaPension } from './pension.models';
import { TARIFA_PENSION_RANGO_KG, tarifaOficialPensionDia } from './pension-tarifas.util';

export interface PensionCobroRef {
  paciente?: string;
  cliente?: string;
  tamano_mascota?: string | null;
  precio_dia?: number | null;
  precio_total?: number | null;
}

/**
 * Texto de línea / concepto de caja para pensión (spec 089 Fase 2).
 * Incluye paquete para no confundir con baño/corte.
 */
export function descripcionCobroPension(estancia: PensionCobroRef): string {
  const paciente = String(estancia.paciente || '').trim() || 'mascota';
  const tamano = String(estancia.tamano_mascota || '').toLowerCase() as TamanoMascotaPension;
  const titulo = TAMANO_PENSION_LABELS[tamano];
  const rango = TARIFA_PENSION_RANGO_KG[tamano as keyof typeof TARIFA_PENSION_RANGO_KG];
  const precioDia =
    Number(estancia.precio_dia) > 0 ? Number(estancia.precio_dia) : tarifaOficialPensionDia(tamano) || 0;

  if (titulo && rango) {
    return `Pensión · ${titulo} (${rango}) · $${Math.round(precioDia)}/día · ${paciente}`;
  }
  if (titulo) {
    return `Pensión · ${titulo} · ${paciente}`;
  }
  return `Pensión · hospedaje · ${paciente}`;
}

/** Concepto corto para movimiento de caja (sin saturar). */
export function conceptoCajaPension(estancia: PensionCobroRef): string {
  const paciente = String(estancia.paciente || '').trim() || 'mascota';
  const cliente = String(estancia.cliente || '').trim();
  const tamano = String(estancia.tamano_mascota || '').toLowerCase() as TamanoMascotaPension;
  const titulo = TAMANO_PENSION_LABELS[tamano];
  const pack = titulo ? ` · ${titulo}` : '';
  const dueño = cliente ? ` · ${cliente}` : '';
  return `Pensión${pack} · ${paciente}${dueño}`.trim();
}
