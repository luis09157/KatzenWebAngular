/**
 * Spec 052 — constantes de PROTOCOLOS.md §8 y mapeo del catálogo legacy.
 *
 * Seed de flags en `Katzen/TiposVacunas` (documentación, NO script contra producción):
 * - No pisar tipos activos legacy (`puppy`, `quintuple`, `sextuple`, `triple_felina`, …).
 * - Si un tipo ya existe, solo añadir campos opcionales (`categoria`, `nuncaTrienal`, etc.)
 *   cuando falten. El fallback en cliente cubre clínicas sin catálogo RTDB.
 * - Ola 3: `mixomatosis` / `rhdv_rhdv2` / `otra_conejo` son catálogo de **registro**,
 *   no stock. Copy honesto MX (no fingir Nobivac PLUS / Filavac). No seed contra prod.
 */

import {
  CategoriaVacuna,
  EspecieEsquema,
  HintEsquema,
  SemanticaTipoVacuna,
  TipoVacunaSemantico
} from './esquema-vacuna.models';

export const INTERVALO_MINIMO_DIAS_MLV_CORE = 14;
export const INTERVALO_SERIE_DEFAULT_DIAS = 21;
export const EDAD_INICIO_CACHORRO_SEM = 6;
export const EDAD_CIERRE_SERIE_SEM = 16;
export const EDAD_CIERRE_ALTO_RIESGO_SEM = 20;
export const EDAD_MIN_RABIA_CLINICA_SEM = 12;
export const RABIA_INTERVALO_DEFAULT_DIAS = 365;
export const LEPTO_DOSIS_INICIO = 2;
export const LEPTO_INTERVALO_ADULTO_DIAS = 365;
export const FELV_DOSIS_INICIO = 2;
export const FVRCP_REFUERZO_DEFAULT_DIAS = 365;
export const FVRCP_REFUERZO_ALT_WSAVA_DIAS = 183;
export const CORE_MLV_ADULTO_DEFAULT_DIAS = 365;
export const CONEJO_INTERVALO_DEFAULT_DIAS = 365;
/** Nunca usar como default de rabia/lepto. Solo core MLV si el vet lo elige. */
export const INTERVALO_TRIENAL_DIAS = 1095;

export const FUENTE_CORTA_DEFAULT = 'WSAVA/AAHA; rabia NOM anual';
export const FUENTE_CORTA_RABIA = 'NOM-011 México: rabia anual. No copiar DOI 3 años de AAHA.';
export const FUENTE_CORTA_LEPTO = 'WSAVA/AAHA: leptospira 2 dosis + anual. Nunca trienal.';
export const FUENTE_CORTA_FVRCP = 'AAFP/WSAVA: FVRCP. Default clínica: 1 año (editable a 6 meses).';
export const FUENTE_CORTA_CONEJO =
  'Intervalo manual. MX: no asumir kits EU; VEHC-2 es de granja RHDV2.';
export const FUENTE_CORTA_HURON =
  'AFA: no combo canino. Rabia MX anual si el lote lista hurón.';
export const MENSAJE_SIN_ESQUEMA =
  'Sin esquema sugerido. Indica intervalo o no agendar.';
export const MENSAJE_CONEJO_MANUAL =
  'Sin esquema automático (no copiamos Nobivac PLUS ni Filavac). Intervalo manual: si agendás, un intervalo típico es 365 días.';
export const NOTA_DISPONIBILIDAD_CONEJO_MX =
  'No fingimos stock de Nobivac PLUS ni Filavac en México. VEHC-2-BIVE (PRONABIVE) es vacuna de granja RHDV2 (≥8 sem). Confirma el biológico local.';
export const VALORES_COMBO_CANINO = ['puppy', 'quintuple', 'sextuple', 'dhpp', 'dapp'];
export const VALORES_TIPO_CONEJO_OLA3 = ['mixomatosis', 'rhdv_rhdv2', 'otra_conejo'];

export const HINT_ENFERMO: HintEsquema = {
  key: 'enfermo',
  severity: 'warn',
  message:
    'No se recomienda vacunar un animal enfermo o con fiebre. Reprograma si el criterio clínico lo indica.'
};

export const HINT_GESTACION: HintEsquema = {
  key: 'gestacion',
  severity: 'warn',
  message:
    'Algunas vacunas MLV (p. ej. FPV) se evitan en gestación. Revisa etiqueta y criterio.'
};

