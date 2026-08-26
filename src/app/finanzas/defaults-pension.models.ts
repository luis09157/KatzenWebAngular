/** Defaults de precio/costo pensión por tamaño — spec 022 Fase B. */
export type TamanoMascotaPensionDefault = 'pequeno' | 'mediano' | 'grande';

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
  updatedAt?: string;
  updatedBy?: string;
}

export const TAMANO_PENSION_DEFAULT_LABELS: Record<TamanoMascotaPensionDefault, string> = {
  pequeno: 'Pequeño',
  mediano: 'Mediano',
  grande: 'Grande'
};

export const TAMANOS_PENSION_ORDEN: TamanoMascotaPensionDefault[] = [
  'pequeno',
  'mediano',
  'grande'
];

export function emptyDefaultsPension(): DefaultsPensionPorTamano {
  return {
    pequeno: { precioDia: 0 },
    mediano: { precioDia: 0 },
    grande: { precioDia: 0 }
  };
}
