/**
 * Tarifas oficiales de pensión por día (clínica KatzenVet).
 * Fuente: PDV Eleventa + confirmación Luis 2026-10-02 · spec 089.
 */
export type TamanoTarifaPension = 'pequeno' | 'mediano' | 'grande' | 'gigante';

/** Precio de venta por día (MXN). */
export const TARIFAS_PENSION_OFICIALES_DIA: Record<TamanoTarifaPension, number> = {
  pequeno: 250, // Pension Perro Chico O Gato (0–10 kg)
  mediano: 300, // Pension Perro Mediano (10.1–15 kg)
  grande: 400, // Pension Perro Grande (15.1–30 kg)
  gigante: 500, // Pension Gigante (>30 kg)
};

export const TARIFA_PENSION_RANGO_KG: Record<TamanoTarifaPension, string> = {
  pequeno: '0–10 kg · chico o gato',
  mediano: '10.1–15 kg',
  grande: '15.1–30 kg',
  gigante: '>30 kg',
};

export const TAMANOS_PENSION_CON_TARIFA_ACTIVA: TamanoTarifaPension[] = ['pequeno', 'mediano', 'grande', 'gigante'];

export interface PaquetePensionOficial {
  tamano: TamanoTarifaPension;
  precioDia: number;
  rangoKg: string;
  titulo: string;
}

const TITULOS: Record<TamanoTarifaPension, string> = {
  pequeno: 'Pequeño',
  mediano: 'Mediano',
  grande: 'Grande',
  gigante: 'Gigante',
};

export function paquetesPensionOficiales(): PaquetePensionOficial[] {
  return TAMANOS_PENSION_CON_TARIFA_ACTIVA.map((tamano) => ({
    tamano,
    precioDia: TARIFAS_PENSION_OFICIALES_DIA[tamano],
    rangoKg: TARIFA_PENSION_RANGO_KG[tamano],
    titulo: TITULOS[tamano],
  }));
}

export function tarifaOficialPensionDia(tamano: string | null | undefined): number | null {
  const key = String(tamano || '').toLowerCase() as TamanoTarifaPension;
  if (!(key in TARIFAS_PENSION_OFICIALES_DIA)) return null;
  return TARIFAS_PENSION_OFICIALES_DIA[key];
}

/**
 * Si el default guardado es 0 o inválido, usa la tarifa oficial.
 * No pisa un precio > 0 configurado en Finanzas.
 */
export function precioDiaPensionEfectivo(
  tamano: string | null | undefined,
  precioGuardado: number | null | undefined
): number {
  const guardado = Number(precioGuardado);
  if (Number.isFinite(guardado) && guardado > 0) {
    return guardado;
  }
  return tarifaOficialPensionDia(tamano) ?? 0;
}

/** Sugiere paquete por peso en kg (rangos Eleventa). */
export function sugerirTamanoPensionPorPeso(pesoKg: number | null | undefined): TamanoTarifaPension | '' {
  const p = Number(pesoKg);
  if (!Number.isFinite(p) || p <= 0) return '';
  if (p <= 10) return 'pequeno';
  if (p <= 15) return 'mediano';
  if (p <= 30) return 'grande';
  return 'gigante';
}