export const HINT_MDA: HintEsquema = {
  key: 'mda',
  severity: 'info',
  message:
    'Los anticuerpos de la madre pueden anular dosis tempranas. La dosis de cierre debe ser a las 16 semanas o más.'
};

export const HINT_INTERVALO_CORTO: HintEsquema = {
  key: 'intervalo_corto',
  severity: 'warn',
  message:
    'El protocolo típico es 21–28 días, mínimo 14. No sugerimos 7 días entre dosis core.'
};

export const HINT_RABIA_NOM: HintEsquema = {
  key: 'rabia_nom',
  severity: 'info',
  message:
    'En México la rabia se refuerza cada año (NOM). La etiqueta puede citar DOI de 3 años; el default de Katzen es 365 días.'
};

export const HINT_RABIA_12SEM: HintEsquema = {
  key: 'rabia_12sem',
  severity: 'warn',
  message:
    'Etiqueta habitual en clínica privada: desde 12 semanas. Las campañas NOM pueden vacunar desde 1 mes con refuerzo a los 3.'
};

export const HINT_FELV_TEST: HintEsquema = {
  key: 'felv_test',
  severity: 'info',
  message: 'AAFP recomienda test de antígeno FeLV antes de vacunar. No bloqueamos el guardado.'
};

export const HINT_FELV_INDOOR: HintEsquema = {
  key: 'felv_indoor',
  severity: 'info',
  message:
    'FeLV en adulto indoor es decisión del vet. ¿Sale o convive con gatos de estatus desconocido?'
};

export const HINT_GIARDIA_CCOV: HintEsquema = {
  key: 'no_recomendada',
  severity: 'warn',
  message: 'WSAVA no recomienda esta vacuna de rutina. No sugerimos esquema; registra de forma manual si el criterio clínico lo indica.'
};

export const HINT_LEPTO_COMBO: HintEsquema = {
  key: 'lepto_combo',
  severity: 'info',
  message:
    'Si el vial incluye leptospira (séxtuple), el refuerzo de lepto sigue anual: el combo no hace trienal esa fracción.'
};

export const HINT_FALLECIDO: HintEsquema = {
  key: 'fallecido',
  severity: 'warn',
  message: 'La mascota está marcada como Fallecido. No se creará recordatorio de refuerzo.'
};

export const HINT_CONFIRMA_EDAD: HintEsquema = {
  key: 'confirma_edad',
  severity: 'info',
  message: 'No se pudo leer la edad con claridad. Confirma si es cachorro/gatito o adulto; la sugerencia puede ajustarse.'
};

export const HINT_CONEJO_MX: HintEsquema = {
  key: 'conejo_mx',
  severity: 'info',
  message:
    'Muchos biológicos de mixoma/RHD europeos (Nobivac PLUS, Filavac) pueden no estar en México. Confirma el producto con tu proveedor. VEHC-2-BIVE (PRONABIVE) es de granja RHDV2 (≥8 sem), no el esquema europeo de mascota. Si no hay biológico, registra «Otra» o no agendes.'
};

export const HINT_HURON_COMBO: HintEsquema = {
  key: 'huron_combo',
  severity: 'warn',
  message:
    'No uses el combo canino (DHPP/quíntuple/séxtuple) off-label sin criterio. Prefiere producto licenciado para hurón. Disponibilidad de Purevax en LATAM: confirma con tu proveedor.'
};

export const HINT_HURON_RABIA: HintEsquema = {
  key: 'huron_rabia',
  severity: 'info',
  message:
    'Nobivac Rabia en México lista hurón: refuerzo anual (etiqueta). No copies el DOI de 3 años del perro.'
};

export const HINT_HURON_SIN_ESQUEMA: HintEsquema = {
  key: 'huron_sin_esquema',
  severity: 'info',
  message:
    'Sin esquema sugerido para hurón. El moquillo (CDV) requiere producto adecuado, no el combo del perro. Confirma el biológico local.'
};

export const HINT_SIN_ESQUEMA_EXOTICO: HintEsquema = {
  key: 'sin_esquema_exotico',
  severity: 'info',
  message: MENSAJE_SIN_ESQUEMA
};

export function esComboCanino(value?: string | null): boolean {
  const v = String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return VALORES_COMBO_CANINO.includes(v);
}

