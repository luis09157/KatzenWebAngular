/**
 * Tarifas de peluquería (2026-10-26): precio por tamaño × tipo de pelo × baño con corte, y gato.
 * RTDB: `Katzen/Finanzas/TarifasPeluqueria` (aditivo). Precio al público tal cual se cobra.
 * Antes solo había un «precio sugerido» por tamaño y el sistema sugería precios genéricos.
 */

export type FilaTarifaPeluqueria = 'pequeno' | 'mediano' | 'grande' | 'xl' | 'gato';
export type PeloMascota = 'corto' | 'largo';

export interface TarifaPeluqueriaFila {
  /** Baño, pelo corto. */
  corto?: number | null;
  /** Baño, pelo largo. */
  largo?: number | null;
  /** Baño con corte (perros). */
  conCorte?: number | null;
}

export interface TarifasPeluqueria {
  filas: Partial<Record<FilaTarifaPeluqueria, TarifaPeluqueriaFila>>;
  updatedAt?: string;
  updatedBy?: string;
}

export const FILAS_TARIFA_PELUQUERIA: FilaTarifaPeluqueria[] = ['pequeno', 'mediano', 'grande', 'xl', 'gato'];

export const FILA_TARIFA_PELUQUERIA_LABELS: Record<FilaTarifaPeluqueria, string> = {
  pequeno: 'Chico',
  mediano: 'Mediano',
  grande: 'Grande',
  xl: 'Extragrande',
  gato: 'Gato',
};

function positivo(n: unknown): number | null {
  if (n == null || n === '') return null;
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null;
}

export function tarifasPeluqueriaVacias(): TarifasPeluqueria {
  return { filas: {} };
}

/** Limpia lo que viene de RTDB o del formulario: solo números > 0. */
export function normalizarTarifasPeluqueria(raw: unknown): TarifasPeluqueria {
  const filasRaw = ((raw as TarifasPeluqueria | null)?.filas || {}) as Record<string, TarifaPeluqueriaFila>;
  const filas: TarifasPeluqueria['filas'] = {};
  for (const f of FILAS_TARIFA_PELUQUERIA) {
    const r = filasRaw[f];
    if (!r) continue;
    const fila: TarifaPeluqueriaFila = {};
    const corto = positivo(r.corto);
    const largo = positivo(r.largo);
    const conCorte = f === 'gato' ? null : positivo(r.conCorte);
    if (corto != null) fila.corto = corto;
    if (largo != null) fila.largo = largo;
    if (conCorte != null) fila.conCorte = conCorte;
    if (Object.keys(fila).length) filas[f] = fila;
  }
  const out: TarifasPeluqueria = { filas };
  const t = raw as TarifasPeluqueria | null;
  if (t?.updatedAt) out.updatedAt = t.updatedAt;
  if (t?.updatedBy) out.updatedBy = t.updatedBy;
  return out;
}

export function hayTarifasPeluqueria(t: TarifasPeluqueria | null | undefined): boolean {
  return Object.keys(t?.filas || {}).length > 0;
}

/** Gato si la especie lo dice; si no, el tamaño del perro. */
export function filaTarifaPara(
  tamano: string | null | undefined,
  especie: string | null | undefined
): FilaTarifaPeluqueria | null {
  const esp = String(especie || '').toLowerCase();
  if (/felin|gat|cat/.test(esp)) return 'gato';
  const t = String(tamano || '').toLowerCase();
  if (t === 'pequeno' || t === 'chico') return 'pequeno';
  if (t === 'mediano') return 'mediano';
  if (t === 'grande') return 'grande';
  if (t === 'xl' || t === 'gigante' || t === 'extra' || t === 'extragrande') return 'xl';
  return null;
}

/**
 * Precio de la tarifa para lo elegido en «Nuevo baño».
 * - «Baño» → pelo corto o largo.
 * - «Baño con corte» → columna con corte (gato no tiene).
 * - Otros servicios (uñas, rasurado, medicado, deslanado) → sin tarifa: se escribe a mano.
 */
export function precioTarifaPeluqueria(
  tarifas: TarifasPeluqueria | null | undefined,
  input: { fila: FilaTarifaPeluqueria | null; tipoServicio: string | null | undefined; pelo: PeloMascota | null | undefined }
): number | null {
  if (!input.fila) return null;
  const fila = tarifas?.filas?.[input.fila];
  if (!fila) return null;
  const tipo = String(input.tipoServicio || '');
  if (tipo === 'baño') {
    return positivo(input.pelo === 'largo' ? fila.largo : fila.corto);
  }
  if (tipo === 'baño_con_corte') {
    return positivo(fila.conCorte);
  }
  return null;
}
