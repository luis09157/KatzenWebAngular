/**
 * Spec 094 — machotes clínicos por tipo de consentimiento (borradores revisables).
 * Textos propios en español latino; pensados para **una sola hoja** A4/letter
 * (tipografía ~10–11 pt). Estructura: identificación, riesgo/autorización, firma en papel.
 * No son formularios legales certificados ni copia verbatim de terceros.
 */

import { ConsentimientoTipo, CONSENTIMIENTO_TIPO_LABELS, CONSENTIMIENTO_TIPOS } from './consentimientos.models';

/** Placeholders soportados en plantillas (doble llave). */
export type ConsentimientoPlaceholder =
  'clinica' | 'paciente' | 'dueno' | 'fecha' | 'tipo' | 'veterinario' | 'procedimiento' | 'firmado_por' | 'parentesco';

export const CONSENTIMIENTO_PLACEHOLDERS: ConsentimientoPlaceholder[] = [
  'clinica',
  'paciente',
  'dueno',
  'fecha',
  'tipo',
  'veterinario',
  'procedimiento',
  'firmado_por',
  'parentesco',
];

/**
 * Umbral de longitud del cuerpo HTML (plantilla con placeholders, sin sustituir).
 * Mantiene el machote cabible en 1 página con tipografía legible ~10–11 pt.
 */
export const CONSENTIMIENTO_CUERPO_MAX_CHARS = 2200;

/** Máximo de palabras aproximadas del texto plano del cuerpo (HTML strip). */
export const CONSENTIMIENTO_CUERPO_MAX_WORDS = 320;

export const CONSENTIMIENTO_DISCLAIMER =
  'Borrador clínico — revisar con el MVZ responsable (y asesoría legal si aplica) antes de usarlo como documento definitivo.';

export interface ConsentimientoPlantilla {
  tipo: ConsentimientoTipo;
  titulo: string;
  /** Cuerpo con placeholders {{clave}}. */
  cuerpo: string;
}

/** Identificación compacta (pocas líneas) para caber en 1 hoja. */
const BLOQUE_IDENTIFICACION = `
<p class="consent-meta"><strong>Clínica:</strong> {{clinica}} · <strong>Fecha:</strong> {{fecha}} · <strong>Tipo:</strong> {{tipo}}</p>
<p class="consent-meta"><strong>Paciente:</strong> {{paciente}} · <strong>Dueño:</strong> {{dueno}} · <strong>Quien autoriza:</strong> {{firmado_por}}{{parentesco}}</p>
<p class="consent-meta"><strong>Veterinario:</strong> {{veterinario}}</p>
<p class="consent-meta"><strong>Procedimiento / notas:</strong> {{procedimiento}}</p>
`.trim();

const BLOQUE_FIRMA = `
<hr />
<p class="consent-disc"><em>{{disclaimer}}</em></p>
<p>Declaro que leí este documento, pude preguntar y autorizo el procedimiento descrito como dueño o tutor.</p>
<p class="consent-firmas"><strong>Firma tutor:</strong> _______________________ &nbsp; <strong>Fecha:</strong> __________ &nbsp; <strong>Firma MVZ:</strong> _______________________</p>
`.trim();

function plantilla(tipo: ConsentimientoTipo, secciones: string[]): ConsentimientoPlantilla {
  return {
    tipo,
    titulo: `Consentimiento informado — ${CONSENTIMIENTO_TIPO_LABELS[tipo]}`,
    cuerpo: [BLOQUE_IDENTIFICACION, ...secciones, BLOQUE_FIRMA].join('\n'),
  };
}

