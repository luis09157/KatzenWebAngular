/**
 * Spec 052 ola 1 — motor puro de esquemas (sin Firebase).
 * Defaults de PROTOCOLOS.md; el vet siempre confirma.
 */

import { parseFechaFlexible } from './vacuna-recordatorio.util';
import {
  CORE_MLV_ADULTO_DEFAULT_DIAS,
  DISCLAIMER_ESQUEMA,
  EDAD_CIERRE_SERIE_SEM,
  EDAD_MIN_RABIA_CLINICA_SEM,
  FVRCP_REFUERZO_ALT_WSAVA_DIAS,
  FVRCP_REFUERZO_DEFAULT_DIAS,
  FUENTE_CORTA_DEFAULT,
  FUENTE_CORTA_FVRCP,
  FUENTE_CORTA_LEPTO,
  FUENTE_CORTA_RABIA,
  HINT_CONEJO_MX,
  HINT_CONFIRMA_EDAD,
  HINT_DISCLAIMER,
  HINT_ENFERMO,
  HINT_FALLECIDO,
  HINT_FELV_INDOOR,
  HINT_FELV_TEST,
  HINT_GESTACION,
  HINT_GIARDIA_CCOV,
  HINT_HURON_COMBO,
  HINT_HURON_RABIA,
  HINT_HURON_SIN_ESQUEMA,
  HINT_INTERVALO_CORTO,
  HINT_LEPTO_COMBO,
  HINT_MDA,
  HINT_RABIA_12SEM,
  HINT_RABIA_NOM,
  HINT_SERIE_3_DOSIS,
  HINT_SIN_ESQUEMA_EXOTICO,
  INTERVALO_MINIMO_DIAS_MLV_CORE,
  INTERVALO_SERIE_DEFAULT_DIAS,
  INTERVALO_TRIENAL_DIAS,
  LEPTO_INTERVALO_ADULTO_DIAS,
  MENSAJE_CONEJO_MANUAL,
  MENSAJE_SIN_ESQUEMA,
  RABIA_INTERVALO_DEFAULT_DIAS,
  CONEJO_INTERVALO_DEFAULT_DIAS,
  FUENTE_CORTA_CONEJO,
  FUENTE_CORTA_HURON,
  esComboCanino,
  fusionarSemanticaTipo
} from './esquema-vacuna.defaults';
import {
  ConteoRefuerzosClinicos,
  EspecieEsquema,
  EtapaEsquema,
  EtapaPaciente,
  HintEsquema,
  SemanticaTipoVacuna,
  SugerenciaEsquema,
  SugerirEsquemaInput
} from './esquema-vacuna.models';

export { DISCLAIMER_ESQUEMA, MENSAJE_CONEJO_MANUAL, MENSAJE_SIN_ESQUEMA };

export function normalizarEspecie(especie?: string | null): EspecieEsquema {
  const e = String(especie || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (!e) return 'OTRO';
  if (e.includes('huron') || e.includes('ferret') || e.includes('mustela')) return 'HURON';
  if (e.includes('canino') || e.includes('perro') || e.includes('dog')) return 'CANINO';
  if (e.includes('felino') || e.includes('gato') || e.includes('cat')) return 'FELINO';
  if (e.includes('conejo') || e.includes('rabbit') || e.includes('lagomorfo')) return 'CONEJO';
  if (e.includes('ave') || e.includes('bird')) return 'AVE';
  if (e.includes('reptil') || e.includes('reptile')) return 'REPTIL';
  return 'OTRO';
}

export function esPacienteFallecido(estado?: string | null): boolean {
  return String(estado || '').trim().toLowerCase() === 'fallecido';
}

/**
 * Parseo best-effort de edad libre (`8 semanas`, `3 meses`, `2 años`, `3`).
 * Número suelto se interpreta como años (legado de la ficha).
 */
export function parseEdadASemanas(edadTexto?: string | number | null): number | null {
  if (edadTexto == null || edadTexto === '') return null;
  if (typeof edadTexto === 'number') {
    if (!Number.isFinite(edadTexto) || edadTexto < 0) return null;
    return Math.round(edadTexto * 52);
  }

  const raw = String(edadTexto).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!raw) return null;

  const num = raw.replace(',', '.').match(/(\d+(?:\.\d+)?)/);
  if (!num) return null;
  const n = Number(num[1]);
  if (!Number.isFinite(n) || n < 0) return null;

  if (/sem/.test(raw)) return Math.round(n);
  if (/mes/.test(raw)) return Math.round(n * 4.345);
  if (/anio|ano|year/.test(raw)) return Math.round(n * 52);
  // Legado: cifra suelta = años
  return Math.round(n * 52);
}

