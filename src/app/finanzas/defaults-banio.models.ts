/** Defaults de costo/precio baño por tamaño — spec 022 Fase A (+ XL aditivo). */
export type TamanoPerroBanio = 'pequeno' | 'mediano' | 'grande' | 'xl';

export interface DefaultBanioTamano {
  costoDefault: number;
  precioSugerido?: number;
  plantillaCostoId?: string;
}

export interface DefaultsBanioPorTamano {
  pequeno: DefaultBanioTamano;
  mediano: DefaultBanioTamano;
  grande: DefaultBanioTamano;
  /** Aditivo RTDB — gigante / extra grande (mismo patrón que pensión `gigante` 089). */
  xl: DefaultBanioTamano;
  updatedAt?: string;
  updatedBy?: string;
}

/**
 * Fallback en código si RTDB no tiene fila o trae 0 (no escribir prod desde el agente).
 * Alineado a mocks UI 022: P/M/G; XL = un escalón sobre grande.
 */
export const TARIFAS_BANIO_FALLBACK: Record<TamanoPerroBanio, { costoDefault: number; precioSugerido: number }> = {
  pequeno: { costoDefault: 40, precioSugerido: 250 },
  mediano: { costoDefault: 85, precioSugerido: 350 },
  grande: { costoDefault: 120, precioSugerido: 450 },
  xl: { costoDefault: 160, precioSugerido: 550 },
};

export const TAMANO_PERRO_LABELS: Record<TamanoPerroBanio, string> = {
  pequeno: 'Pequeño',
  mediano: 'Mediano',
  grande: 'Grande',
  xl: 'XL (extra grande)',
};

export const TAMANOS_PERRO_ORDEN: TamanoPerroBanio[] = ['pequeno', 'mediano', 'grande', 'xl'];

export function emptyDefaultsBanio(): DefaultsBanioPorTamano {
  return {
    pequeno: { costoDefault: 0 },
    mediano: { costoDefault: 0 },
    grande: { costoDefault: 0 },
    xl: { costoDefault: 0 },
  };
}

/** Si el valor guardado es 0/ausente, usa tarifa fallback en código. */
export function costoBanioEfectivo(
  tamano: TamanoPerroBanio | '' | null | undefined,
  costoGuardado: number | null | undefined
): number {
  const g = Number(costoGuardado);
  if (Number.isFinite(g) && g > 0) return g;
  if (!tamano || !(tamano in TARIFAS_BANIO_FALLBACK)) return 0;
  return TARIFAS_BANIO_FALLBACK[tamano].costoDefault;
}

export function precioBanioEfectivo(
  tamano: TamanoPerroBanio | '' | null | undefined,
  precioGuardado: number | null | undefined
): number {
  const g = Number(precioGuardado);
  if (Number.isFinite(g) && g > 0) return g;
  if (!tamano || !(tamano in TARIFAS_BANIO_FALLBACK)) return 0;
  return TARIFAS_BANIO_FALLBACK[tamano].precioSugerido;
}