export const HINT_SERIE_3_DOSIS: HintEsquema = {
  key: 'serie_3_dosis',
  severity: 'info',
  message:
    'En serie de cachorro (AAHA) se recomiendan al menos 3 dosis de core MLV hasta las 16 semanas o más.'
};

export const HINT_DISCLAIMER: HintEsquema = {
  key: 'disclaimer',
  severity: 'info',
  message:
    'Esta fecha es una sugerencia, no una receta. Mandan el criterio clínico y la etiqueta del lote.'
};

export const DISCLAIMER_ESQUEMA =
  'Sugerencia de intervalo según WSAVA/AAHA/AAFP y NOM mexicana de rabia. No es una receta ni sustituye la etiqueta del lote.';

function baseSemantica(
  partial: Partial<SemanticaTipoVacuna> & Pick<SemanticaTipoVacuna, 'codigo' | 'categoria'>
): SemanticaTipoVacuna {
  return {
    nuncaTrienal: false,
    especies: ['CANINO', 'FELINO'],
    intervaloSerieDias: INTERVALO_SERIE_DEFAULT_DIAS,
    intervaloMinimoDias: INTERVALO_MINIMO_DIAS_MLV_CORE,
    intervaloAdultoDias: CORE_MLV_ADULTO_DEFAULT_DIAS,
    edadCierreSerieSemanas: EDAD_CIERRE_SERIE_SEM,
    incluyeLepto: false,
    ...partial
  };
}

/** Tipos conejo ola 3: registro honesto, no stock de clínica. */
export const TIPOS_CONEJO_OLA3: TipoVacunaSemantico[] = [
  {
    value: 'mixomatosis',
    label: 'Mixomatosis',
    activo: true,
    especies: ['CONEJO'],
    categoria: 'otra',
    intervaloAdultoDias: CONEJO_INTERVALO_DEFAULT_DIAS,
    hintKey: 'conejo_mx',
    disponibilidadNota: NOTA_DISPONIBILIDAD_CONEJO_MX
  },
  {
    value: 'rhdv_rhdv2',
    label: 'RHDV / RHDV2',
    activo: true,
    especies: ['CONEJO'],
    categoria: 'otra',
    intervaloAdultoDias: CONEJO_INTERVALO_DEFAULT_DIAS,
    hintKey: 'conejo_mx',
    disponibilidadNota: NOTA_DISPONIBILIDAD_CONEJO_MX
  },
  {
    value: 'otra_conejo',
    label: 'Otra (conejo)',
    activo: true,
    especies: ['CONEJO'],
    categoria: 'otra',
    intervaloAdultoDias: CONEJO_INTERVALO_DEFAULT_DIAS,
    hintKey: 'conejo_mx',
    disponibilidadNota: NOTA_DISPONIBILIDAD_CONEJO_MX
  }
];