export function inferirEtapaPaciente(
  semanas: number | null,
  etapaExplicit?: SugerirEsquemaInput['etapa'],
  tipoVacuna?: string | null
): EtapaPaciente {
  if (etapaExplicit === 'adulto') return 'adulto';
  if (etapaExplicit === 'cachorro' || etapaExplicit === 'gatito') return 'cachorro';
  if (semanas != null) return semanas < 52 ? 'cachorro' : 'adulto';
  const v = String(tipoVacuna || '').toLowerCase();
  if (v === 'puppy') return 'cachorro';
  return 'adulto';
}

export function addDaysLocal(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

export function esIntervaloCortoCore(
  intervaloDias: number | null | undefined,
  semantica: Pick<SemanticaTipoVacuna, 'categoria' | 'codigo'>
): boolean {
  const n = Number(intervaloDias);
  if (!Number.isFinite(n) || n <= 0) return false;
  const core =
    semantica.categoria === 'core' ||
    semantica.codigo === 'core_mlv_canino' ||
    semantica.codigo === 'core_fvrcp';
  return core && n < INTERVALO_MINIMO_DIAS_MLV_CORE;
}

export function neverSuggestsSevenDayCore(intervalo: number | null): boolean {
  return intervalo !== 7;
}

function hintsClinicosBase(): HintEsquema[] {
  return [HINT_DISCLAIMER, HINT_ENFERMO, HINT_GESTACION];
}

function vacioSinEsquema(
  _input: SugerirEsquemaInput,
  especie: EspecieEsquema,
  semantica: SemanticaTipoVacuna,
  extraHints: HintEsquema[],
  etapaEsquema: EtapaEsquema,
  fuente = FUENTE_CORTA_DEFAULT,
  mensaje = MENSAJE_SIN_ESQUEMA,
  presets: number[] = []
): SugerenciaEsquema {
  return {
    puedeSugerir: false,
    esquemaCodigo: semantica.codigo === 'manual' ? 'sin_esquema' : semantica.codigo,
    etapaEsquema,
    categoria: semantica.categoria,
    intervaloSugeridoDias: null,
    proximaSugerida: null,
    fuenteCorta: fuente,
    mensajeSinEsquema: mensaje,
    hints: extraHints,
    nuncaTrienal: semantica.nuncaTrienal,
    presetsIntervaloDias: presets,
    especieNormalizada: especie
  };
}

function conIntervalo(
  especie: EspecieEsquema,
  semantica: SemanticaTipoVacuna,
  dias: number,
  fechaAplicacion: Date | null,
  etapaEsquema: EtapaEsquema,
  hints: HintEsquema[],
  fuente: string,
  presets: number[] = []
): SugerenciaEsquema {
  const intervalo = dias;
  return {
    puedeSugerir: true,
    esquemaCodigo: semantica.codigo,
    etapaEsquema,
    categoria: semantica.categoria,
    intervaloSugeridoDias: intervalo,
    proximaSugerida: fechaAplicacion ? addDaysLocal(fechaAplicacion, intervalo) : null,
    fuenteCorta: fuente,
    mensajeSinEsquema: null,
    hints,
    nuncaTrienal: semantica.nuncaTrienal,
    presetsIntervaloDias: presets,
    especieNormalizada: especie
  };
}

export function sugerirEsquema(input: SugerirEsquemaInput): SugerenciaEsquema {
  const especie = normalizarEspecie(input.especie);
  const tipoValue = input.tipoVacuna || input.tipo?.value || '';
  const semantica = fusionarSemanticaTipo(tipoValue, input.tipo);
  const semanas = input.edadSemanas ?? parseEdadASemanas(input.edadTexto ?? null);
  const etapa = inferirEtapaPaciente(semanas, input.etapa, tipoValue);
  const fechaBase = parseFechaFlexible(input.fechaAplicacion) || null;
  const hints = hintsClinicosBase();
  const edadIncierta = semanas == null && !input.etapa;

  if (edadIncierta) {
    hints.push(HINT_CONFIRMA_EDAD);
  }

  if (esPacienteFallecido(input.estadoPaciente)) {
    hints.push(HINT_FALLECIDO);
    return vacioSinEsquema(input, especie, semantica, hints, 'sin_esquema');
  }

  if (especie === 'AVE' || especie === 'REPTIL' || especie === 'OTRO') {
    hints.push(HINT_SIN_ESQUEMA_EXOTICO);
    return vacioSinEsquema(
      input,
      especie,
      { ...semantica, codigo: 'sin_esquema' },
      hints,
      'sin_esquema'
    );
  }

  if (especie === 'HURON') {
    if (esComboCanino(tipoValue) || semantica.codigo === 'core_mlv_canino') {
      hints.push(HINT_HURON_COMBO);
      return vacioSinEsquema(
        input,
        especie,
        { ...semantica, codigo: 'sin_esquema' },
        hints,
        'sin_esquema',
        FUENTE_CORTA_HURON,
        MENSAJE_SIN_ESQUEMA
      );
    }
    if (semantica.codigo === 'rabia_mx') {
      hints.push(HINT_HURON_RABIA);
      hints.push(HINT_RABIA_NOM);
      if (semanas != null && semanas < EDAD_MIN_RABIA_CLINICA_SEM) {
        hints.push(HINT_RABIA_12SEM);
      }
      return conIntervalo(
        especie,
        semantica,
        RABIA_INTERVALO_DEFAULT_DIAS,
        fechaBase,
        'adulto',
        hints,
        FUENTE_CORTA_HURON,
        [RABIA_INTERVALO_DEFAULT_DIAS]
      );
    }
    hints.push(HINT_HURON_SIN_ESQUEMA);
    return vacioSinEsquema(
      input,
      especie,
      { ...semantica, codigo: 'sin_esquema' },
      hints,
      'sin_esquema',
      FUENTE_CORTA_HURON,
      MENSAJE_SIN_ESQUEMA
    );
  }

  if (especie === 'CONEJO') {
    hints.push(HINT_CONEJO_MX);
    return vacioSinEsquema(
      input,
      especie,
      { ...semantica, codigo: 'conejo_manual' },
      hints,
      'manual',
      FUENTE_CORTA_CONEJO,
      MENSAJE_CONEJO_MANUAL,
      [CONEJO_INTERVALO_DEFAULT_DIAS]
    );
  }

  if (semantica.codigo === 'no_recomendada') {
    hints.push(HINT_GIARDIA_CCOV);
    return vacioSinEsquema(
      input,
      especie,
      semantica,
      hints,
      'sin_esquema',
      FUENTE_CORTA_DEFAULT,
      MENSAJE_SIN_ESQUEMA
    );
  }

  if (semantica.codigo === 'manual') {
    return vacioSinEsquema(input, especie, semantica, hints, 'manual');
  }

  if (semantica.codigo === 'rabia_mx') {
    hints.push(HINT_RABIA_NOM);
    if (semanas != null && semanas < EDAD_MIN_RABIA_CLINICA_SEM) {
      hints.push(HINT_RABIA_12SEM);
    }
    return conIntervalo(
      especie,
      semantica,
      RABIA_INTERVALO_DEFAULT_DIAS,
      fechaBase,
      'adulto',
      hints,
      FUENTE_CORTA_RABIA,
      [RABIA_INTERVALO_DEFAULT_DIAS]
    );
  }

  if (semantica.codigo === 'lepto') {
    const dias =
      etapa === 'adulto' ? LEPTO_INTERVALO_ADULTO_DIAS : INTERVALO_SERIE_DEFAULT_DIAS;
    const etapaEsquema: EtapaEsquema = etapa === 'adulto' ? 'adulto' : 'serie';
    return conIntervalo(
      especie,
      semantica,
      dias,
      fechaBase,
      etapaEsquema,
      hints,
      FUENTE_CORTA_LEPTO,
      [dias]
    );
  }

  if (semantica.codigo === 'felv') {
    hints.push(HINT_FELV_TEST);
    const adulto = etapa === 'adulto';
    if (adulto) {
      hints.push(HINT_FELV_INDOOR);
      return vacioSinEsquema(
        input,
        especie,
        semantica,
        hints,
        'adulto',
        FUENTE_CORTA_DEFAULT,
        'FeLV en adulto indoor no se auto-agenda. Indica intervalo o no agendar.'
      );
    }
    return conIntervalo(
      especie,
      semantica,
      INTERVALO_SERIE_DEFAULT_DIAS,
      fechaBase,
      'serie',
      hints,
      FUENTE_CORTA_DEFAULT
    );
  }

  if (semantica.codigo === 'bordetella' || semantica.codigo === 'civ') {
    if (semantica.codigo === 'civ') {
      hints.push({
        key: 'civ_mx',
        severity: 'info',
        message: 'Influenza canina: confirma disponibilidad con tu proveedor local (WSAVA: principalmente EE.UU.).'
      });
    }
    const dias = semantica.codigo === 'bordetella'
      ? 365
      : (etapa === 'adulto' ? 365 : INTERVALO_SERIE_DEFAULT_DIAS);
    return conIntervalo(
      especie,
      semantica,
      dias,
      fechaBase,
      etapa === 'adulto' || semantica.codigo === 'bordetella' ? 'adulto' : 'serie',
      hints,
      FUENTE_CORTA_DEFAULT
    );
  }

  if (semantica.codigo === 'core_fvrcp') {
    hints.push(HINT_MDA);
    const enSerie = etapa === 'cachorro' && (semanas == null || semanas < EDAD_CIERRE_SERIE_SEM);
    if (enSerie) {
      hints.push(HINT_SERIE_3_DOSIS);
      return conIntervalo(
        especie,
        semantica,
        INTERVALO_SERIE_DEFAULT_DIAS,
        fechaBase,
        semanas != null && semanas < EDAD_CIERRE_SERIE_SEM ? 'serie' : 'serie_inicio',
        hints,
        FUENTE_CORTA_FVRCP,
        [INTERVALO_SERIE_DEFAULT_DIAS]
      );
    }
    const cierre = semanas != null && semanas >= EDAD_CIERRE_SERIE_SEM && semanas < 52;
    return conIntervalo(
      especie,
      semantica,
      FVRCP_REFUERZO_DEFAULT_DIAS,
      fechaBase,
      cierre ? 'cierre_16sem' : 'adulto',
      hints,
      FUENTE_CORTA_FVRCP,
      [FVRCP_REFUERZO_DEFAULT_DIAS, FVRCP_REFUERZO_ALT_WSAVA_DIAS]
    );
  }

  if (semantica.codigo === 'core_mlv_canino') {
    hints.push(HINT_MDA);
    if (semantica.incluyeLepto) {
      hints.push(HINT_LEPTO_COMBO);
    }
    const enSerie = etapa === 'cachorro' && (semanas == null || semanas < EDAD_CIERRE_SERIE_SEM);
    if (enSerie) {
      hints.push(HINT_SERIE_3_DOSIS);
      const etapaEsquema: EtapaEsquema =
        semanas == null || semanas <= 8 ? 'serie_inicio' : 'serie';
      return conIntervalo(
        especie,
        semantica,
        INTERVALO_SERIE_DEFAULT_DIAS,
        fechaBase,
        etapaEsquema,
        hints,
        FUENTE_CORTA_DEFAULT,
        [INTERVALO_SERIE_DEFAULT_DIAS]
      );
    }
    const cierre = semanas != null && semanas >= EDAD_CIERRE_SERIE_SEM && semanas < 52;
    const adultoDias = semantica.incluyeLepto
      ? LEPTO_INTERVALO_ADULTO_DIAS
      : CORE_MLV_ADULTO_DEFAULT_DIAS;
    return conIntervalo(
      especie,
      semantica,
      adultoDias,
      fechaBase,
      cierre ? 'cierre_16sem' : 'adulto',
      hints,
      semantica.incluyeLepto ? FUENTE_CORTA_LEPTO : FUENTE_CORTA_DEFAULT,
      [adultoDias]
    );
  }

  return vacioSinEsquema(input, especie, semantica, hints, 'manual');
}

export function hintIntervaloCortoSiAplica(
  intervaloDias: number | null | undefined,
  semantica: SemanticaTipoVacuna
): HintEsquema | null {
  return esIntervaloCortoCore(intervaloDias, semantica) ? HINT_INTERVALO_CORTO : null;
}

/**
 * Intervalo inicial del diálogo de confirmación.
 * No hereda los 21 días de serie canina cuando la especie no tiene esquema mamífero.
 */
export function resolverIntervaloConfirmacion(input: {
  especie?: string | null;
  intervaloActual?: number | null;
  intervaloSugeridoDias?: number | null;
  puedeSugerir?: boolean;
}): number | null {
  const especie = normalizarEspecie(input.especie);
  const actual = Number(input.intervaloActual);
  const sugerido = Number(input.intervaloSugeridoDias);
  const actualValido = Number.isFinite(actual) && actual > 0;
  const sugeridoValido = Number.isFinite(sugerido) && sugerido > 0;
  const residualSerieCanina =
    actualValido &&
    actual === INTERVALO_SERIE_DEFAULT_DIAS &&
    input.puedeSugerir === false &&
    (especie === 'CONEJO' ||
      especie === 'HURON' ||
      especie === 'AVE' ||
      especie === 'REPTIL' ||
      especie === 'OTRO');

  if (residualSerieCanina) {
    return null;
  }
  if (actualValido) return actual;
  if (sugeridoValido) return sugerido;
  return null;
}

export function esProximaResidualSerieCanina(input: {
  especie?: string | null;
  intervaloActual?: number | null;
  puedeSugerir?: boolean;
}): boolean {
  return resolverIntervaloConfirmacion(input) == null
    && Number(input.intervaloActual) === INTERVALO_SERIE_DEFAULT_DIAS
    && input.puedeSugerir === false;
}

/** Start of local week (Monday). */
export function inicioSemanaLunes(ref: Date): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const day = d.getDay(); // 0 Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseProximaVacuna(v: {
  proximaAplicacion?: string | Date | null;
  proxima_dosis?: string | Date | null;
  proxima_aplicacion?: string | Date | null;
}): Date | null {
  return (
    parseFechaFlexible(v.proximaAplicacion) ||
    parseFechaFlexible(v.proxima_aplicacion) ||
    parseFechaFlexible(v.proxima_dosis)
  );
}

