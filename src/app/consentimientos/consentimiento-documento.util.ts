/**
 * Spec 094 — view-model + HTML del documento de consentimiento (preview).
 * Separado del ticket POS (092); reutiliza solo la idea de HTML/PDF/share.
 */

import { CLINICA_NOMBRE_DEFAULT } from '../core/utils/clinica-config.util';
import { Consentimiento, ConsentimientoTipo, CONSENTIMIENTO_TIPO_LABELS } from './consentimientos.models';
import {
  CONSENTIMIENTO_DISCLAIMER,
  ConsentimientoPlaceholder,
  getPlantillaConsentimiento,
  reemplazarPlaceholdersConsentimiento,
} from './consentimiento-plantillas.util';

export { CONSENTIMIENTO_DISCLAIMER };

export interface ConsentimientoDocumentoDatos {
  tipo: ConsentimientoTipo;
  clinica?: string | null;
  paciente?: string | null;
  dueno?: string | null;
  fecha?: string | null;
  veterinario?: string | null;
  procedimiento?: string | null;
  firmado_por?: string | null;
  parentesco?: string | null;
}

export interface ConsentimientoDocumentoView {
  tipo: ConsentimientoTipo;
  tipoLabel: string;
  titulo: string;
  clinica: string;
  paciente: string;
  dueno: string;
  fecha: string;
  veterinario: string;
  procedimiento: string;
  firmado_por: string;
  parentesco: string;
  disclaimer: string;
  /** Cuerpo HTML con placeholders ya sustituidos (valores escapados). */
  cuerpoHtml: string;
}

const MARCA = '#0A969B';
const MARCA_FUERTE = '#065D60';
const TEXTO = '#0f172a';
const MUTED = '#64748b';
const BORDE = '#e2e8f0';

export function escapeHtmlConsentimiento(raw: string): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function textoOGuion(raw: string | null | undefined, fallback = '—'): string {
  const t = String(raw ?? '').trim();
  return t || fallback;
}

export function datosDesdeConsentimiento(
  row: Pick<
    Consentimiento,
    'tipo' | 'paciente' | 'cliente' | 'fecha' | 'staff_nombre' | 'notas' | 'firmado_por' | 'parentesco'
  >,
  clinica?: string | null
): ConsentimientoDocumentoDatos {
  return {
    tipo: row.tipo,
    clinica,
    paciente: row.paciente,
    dueno: row.cliente,
    fecha: row.fecha,
    veterinario: row.staff_nombre,
    procedimiento: row.notas,
    firmado_por: row.firmado_por,
    parentesco: row.parentesco,
  };
}

export function buildConsentimientoDocumentoView(datos: ConsentimientoDocumentoDatos): ConsentimientoDocumentoView {
  const tipo = datos.tipo || 'otro';
  const plantilla = getPlantillaConsentimiento(tipo);
  const clinica = textoOGuion(datos.clinica, CLINICA_NOMBRE_DEFAULT);
  const paciente = textoOGuion(datos.paciente, 'Paciente');
  const dueno = textoOGuion(datos.dueno, 'Dueño / tutor');
  const fecha = textoOGuion(datos.fecha);
  const veterinario = textoOGuion(datos.veterinario, 'Por asignar');
  const procedimiento = textoOGuion(datos.procedimiento, 'Según indicación clínica del caso');
  const firmado_por = textoOGuion(datos.firmado_por, dueno);
  const parentescoRaw = String(datos.parentesco ?? '').trim();
  const parentesco = parentescoRaw;
  const parentescoSuffix = parentescoRaw ? ` (${parentescoRaw})` : '';

  const valoresEscapados: Partial<Record<ConsentimientoPlaceholder | 'disclaimer', string>> = {
    clinica: escapeHtmlConsentimiento(clinica),
    paciente: escapeHtmlConsentimiento(paciente),
    dueno: escapeHtmlConsentimiento(dueno),
    fecha: escapeHtmlConsentimiento(fecha),
    tipo: escapeHtmlConsentimiento(CONSENTIMIENTO_TIPO_LABELS[tipo] || tipo),
    veterinario: escapeHtmlConsentimiento(veterinario),
    procedimiento: escapeHtmlConsentimiento(procedimiento).replace(/\n/g, '<br />'),
    firmado_por: escapeHtmlConsentimiento(firmado_por),
    parentesco: escapeHtmlConsentimiento(parentescoSuffix),
    disclaimer: escapeHtmlConsentimiento(CONSENTIMIENTO_DISCLAIMER),
  };

  const cuerpoHtml = reemplazarPlaceholdersConsentimiento(plantilla.cuerpo, valoresEscapados);

  return {
    tipo,
    tipoLabel: CONSENTIMIENTO_TIPO_LABELS[tipo] || tipo,
    titulo: plantilla.titulo,
    clinica,
    paciente,
    dueno,
    fecha,
    veterinario,
    procedimiento,
    firmado_por,
    parentesco,
    disclaimer: CONSENTIMIENTO_DISCLAIMER,
    cuerpoHtml,
  };
}