/** Catálogo fallback con semántica 052. Values legacy intactos. */
export const TIPOS_VACUNAS_FALLBACK: TipoVacunaSemantico[] = [
  {
    value: 'puppy',
    label: 'Puppy',
    activo: true,
    especies: ['CANINO'],
    categoria: 'core',
    intervaloSerieDias: INTERVALO_SERIE_DEFAULT_DIAS,
    intervaloMinimoDias: INTERVALO_MINIMO_DIAS_MLV_CORE,
    edadCierreSerieSemanas: EDAD_CIERRE_SERIE_SEM,
    intervaloAdultoDias: CORE_MLV_ADULTO_DEFAULT_DIAS
  },
  {
    value: 'quintuple',
    label: 'Quíntuple',
    activo: true,
    especies: ['CANINO'],
    categoria: 'core',
    intervaloSerieDias: INTERVALO_SERIE_DEFAULT_DIAS,
    intervaloMinimoDias: INTERVALO_MINIMO_DIAS_MLV_CORE,
    edadCierreSerieSemanas: EDAD_CIERRE_SERIE_SEM,
    intervaloAdultoDias: CORE_MLV_ADULTO_DEFAULT_DIAS
  },
  {
    value: 'sextuple',
    label: 'Séxtuple',
    activo: true,
    especies: ['CANINO'],
    categoria: 'core',
    nuncaTrienal: true,
    intervaloSerieDias: INTERVALO_SERIE_DEFAULT_DIAS,
    intervaloMinimoDias: INTERVALO_MINIMO_DIAS_MLV_CORE,
    edadCierreSerieSemanas: EDAD_CIERRE_SERIE_SEM,
    intervaloAdultoDias: LEPTO_INTERVALO_ADULTO_DIAS,
    hintKey: 'lepto_combo'
  },
  {
    value: 'triple_felina',
    label: 'Triple Felina',
    activo: true,
    especies: ['FELINO'],
    categoria: 'core',
    intervaloSerieDias: INTERVALO_SERIE_DEFAULT_DIAS,
    intervaloMinimoDias: INTERVALO_MINIMO_DIAS_MLV_CORE,
    edadCierreSerieSemanas: EDAD_CIERRE_SERIE_SEM,
    intervaloAdultoDias: FVRCP_REFUERZO_DEFAULT_DIAS
  },
  {
    value: 'antirrabica',
    label: 'Antirrábica',
    activo: true,
    especies: ['CANINO', 'FELINO', 'HURON'],
    categoria: 'legal_mx',
    nuncaTrienal: true,
    intervaloAdultoDias: RABIA_INTERVALO_DEFAULT_DIAS,
    edadMinimaSemanas: EDAD_MIN_RABIA_CLINICA_SEM
  },
  {
    value: 'bordetella',
    label: 'Bordetella',
    activo: true,
    especies: ['CANINO', 'FELINO'],
    categoria: 'non_core',
    nuncaTrienal: true,
    intervaloAdultoDias: 365
  },
  {
    value: 'leucemia_felina',
    label: 'Leucemia Felina',
    activo: true,
    especies: ['FELINO'],
    categoria: 'core',
    dosisInicio: FELV_DOSIS_INICIO,
    intervaloSerieDias: INTERVALO_SERIE_DEFAULT_DIAS,
    intervaloAdultoDias: 365,
    hintKey: 'felv_test'
  },
  {
    value: 'giardia',
    label: 'Giardia',
    activo: true,
    especies: ['CANINO'],
    categoria: 'no_recomendada',
    hintKey: 'no_recomendada'
  },
  ...TIPOS_CONEJO_OLA3,
  {
    value: 'otra',
    label: 'Otra',
    activo: true,
    categoria: 'otra'
  }
];

/**
 * Añade tipos conejo al catálogo RTDB si faltan. No pisa values legacy.
 * No escribe a Firebase: solo fusiona en memoria para la UI.
 */
export function fusionarTiposConejoEnCatalogo<T extends { value?: string }>(
  tipos: T[] | null | undefined
): Array<T | TipoVacunaSemantico> {
  const list = Array.isArray(tipos) ? [...tipos] : [];
  const values = new Set(list.map(t => String(t.value || '').trim().toLowerCase()));
  for (const extra of TIPOS_CONEJO_OLA3) {
    if (!values.has(extra.value)) {
      list.push(extra as T & TipoVacunaSemantico);
    }
  }
  return list;
}