export function contarRefuerzosClinicos(
  vacunas: Array<{
    activo?: boolean | number;
    proximaAplicacion?: string | Date | null;
    proxima_dosis?: string | Date | null;
    proxima_aplicacion?: string | Date | null;
  }>,
  ahora: Date = new Date()
): ConteoRefuerzosClinicos {
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const weekStart = inicioSemanaLunes(ahora);
  const weekEnd = addDaysLocal(weekStart, 7);

  let estaSemana = 0;
  let vencidas = 0;

  for (const v of vacunas || []) {
    if (v.activo === false || v.activo === 0) continue;
    const prox = parseProximaVacuna(v);
    if (!prox) continue;
    const day = new Date(prox.getFullYear(), prox.getMonth(), prox.getDate());
    if (day < hoy) {
      vencidas++;
    } else if (day >= weekStart && day < weekEnd) {
      estaSemana++;
    }
  }

  return { estaSemana, vencidas };
}

export function horaDefaultRecordatorio(): string {
  return '09:00';
}

/** Extrae HH:mm de un Date o string RTDB. */
export function extraerHoraHhMm(value?: Date | string | null): string {
  const d = parseFechaFlexible(value);
  if (!d) return horaDefaultRecordatorio();
  if (d.getHours() === 0 && d.getMinutes() === 0) return horaDefaultRecordatorio();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function aplicarHoraAFecha(fecha: Date, horaHhMm: string): Date {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(horaHhMm || '').trim());
  const out = new Date(fecha.getTime());
  if (!m) {
    out.setHours(9, 0, 0, 0);
    return out;
  }
  out.setHours(Number(m[1]), Number(m[2]), 0, 0);
  return out;
}

export function assertNuncaTrienalRabia(intervalo: number | null): boolean {
  return intervalo !== INTERVALO_TRIENAL_DIAS;
}