export function cssConsentimientoDocumento(): string {
  return `
@page { size: A4; margin: 10mm; }
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 8px;
  background: #f1f5f9;
  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  color: ${TEXTO};
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.consent-doc {
  max-width: 720px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid ${BORDE};
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.08);
  page-break-inside: avoid;
  break-inside: avoid;
}
.consent-doc__brand {
  background: linear-gradient(135deg, ${MARCA} 0%, ${MARCA_FUERTE} 100%);
  color: #fff;
  padding: 12px 16px 10px;
  text-align: center;
}
.consent-doc__clinica {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}
.consent-doc__titulo {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 500;
  opacity: 0.95;
}
.consent-doc__body {
  padding: 12px 16px 14px;
  font-size: 11px;
  line-height: 1.35;
}
.consent-doc__body h3 {
  margin: 8px 0 4px;
  font-size: 12px;
  color: ${MARCA_FUERTE};
  page-break-after: avoid;
  break-after: avoid;
}
.consent-doc__body p { margin: 0 0 6px; }
.consent-doc__body .consent-meta { margin: 0 0 3px; font-size: 10.5px; line-height: 1.3; }
.consent-doc__body .consent-disc { margin: 0 0 6px; }
.consent-doc__body .consent-firmas { margin: 4px 0 0; font-size: 10.5px; }
.consent-doc__body hr {
  border: 0;
  border-top: 1px solid ${BORDE};
  margin: 8px 0;
}
.consent-doc__body em {
  display: block;
  color: ${MUTED};
  font-size: 9.5px;
  line-height: 1.3;
}
.consent-doc__disclaimer-banner {
  margin: 0;
  padding: 6px 16px;
  background: #fff7ed;
  border-bottom: 1px solid #fed7aa;
  color: #9a3412;
  font-size: 10px;
  line-height: 1.3;
}
@media print {
  body { background: #fff; padding: 0; }
  .consent-doc {
    max-width: none;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .consent-doc__body { font-size: 10.5pt; line-height: 1.32; }
  .consent-doc__body h3 { font-size: 11pt; }
}
`.trim();
}

export function htmlCuerpoConsentimientoDocumento(view: ConsentimientoDocumentoView): string {
  return `
<article class="consent-doc">
  <header class="consent-doc__brand">
    <h1 class="consent-doc__clinica">${escapeHtmlConsentimiento(view.clinica)}</h1>
    <p class="consent-doc__titulo">${escapeHtmlConsentimiento(view.titulo)}</p>
  </header>
  <p class="consent-doc__disclaimer-banner">${escapeHtmlConsentimiento(view.disclaimer)}</p>
  <div class="consent-doc__body">${view.cuerpoHtml}</div>
</article>`.trim();
}

export function documentoConsentimientoHtml(view: ConsentimientoDocumentoView): string {
  const title = `${view.clinica} — ${view.titulo}`;
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>${escapeHtmlConsentimiento(title)}</title><style>${cssConsentimientoDocumento()}</style></head><body>${htmlCuerpoConsentimientoDocumento(view)}</body></html>`;
}

/** Nombre archivo: consentimiento-{tipo}-{paciente}-{fecha}.pdf */
export function nombreArchivoPdfConsentimiento(view: ConsentimientoDocumentoView): string {
  const slug = (s: string) =>
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  const tipo = slug(view.tipo) || 'otro';
  const paciente = slug(view.paciente) || 'paciente';
  const fecha = slug(view.fecha) || 'fecha';
  return `consentimiento-${tipo}-${paciente}-${fecha}.pdf`;
}

/** Texto corto para wa.me (sin adjunto automático). */
export function generarTextoConsentimientoWhatsApp(view: ConsentimientoDocumentoView): string {
  const lineas = [
    `${view.clinica}`,
    `Consentimiento: ${view.tipoLabel}`,
    `Paciente: ${view.paciente}`,
    `Dueño: ${view.dueno}`,
    `Fecha: ${view.fecha}`,
    '',
    'Te compartimos el documento de consentimiento informado.',
    'Si recibes este mensaje por WhatsApp Web, adjunta el PDF descargado al chat (WhatsApp no lo adjunta solo).',
    '',
    CONSENTIMIENTO_DISCLAIMER,
  ];
  return lineas.join('\n');
}

export function textoWhatsAppConsentimientoConAvisoPdf(view: ConsentimientoDocumentoView): string {
  return `${generarTextoConsentimientoWhatsApp(view)}\n\n📎 PDF del consentimiento (adjúntalo si no se compartió automáticamente).`;
}