export function semanticaDesdeValue(value: string | null | undefined): SemanticaTipoVacuna {
  const v = String(value || '').trim().toLowerCase();

  if (['giardia', 'coronavirus', 'ccov', 'c_cov'].includes(v)) {
    return baseSemantica({
      codigo: 'no_recomendada',
      categoria: 'no_recomendada',
      especies: ['CANINO']
    });
  }

  if (['antirrabica', 'antirrábica', 'rabia', 'rabia_mx'].includes(v)) {
    return baseSemantica({
      codigo: 'rabia_mx',
      categoria: 'legal_mx',
      nuncaTrienal: true,
      especies: ['CANINO', 'FELINO', 'HURON'],
      intervaloAdultoDias: RABIA_INTERVALO_DEFAULT_DIAS,
      edadMinimaSemanas: EDAD_MIN_RABIA_CLINICA_SEM
    });
  }

  if (['lepto', 'leptospira', 'leptospirosis'].includes(v)) {
    return baseSemantica({
      codigo: 'lepto',
      categoria: 'core',
      nuncaTrienal: true,
      especies: ['CANINO'],
      dosisInicio: LEPTO_DOSIS_INICIO,
      intervaloAdultoDias: LEPTO_INTERVALO_ADULTO_DIAS,
      incluyeLepto: true
    });
  }

  if (['leucemia_felina', 'felv', 'leucemia'].includes(v)) {
    return baseSemantica({
      codigo: 'felv',
      categoria: 'core',
      especies: ['FELINO'],
      dosisInicio: FELV_DOSIS_INICIO
    });
  }

  if (['triple_felina', 'fvrcp', 'triplefelina'].includes(v)) {
    return baseSemantica({
      codigo: 'core_fvrcp',
      categoria: 'core',
      especies: ['FELINO'],
      intervaloAdultoDias: FVRCP_REFUERZO_DEFAULT_DIAS
    });
  }

  if (['bordetella'].includes(v)) {
    return baseSemantica({
      codigo: 'bordetella',
      categoria: 'non_core',
      nuncaTrienal: true,
      especies: ['CANINO', 'FELINO']
    });
  }

  if (['civ', 'influenza_canina'].includes(v)) {
    return baseSemantica({
      codigo: 'civ',
      categoria: 'non_core',
      nuncaTrienal: true,
      especies: ['CANINO'],
      dosisInicio: 2
    });
  }

  if (['mixomatosis', 'mixoma', 'rhdv_rhdv2', 'rhdv', 'rhdv2', 'rhd', 'otra_conejo'].includes(v)) {
    return baseSemantica({
      codigo: 'conejo_manual',
      categoria: 'otra',
      especies: ['CONEJO'],
      intervaloAdultoDias: CONEJO_INTERVALO_DEFAULT_DIAS
    });
  }

  if (['sextuple'].includes(v)) {
    return baseSemantica({
      codigo: 'core_mlv_canino',
      categoria: 'core',
      especies: ['CANINO'],
      nuncaTrienal: true,
      incluyeLepto: true,
      intervaloAdultoDias: LEPTO_INTERVALO_ADULTO_DIAS
    });
  }

  if (['puppy', 'quintuple', 'dhpp', 'dapp', 'séxtuple'].includes(v)) {
    return baseSemantica({
      codigo: 'core_mlv_canino',
      categoria: 'core',
      especies: ['CANINO']
    });
  }

  if (['otra', 'otro', ''].includes(v)) {
    return baseSemantica({
      codigo: 'manual',
      categoria: 'otra',
      especies: ['CANINO', 'FELINO', 'CONEJO', 'HURON', 'AVE', 'REPTIL', 'OTRO']
    });
  }

  return baseSemantica({
    codigo: 'manual',
    categoria: 'otra'
  });
}

export function fusionarSemanticaTipo(
  value: string | null | undefined,
  tipo?: TipoVacunaSemantico | null
): SemanticaTipoVacuna {
  const base = semanticaDesdeValue(value || tipo?.value);
  if (!tipo) return base;

  const categoria = (tipo.categoria as CategoriaVacuna) || base.categoria;
  return {
    ...base,
    categoria,
    nuncaTrienal: tipo.nuncaTrienal ?? base.nuncaTrienal,
    especies: (tipo.especies as EspecieEsquema[]) || base.especies,
    dosisInicio: tipo.dosisInicio ?? base.dosisInicio,
    intervaloSerieDias: tipo.intervaloSerieDias ?? base.intervaloSerieDias,
    intervaloMinimoDias: tipo.intervaloMinimoDias ?? base.intervaloMinimoDias,
    intervaloAdultoDias: tipo.intervaloAdultoDias ?? base.intervaloAdultoDias,
    edadCierreSerieSemanas: tipo.edadCierreSerieSemanas ?? base.edadCierreSerieSemanas,
    edadMinimaSemanas: tipo.edadMinimaSemanas ?? base.edadMinimaSemanas
  };
}

export function etiquetaCategoria(categoria: CategoriaVacuna): string {
  switch (categoria) {
    case 'core':
      return 'Core';
    case 'non_core':
      return 'Non-core';
    case 'legal_mx':
      return 'Legal MX';
    case 'no_recomendada':
      return 'No recomendada';
    default:
      return 'Otra';
  }
}

export function claseBadgeCategoria(categoria: CategoriaVacuna): string {
  switch (categoria) {
    case 'core':
      return 'estado-badge--success';
    case 'legal_mx':
      return 'estado-badge--info';
    case 'non_core':
      return 'estado-badge--pending';
    case 'no_recomendada':
      return 'estado-badge--danger';
    default:
      return 'estado-badge--neutral';
  }
}
