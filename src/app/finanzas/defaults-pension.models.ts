import { precioDiaPensionEfectivo } from '../pension/pension-tarifas.util';

/** Defaults de precio/costo pensión por tamaño — spec 022 + 089 (incl. gigante). */
export type TamanoMascotaPensionDefault = 'pequeno' | 'mediano' | 'grande' | 'gigante';

export interface DefaultPensionTamano {
  precioDia: number;
  costoDia?: number;
  plantillaCostoId?: string;
  /** Opt-in: producto de comida sugerido al cobrar. */
  productoComidaId?: string;
  cantidadComidaPorDia?: number;
}

export interface DefaultsPensionPorTamano {
  pequeno: DefaultPensionTamano;
  mediano: DefaultPensionTamano;
  grande: DefaultPensionTamano;
  gigante: DefaultPensionTamano;
  updatedAt?: string;
  updatedBy?: string;
}

export const TAMANO_PENSION_DEFAULT_LABELS: Record<TamanoMascotaPensionDefault, string> = {
  pequeno: 'Pequeño (0–10 kg)',
  mediano: 'Mediano (10.1–15 kg)',
  grande: 'Grande (15.1–30 kg)',
  gigante: 'Gigante (>30 kg)',
};

export const TAMANOS_PENSION_ORDEN: TamanoMascotaPensionDefault[] = ['pequeno', 'mediano', 'grande', 'gigante'];

/** Fallback en memoria con tarifas oficiales (089) si RTDB vacío. */
export function emptyDefaultsPension(): DefaultsPensionPorTamano {
  return {
    pequeno: { precioDia: precioDiaPensionEfectivo('pequeno', 0) },
    mediano: { precioDia: precioDiaPensionEfectivo('mediano', 0) },
    grande: { precioDia: precioDiaPensionEfectivo('grande', 0) },
    gigante: { precioDia: precioDiaPensionEfectivo('gigante', 0) },
  };
}
