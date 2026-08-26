/** Defaults de costo/precio baño por tamaño — spec 022 Fase A. */
export type TamanoPerroBanio = 'pequeno' | 'mediano' | 'grande';

export interface DefaultBanioTamano {
  costoDefault: number;
  precioSugerido?: number;
  plantillaCostoId?: string;
}

export interface DefaultsBanioPorTamano {
  pequeno: DefaultBanioTamano;
  mediano: DefaultBanioTamano;
  grande: DefaultBanioTamano;
  updatedAt?: string;
  updatedBy?: string;
}

export const TAMANO_PERRO_LABELS: Record<TamanoPerroBanio, string> = {
  pequeno: 'Pequeño',
  mediano: 'Mediano',
  grande: 'Grande'
};

export const TAMANOS_PERRO_ORDEN: TamanoPerroBanio[] = ['pequeno', 'mediano', 'grande'];

export function emptyDefaultsBanio(): DefaultsBanioPorTamano {
  return {
    pequeno: { costoDefault: 0 },
    mediano: { costoDefault: 0 },
    grande: { costoDefault: 0 }
  };
}
