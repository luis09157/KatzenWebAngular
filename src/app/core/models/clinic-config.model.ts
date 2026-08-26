/** Configuración clínica aditiva (RTDB `Katzen/Config/*`). Spec 030. */
export interface InversionMetaConfig {
  montoMeta?: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface InversionMetaProgress {
  montoMeta: number;
  gananciaAcumulada: number;
  porcentaje: number;
  faltante: number;
  configurada: boolean;
}
