/**
 * Payload RTDB de estancias de pensión.
 * Firebase rechaza `undefined` en cualquier propiedad del valor.
 */

import { omitUndefinedRtdb } from '../core/utils/omit-undefined-rtdb.util';
export { omitUndefinedRtdb };

/** Costo interno opcional (margen). Sin valor → omitir; no forzar 0. */
export function normalizeCostoDiaPension(costoDia: unknown): number | undefined {
  if (costoDia == null || costoDia === '') return undefined;
  const n = Number(costoDia);
  if (Number.isNaN(n)) return undefined;
  return Math.max(0, n);
}

export interface PensionEstanciaCreateInput {
  paciente_id: string;
  paciente?: string;
  cliente_id: string;
  cliente?: string;
  fecha_ingreso: string;
  fecha_salida_prevista?: string;
  tamano_mascota?: string;
  precio_dia: number;
  precio_total?: number;
  costo_dia?: number | null;
  estado?: string;
  notas?: string;
  dias: number;
  now: string;
  staffId: string;
}

/** Campos listos para `push` en `Katzen/Pension/Estancias` (sin undefined). */
export function buildPensionEstanciaCreatePayload(input: PensionEstanciaCreateInput): Record<string, unknown> {
  const precioDia = Math.max(0, Number(input.precio_dia) || 0);
  const costoDia = normalizeCostoDiaPension(input.costo_dia);
  const precioTotal =
    input.precio_total != null && !Number.isNaN(Number(input.precio_total))
      ? Math.max(0, Number(input.precio_total))
      : Math.round(precioDia * input.dias * 100) / 100;

  return omitUndefinedRtdb({
    paciente_id: input.paciente_id,
    paciente: input.paciente || '',
    cliente_id: input.cliente_id,
    cliente: input.cliente || '',
    fecha_ingreso: input.fecha_ingreso,
    fecha_salida_prevista: input.fecha_salida_prevista || undefined,
    tamano_mascota: input.tamano_mascota || undefined,
    precio_dia: precioDia,
    precio_total: precioTotal,
    costo_dia: costoDia,
    costo_total_estimado: costoDia != null ? Math.round(costoDia * input.dias * 100) / 100 : undefined,
    estado: input.estado || 'reservada',
    notas: input.notas || '',
    activo: true,
    created_at: input.now,
    updated_at: input.now,
    created_by: input.staffId || 'system',
  });
}
