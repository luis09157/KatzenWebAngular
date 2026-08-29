/**
 * Spec 053 ola 1 — modelos del motor de desparasitación.
 * Todo default es sugerencia; el veterinario confirma o edita.
 */

export type TipoDesparasitacion = 'interna' | 'externa' | 'ambas';

export type CodigoEsquemaDesparasitacion =
  | 'cachorro_serie_14'
  | 'juvenil_30'
  | 'adulto_interna_90'
  | 'adulto_externa_30'
  | 'adulto_ambas_30'
  | 'exotico_manual'
  | 'sin_esquema'
  | 'manual';

export interface HintDesparasitacion {
  key: string;
  message: string;
  severity: 'info' | 'warn';
}

export interface SugerirDesparasitacionInput {
  especie?: string | null;
  edadTexto?: string | number | null;
  edadSemanas?: number | null;
  tipo: TipoDesparasitacion;
  fechaAplicacion?: Date | string | null;
  estadoPaciente?: string | null;
}

export interface SugerenciaDesparasitacion {
  puedeSugerir: boolean;
  esquemaCodigo: CodigoEsquemaDesparasitacion;
  tipo: TipoDesparasitacion;
  especieNormalizada: string;
  intervaloSugeridoDias: number | null;
  proximaSugerida: Date | null;
  presetsIntervaloDias: number[];
  fuenteCorta: string;
  mensajeSinEsquema?: string;
  hints: HintDesparasitacion[];
}

export interface ConfirmacionDesparasitacionResultado {
  agendar: boolean;
  fecha: Date | null;
  hora: string;
  intervaloDias: number | null;
  intervaloSugeridoDias: number | null;
  proximaSugerida: string | null;
  esquemaCodigo: CodigoEsquemaDesparasitacion;
  tipoDesparasitacion: TipoDesparasitacion;
  hintsMostrados: string[];
}
