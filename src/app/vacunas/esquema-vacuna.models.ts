/**
 * Spec 052 ola 1 — modelos del motor de esquemas de vacunación.
 * Todo default es sugerencia; el veterinario confirma o edita.
 */

export type EspecieEsquema = 'CANINO' | 'FELINO' | 'CONEJO' | 'AVE' | 'REPTIL' | 'OTRO';

export type CategoriaVacuna =
  | 'core'
  | 'non_core'
  | 'legal_mx'
  | 'no_recomendada'
  | 'otra';

export type EtapaEsquema =
  | 'serie_inicio'
  | 'serie'
  | 'cierre_16sem'
  | 'refuerzo_6m'
  | 'adulto'
  | 'manual'
  | 'sin_esquema';

export type EtapaPaciente = 'cachorro' | 'adulto';

export type CodigoEsquema =
  | 'core_mlv_canino'
  | 'core_fvrcp'
  | 'rabia_mx'
  | 'lepto'
  | 'felv'
  | 'bordetella'
  | 'civ'
  | 'no_recomendada'
  | 'conejo_manual'
  | 'sin_esquema'
  | 'manual';

export interface TipoVacunaSemantico {
  value: string;
  label: string;
  activo?: boolean;
  especies?: EspecieEsquema[];
  categoria?: CategoriaVacuna;
  nuncaTrienal?: boolean;
  dosisInicio?: number;
  intervaloSerieDias?: number;
  intervaloMinimoDias?: number;
  edadMinimaSemanas?: number;
  edadCierreSerieSemanas?: number;
  intervaloAdultoDias?: number;
  hintKey?: string;
  disponibilidadNota?: string;
}

export interface SemanticaTipoVacuna {
  codigo: CodigoEsquema;
  categoria: CategoriaVacuna;
  nuncaTrienal: boolean;
  especies: EspecieEsquema[];
  dosisInicio?: number;
  intervaloSerieDias: number;
  intervaloMinimoDias: number;
  intervaloAdultoDias: number;
  edadCierreSerieSemanas: number;
  edadMinimaSemanas?: number;
  incluyeLepto: boolean;
}

export interface HintEsquema {
  key: string;
  message: string;
  severity: 'info' | 'warn';
}

export interface SugerirEsquemaInput {
  especie?: string | null;
  tipoVacuna?: string | null;
  tipo?: TipoVacunaSemantico | null;
  edadTexto?: string | null;
  edadSemanas?: number | null;
  etapa?: EtapaPaciente | 'gatito' | null;
  fechaAplicacion?: Date | string | null;
  indoorAdulto?: boolean;
  estadoPaciente?: string | null;
}

export interface SugerenciaEsquema {
  puedeSugerir: boolean;
  esquemaCodigo: CodigoEsquema;
  etapaEsquema: EtapaEsquema;
  categoria: CategoriaVacuna;
  intervaloSugeridoDias: number | null;
  proximaSugerida: Date | null;
  fuenteCorta: string;
  mensajeSinEsquema: string | null;
  hints: HintEsquema[];
  nuncaTrienal: boolean;
  presetsIntervaloDias: number[];
  especieNormalizada: EspecieEsquema;
}

export interface ConfirmacionEsquemaResultado {
  agendar: boolean;
  fecha?: Date | null;
  hora?: string | null;
  intervaloDias?: number | null;
  intervaloSugeridoDias?: number | null;
  proximaSugerida?: string | null;
  esquemaCodigo?: CodigoEsquema;
  etapaEsquema?: EtapaEsquema;
  hintsMostrados?: string[];
}

export interface ConteoRefuerzosClinicos {
  estaSemana: number;
  vencidas: number;
}
