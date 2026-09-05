/**
 * Spec 053 — defaults de intervalo (referencia CAPC/ESCCAP, no prescripción).
 * El vet confirma siempre.
 */

import { HintDesparasitacion, TipoDesparasitacion } from './esquema-desparasitacion.models';

export const INTERVALO_CACHORRO_SERIE_DIAS = 14;
export const INTERVALO_JUVENIL_DIAS = 30;
export const INTERVALO_ADULTO_INTERNA_DIAS = 90;
export const INTERVALO_ADULTO_EXTERNA_DIAS = 30;
export const INTERVALO_EXOTICO_DEFAULT_DIAS = 90;
export const EDAD_CACHORRO_MAX_SEM = 12;
export const EDAD_JUVENIL_MAX_SEM = 24;

export const FUENTE_CORTA_DEFAULT = 'Referencia CAPC/ESCCAP. El producto del lote y el criterio clínico mandan.';
export const FUENTE_CORTA_EXOTICO = 'Intervalo manual. No copiamos el calendario de perro/gato.';
export const MENSAJE_SIN_ESQUEMA = 'Sin esquema sugerido. Indica intervalo o no agendar.';
export const DISCLAIMER_DESPARASITACION =
  'Esto es una sugerencia de intervalo, no una receta. Confirma o cambia la fecha.';

export const TIPOS_DESPARASITACION: { value: TipoDesparasitacion; label: string }[] = [
  { value: 'interna', label: 'Interna (gastrointestinal)' },
  { value: 'externa', label: 'Externa (pulgas / garrapatas)' },
  { value: 'ambas', label: 'Ambas' },
];

export const HINT_DISCLAIMER: HintDesparasitacion = {
  key: 'disclaimer',
  severity: 'info',
  message: DISCLAIMER_DESPARASITACION,
};

export const HINT_CACHORRO: HintDesparasitacion = {
  key: 'cachorro_serie',
  severity: 'info',
  message: 'En cachorros/gatitos la serie típica es cada 2 semanas hasta ~12 semanas, luego mensual hasta los 6 meses.',
};

export const HINT_AMBAS: HintDesparasitacion = {
  key: 'ambas',
  severity: 'info',
  message:
    'Interna y externa suelen ir en calendarios distintos. Sugerimos 30 días (externa); ajusta si el interno es trimestral.',
};

export const HINT_FALLECIDO: HintDesparasitacion = {
  key: 'fallecido',
  severity: 'warn',
  message: 'Esta mascota está marcada como Fallecido: se registrará sin próxima dosis.',
};

export const HINT_EXOTICO: HintDesparasitacion = {
  key: 'exotico',
  severity: 'info',
  message: 'Conejo y hurón no heredan el esquema de perro. Intervalo 100 % manual.',
};

export const HINT_SIN_ESQUEMA: HintDesparasitacion = {
  key: 'sin_esquema',
  severity: 'info',
  message: MENSAJE_SIN_ESQUEMA,
};

export const HINT_PRODUCTO: HintDesparasitacion = {
  key: 'producto',
  severity: 'info',
  message: 'Revisa la etiqueta del desparasitante (isoxazolinas vs pipeta vs comprimido).',
};

export function etiquetaTipoDesparasitacion(tipo: TipoDesparasitacion): string {
  const found = TIPOS_DESPARASITACION.find((t) => t.value === tipo);
  return found?.label || tipo;
}

export function claseBadgeTipo(tipo: TipoDesparasitacion): string {
  if (tipo === 'interna') return 'estado-badge--info';
  if (tipo === 'externa') return 'estado-badge--pending';
  return 'estado-badge--success';
}