const PLANTILLAS: Record<ConsentimientoTipo, ConsentimientoPlantilla> = {
  cirugia: plantilla('cirugia', [
    `<h3>Cirugía</h3>
<p>Autorizo a {{clinica}} a operar a {{paciente}} (preparación, acceso vascular, monitoreo y cuidados perioperatorios necesarios). Se me explicó objetivo, alternativas (incluido no operar), beneficios y pronóstico general. Detalle del caso: «Procedimiento / notas».</p>
<p><strong>Riesgos:</strong> hemorragia, infección, dehiscencia, dolor, reacciones a fármacos, complicaciones anestésicas, ampliación del acto ante hallazgos y, en casos graves, deterioro o fallecimiento pese a cuidados adecuados.</p>
<p><strong>Autorizo</strong> al equipo a proceder y a dar soporte razonable. Seguiré ayuno, medicación y cuidados postoperatorios, y avisaré ante cambios preocupantes.</p>`,
  ]),

  anestesia: plantilla('anestesia', [
    `<h3>Anestesia / sedación</h3>
<p>Autorizo la sedación y/o anestesia que el MVZ estime adecuada para {{paciente}}, según evaluación clínica, ayuno cuando aplique y monitoreo. Particularidades: «Procedimiento / notas».</p>
<p><strong>Riesgos:</strong> náuseas/vómito, cambios de presión o ritmo, depresión respiratoria, reacciones adversas, broncoaspiración, retraso en el despertar y, en pacientes enfermos o de urgencia, complicaciones graves o muerte aun con protocolo adecuado.</p>
<p><strong>Autorizo</strong> administrar/ajustar anestesia, oxigenación y fármacos de emergencia, y suspender o modificar el plan si la seguridad de {{paciente}} lo exige.</p>`,
  ]),

  egreso: plantilla('egreso', [
    `<h3>Egreso / alta</h3>
<p>Recibo a {{paciente}} en egreso de {{clinica}}. Me explicaron medicación, alimentación, actividad, heridas/vendajes, signos de alarma y cuándo volver a control o urgencias. Detalle: «Procedimiento / notas».</p>
<p><strong>Responsabilidad:</strong> el plan de alta es del tutor. Si no puedo cumplirlo, lo comunicaré. Autorizo el egreso bajo mi responsabilidad.</p>
<p><strong>Urgencia:</strong> ante dificultad respiratoria, sangrado abundante, vómito persistente, decaimiento marcado, convulsiones u otro signo grave, contactaré a {{clinica}} o acudiré a urgencias veterinarias.</p>`,
  ]),

  hospitalizacion: plantilla('hospitalizacion', [
    `<h3>Hospitalización</h3>
<p>Autorizo hospitalizar a {{paciente}} en {{clinica}} para observación, tratamiento y soporte según el plan del MVZ (fluidos, medicación, monitoreo u otros). El plan puede ajustarse según evolución. Detalle: «Procedimiento / notas».</p>
<p><strong>Riesgos / límites:</strong> la hospitalización no elimina riesgos; puede haber progresión, reacciones, traslado o desenlace desfavorable. Los costos pueden variar con duración y tratamientos adicionales.</p>
<p><strong>Autorizo</strong> las intervenciones razonables del plan y a contactarme ante cambios. Mantendré un medio de contacto vigente y decidiré a tiempo cuando se me consulte.</p>`,
  ]),

  eutanasia: plantilla('eutanasia', [
    `<h3>Eutanasia humanitaria</h3>
<p>Autorizo a {{clinica}} la eutanasia humanitaria de {{paciente}} para evitar sufrimiento cuando, bajo criterio veterinario, no haya alternativa razonable con calidad de vida aceptable. Se me explicó diagnóstico/pronóstico, carácter irreversible, procedimiento (sedación previa si aplica, agente eutanásico y confirmación del fallecimiento).</p>
<p><strong>Decisión:</strong> autorizo de forma voluntaria como dueño/tutor; entiendo que el acto no es reversible una vez confirmado el fallecimiento.</p>
<p><strong>Cuerpo:</strong> acordé con la clínica el manejo (entrega, cremación u otra opción disponible). Detalle en notas. Autorizo proceder conforme a lo indicado.</p>`,
  ]),

  tratamiento: plantilla('tratamiento', [
    `<h3>Tratamiento médico</h3>
<p>Autorizo el plan de tratamiento de {{paciente}} en {{clinica}} (medicamentos, terapias, curaciones, dieta y controles según notas). Se me explicó objetivo, duración estimada si aplica, beneficios, alternativas (incluido no tratar) y efectos adversos relevantes.</p>
<p><strong>Riesgos / seguimiento:</strong> la respuesta varía; puede haber efectos secundarios, falta de mejoría o ajuste/suspensión del plan. Administraré la medicación según indicación, sin cambiar dosis por cuenta propia, y acudiré a controles.</p>
<p><strong>Autorizo</strong> iniciar el tratamiento y, con mi consentimiento adicional si el cambio es sustancial, modificarlo según evolución.</p>`,
  ]),

  otro: plantilla('otro', [
    `<h3>Procedimiento clínico</h3>
<p>Autorizo a {{clinica}} el procedimiento descrito para {{paciente}} en «Procedimiento / notas». Se me explicó motivo, acto previsto, beneficios, riesgos generales y alternativas.</p>
<p><strong>Riesgos:</strong> molestias, complicaciones, estudios o tratamientos adicionales y, en casos excepcionales, deterioro pese a atención adecuada.</p>
<p><strong>Autorizo</strong> lo descrito, el soporte razonable y suspender el acto si la seguridad de {{paciente}} lo requiere. Pude formular preguntas.</p>`,
  ]),
};

/** Disclaimer embebido como placeholder especial en el bloque de firma. */
export function getPlantillaConsentimiento(tipo: ConsentimientoTipo): ConsentimientoPlantilla {
  const p = PLANTILLAS[tipo] || PLANTILLAS.otro;
  return {
    ...p,
    cuerpo: p.cuerpo.replace(/\{\{disclaimer\}\}/g, CONSENTIMIENTO_DISCLAIMER),
  };
}

export function listarPlantillasConsentimiento(): ConsentimientoPlantilla[] {
  return CONSENTIMIENTO_TIPOS.map((t) => getPlantillaConsentimiento(t));
}

/** Sustituye `{{clave}}` por valores del mapa (valores ya escapados o texto plano según el llamador). */
export function reemplazarPlaceholdersConsentimiento(
  plantilla: string,
  valores: Partial<Record<ConsentimientoPlaceholder | 'disclaimer', string>>
): string {
  return plantilla.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_m, key: string) => {
    const k = key.toLowerCase() as ConsentimientoPlaceholder | 'disclaimer';
    const v = valores[k];
    return v != null && String(v).length ? String(v) : '—';
  });
}

/** Cuenta palabras del cuerpo HTML (tags removidos). Útil para tests de densidad 1 hoja. */
export function contarPalabrasCuerpoConsentimiento(html: string): number {
  const plain = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return 0;
  return plain.split(' ').filter(Boolean).length;
}
