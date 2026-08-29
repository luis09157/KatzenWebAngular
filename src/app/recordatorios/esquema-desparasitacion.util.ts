/**
 * Spec 053 ola 1 — motor puro de desparasitación (sin Firebase).
 * Defaults de referencia; el vet siempre confirma.
 */

import {
  addDaysLocal,
  esPacienteFallecido,
  normalizarEspecie,
  parseEdadASemanas
} from '../vacunas/esquema-vacuna.util';
import { parseFechaFlexible } from '../vacunas/vacuna-recordatorio.util';
import {
  DISCLAIMER_DESPARASITACION,
  EDAD_CACHORRO_MAX_SEM,
  EDAD_JUVENIL_MAX_SEM,
  FUENTE_CORTA_DEFAULT,
  FUENTE_CORTA_EXOTICO,
  HINT_AMBAS,
  HINT_CACHORRO,
  HINT_DISCLAIMER,
  HINT_EXOTICO,
  HINT_FALLECIDO,
  HINT_PRODUCTO,
  HINT_SIN_ESQUEMA,
  INTERVALO_ADULTO_EXTERNA_DIAS,
  INTERVALO_ADULTO_INTERNA_DIAS,
  INTERVALO_CACHORRO_SERIE_DIAS,
  INTERVALO_EXOTICO_DEFAULT_DIAS,
  INTERVALO_JUVENIL_DIAS,
  MENSAJE_SIN_ESQUEMA
} from './esquema-desparasitacion.defaults';
import {
  CodigoEsquemaDesparasitacion,
  HintDesparasitacion,
  SugerenciaDesparasitacion,
  SugerirDesparasitacionInput,
  TipoDesparasitacion
} from './esquema-desparasitacion.models';

export { DISCLAIMER_DESPARASITACION, MENSAJE_SIN_ESQUEMA };

export function normalizarTipoDesparasitacion(
  value?: string | null
): TipoDesparasitacion {
  const v = String(value || '')
    .trim()
    .toLowerCase();
  if (v === 'externa' || v === 'externo' || v === 'pulgas') return 'externa';
  if (v === 'ambas' || v === 'ambos' || v === 'interna_externa') return 'ambas';
  return 'interna';
}

export function sugerirEsquemaDesparasitacion(
  input: SugerirDesparasitacionInput
): SugerenciaDesparasitacion {
  const tipo = normalizarTipoDesparasitacion(input.tipo);
  const especie = normalizarEspecie(input.especie);
  const fallecido = esPacienteFallecido(input.estadoPaciente);
  const semanas = input.edadSemanas ?? parseEdadASemanas(input.edadTexto ?? null);
  const base = parseFechaFlexible(input.fechaAplicacion) || new Date();
  const hints: HintDesparasitacion[] = [HINT_DISCLAIMER, HINT_PRODUCTO];

  if (fallecido) {
    hints.push(HINT_FALLECIDO);
  }

  if (especie === 'AVE' || especie === 'REPTIL' || especie === 'OTRO') {
    return {
      puedeSugerir: false,
      esquemaCodigo: 'sin_esquema',
      tipo,
      especieNormalizada: especie,
      intervaloSugeridoDias: null,
      proximaSugerida: null,
      presetsIntervaloDias: [30, 90, 365],
      fuenteCorta: FUENTE_CORTA_EXOTICO,
      mensajeSinEsquema: MENSAJE_SIN_ESQUEMA,
      hints: [...hints, HINT_SIN_ESQUEMA]
    };
  }

  if (especie === 'CONEJO' || especie === 'HURON') {
    const intervalo = INTERVALO_EXOTICO_DEFAULT_DIAS;
    return {
      puedeSugerir: false,
      esquemaCodigo: 'exotico_manual',
      tipo,
      especieNormalizada: especie,
      intervaloSugeridoDias: intervalo,
      proximaSugerida: addDaysLocal(base, intervalo),
      presetsIntervaloDias: [30, 90, 365],
      fuenteCorta: FUENTE_CORTA_EXOTICO,
      mensajeSinEsquema:
        'Sin esquema automático (no copiamos perro/gato). Si agendás, un intervalo típico es 90 días.',
      hints: [...hints, HINT_EXOTICO]
    };
  }

  let intervalo = INTERVALO_ADULTO_INTERNA_DIAS;
  let codigo: CodigoEsquemaDesparasitacion = 'adulto_interna_90';

  if (semanas != null && semanas < EDAD_CACHORRO_MAX_SEM) {
    intervalo = INTERVALO_CACHORRO_SERIE_DIAS;
    codigo = 'cachorro_serie_14';
    hints.push(HINT_CACHORRO);
  } else if (semanas != null && semanas < EDAD_JUVENIL_MAX_SEM) {
    intervalo = INTERVALO_JUVENIL_DIAS;
    codigo = 'juvenil_30';
  } else if (tipo === 'externa') {
    intervalo = INTERVALO_ADULTO_EXTERNA_DIAS;
    codigo = 'adulto_externa_30';
  } else if (tipo === 'ambas') {
    intervalo = INTERVALO_ADULTO_EXTERNA_DIAS;
    codigo = 'adulto_ambas_30';
    hints.push(HINT_AMBAS);
  } else {
    intervalo = INTERVALO_ADULTO_INTERNA_DIAS;
    codigo = 'adulto_interna_90';
  }

  const presets =
    codigo === 'cachorro_serie_14' ? [14, 21, 30] : [30, 90, 365];

  return {
    puedeSugerir: !fallecido,
    esquemaCodigo: codigo,
    tipo,
    especieNormalizada: especie,
    intervaloSugeridoDias: intervalo,
    proximaSugerida: fallecido ? null : addDaysLocal(base, intervalo),
    presetsIntervaloDias: presets,
    fuenteCorta: FUENTE_CORTA_DEFAULT,
    hints
  };
}
