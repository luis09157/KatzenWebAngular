/**
 * Spec 094 Fase B — PDF (jspdf) + WhatsApp (mismo límite que 092: wa.me no adjunta PDF).
 * Layout forzado a **una sola página** A4 (márgenes densos + tipografía ~10–11 pt;
 * si el contenido sobra, se reduce ligeramente el tamaño de fuente / interlineado
 * sin paginar).
 */
import { normalizarTelefonoMx, WHATSAPP_LADA_MX } from '../recordatorios/recordatorio-whatsapp.util';
import { descargarBlob, puedeWebSharePdf } from '../visitas/ticket-digital.util';
import {
  buildConsentimientoDocumentoView,
  ConsentimientoDocumentoDatos,
  ConsentimientoDocumentoView,
  nombreArchivoPdfConsentimiento,
  textoWhatsAppConsentimientoConAvisoPdf,
} from './consentimiento-documento.util';

export type ConsentimientoShareMode = 'web_share' | 'download_wa' | 'download_only';

export interface ConsentimientoShareResult {
  mode: ConsentimientoShareMode;
  pdfFileName: string;
  waOpened: boolean;
}

/** URL wa.me con texto; null si teléfono inválido. */
export function urlWhatsAppConsentimiento(telefono: unknown, texto: string): string | null {
  const tel = normalizarTelefonoMx(telefono as string);
  if (!tel) return null;
  return `https://wa.me/${WHATSAPP_LADA_MX}${tel}?text=${encodeURIComponent(texto)}`;
}

interface PdfLayoutParams {
  marginX: number;
  marginY: number;
  headerH: number;
  titleSize: number;
  discSize: number;
  bodyTitleSize: number;
  bodySize: number;
  lineTitle: number;
  lineBody: number;
  discLine: number;
  gapAfterDisc: number;
  gapBloque: number;
}

const LAYOUT_BASE: PdfLayoutParams = {
  marginX: 12,
  marginY: 10,
  headerH: 22,
  titleSize: 11,
  discSize: 8,
  bodyTitleSize: 10.5,
  bodySize: 10,
  lineTitle: 4.4,
  lineBody: 4.1,
  discLine: 3.4,
  gapAfterDisc: 4,
  gapBloque: 2.5,
};

/**
 * PDF A4 de **una sola página** con encabezado marca + secciones del machote.
 * `jspdf` se carga bajo demanda. No llama `addPage`.
 */
export async function generarPdfConsentimientoBlob(view: ConsentimientoDocumentoView): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const plain = htmlConsentimientoATextoPlano(view.cuerpoHtml);
  const bloques = plain
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  let layout = { ...LAYOUT_BASE };
  let fits = false;
  for (let attempt = 0; attempt < 6 && !fits; attempt++) {
    if (attempt > 0) {
      layout = scaleLayout(layout, 0.92);
    }
    const needed = medirAlturaPdf(doc as unknown as JsPdfLike, view, bloques, pageW, layout);
    const usable = pageH - layout.marginY;
    fits = needed <= usable;
  }

  dibujarPdfUnaPagina(doc as unknown as JsPdfLike, view, bloques, pageW, pageH, layout);
  return doc.output('blob');
}

function scaleLayout(l: PdfLayoutParams, factor: number): PdfLayoutParams {
  return {
    marginX: Math.max(8, l.marginX * 0.98),
    marginY: Math.max(7, l.marginY * 0.98),
    headerH: Math.max(16, l.headerH * factor),
    titleSize: Math.max(9, l.titleSize * factor),
    discSize: Math.max(7, l.discSize * factor),
    bodyTitleSize: Math.max(9, l.bodyTitleSize * factor),
    bodySize: Math.max(8.5, l.bodySize * factor),
    lineTitle: Math.max(3.4, l.lineTitle * factor),
    lineBody: Math.max(3.2, l.lineBody * factor),
    discLine: Math.max(2.8, l.discLine * factor),
    gapAfterDisc: Math.max(2.5, l.gapAfterDisc * factor),
    gapBloque: Math.max(1.5, l.gapBloque * factor),
  };
}

/** Minimal surface used for measuring/drawing (avoids tight jspdf type coupling). */
interface JsPdfLike {
  setFontSize(size: number): void;
  splitTextToSize(text: string, maxWidth: number): string[];
  setFillColor(r: number, g: number, b: number): void;
  rect(x: number, y: number, w: number, h: number, style: string): void;
  setTextColor(r: number, g: number, b: number): void;
  setFont(name: string, style: string): void;
  text(text: string | string[], x: number, y: number, opts?: { align?: string }): void;
  setDrawColor(r: number, g: number, b: number): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
}

function medirAlturaPdf(
  doc: JsPdfLike,
  view: ConsentimientoDocumentoView,
  bloques: string[],
  pageW: number,
  l: PdfLayoutParams
): number {
  const contentW = pageW - l.marginX * 2;
  let y = l.headerH + 4;

  doc.setFontSize(l.discSize);
  const disc = doc.splitTextToSize(view.disclaimer, contentW);
  y += disc.length * l.discLine + l.gapAfterDisc + 2;

  for (const bloque of bloques) {
    const esTitulo = esTituloBloque(bloque);
    const fontSize = esTitulo ? l.bodyTitleSize : l.bodySize;
    const lineH = esTitulo ? l.lineTitle : l.lineBody;
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(bloque, contentW);
    y += lines.length * lineH + (esTitulo ? 1.5 : l.gapBloque);
  }
  return y;
}

function dibujarPdfUnaPagina(
  doc: JsPdfLike,
  view: ConsentimientoDocumentoView,
  bloques: string[],
  pageW: number,
  pageH: number,
  l: PdfLayoutParams
): void {
  const contentW = pageW - l.marginX * 2;
  const bottom = pageH - l.marginY;

  doc.setFillColor(10, 150, 155);
  doc.rect(0, 0, pageW, l.headerH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(l.titleSize + 2);
  doc.text(view.clinica || 'KatzenVet', pageW / 2, l.headerH * 0.42, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(l.titleSize);
  const tituloLines = doc.splitTextToSize(view.titulo, contentW);
  doc.text(tituloLines, pageW / 2, l.headerH * 0.72, { align: 'center' });

  let y = l.headerH + 4;
  doc.setTextColor(154, 52, 18);
  doc.setFontSize(l.discSize);
  const disc = doc.splitTextToSize(view.disclaimer, contentW);
  // Sin paginar: si no cabe, se truncará visualmente solo en overflow extremo (machotes cortos).
  doc.text(disc, l.marginX, Math.min(y, bottom));
  y += disc.length * l.discLine + l.gapAfterDisc;

  doc.setDrawColor(226, 232, 240);
  if (y < bottom) {
    doc.line(l.marginX, y, l.marginX + contentW, y);
  }
  y += 3;

  for (const bloque of bloques) {
    if (y >= bottom - 4) break;
    const esTitulo = esTituloBloque(bloque);
    const fontSize = esTitulo ? l.bodyTitleSize : l.bodySize;
    const lineH = esTitulo ? l.lineTitle : l.lineBody;
    doc.setFont('helvetica', esTitulo ? 'bold' : 'normal');
    doc.setTextColor(esTitulo ? 6 : 15, esTitulo ? 93 : 23, esTitulo ? 96 : 42);
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(bloque, contentW) as string[];
    const maxLines = Math.max(1, Math.floor((bottom - y) / lineH));
    const clipped = lines.slice(0, maxLines);
    doc.text(clipped, l.marginX, y);
    y += clipped.length * lineH + (esTitulo ? 1.5 : l.gapBloque);
  }
}

function esTituloBloque(bloque: string): boolean {
  return /^[A-ZÁÉÍÓÚÑ0-9].{0,60}$/.test(bloque) && !bloque.includes('.') && bloque.length < 70;
}

/** Extrae texto legible del HTML de plantilla (sin dependencias DOM en Node/tests). */
export function htmlConsentimientoATextoPlano(html: string): string {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h3>/gi, '\n\n')
    .replace(/<h3[^>]*>/gi, '\n\n')
    .replace(/<hr\s*\/?>/gi, '\n\n———\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function descargarPdfConsentimiento(datos: ConsentimientoDocumentoDatos): Promise<string> {
  const view = buildConsentimientoDocumentoView(datos);
  const fileName = nombreArchivoPdfConsentimiento(view);
  const blob = await generarPdfConsentimientoBlob(view);
  descargarBlob(blob, fileName);
  return fileName;
}

/**
 * Comparte PDF (Web Share) o descarga + abre wa.me.
 * Sin teléfono válido: solo descarga.
 */
export async function compartirConsentimientoWhatsAppPdf(
  datos: ConsentimientoDocumentoDatos,
  telefono: unknown
): Promise<ConsentimientoShareResult> {
  const view = buildConsentimientoDocumentoView(datos);
  const fileName = nombreArchivoPdfConsentimiento(view);
  const blob = await generarPdfConsentimientoBlob(view);
  const file = new File([blob], fileName, { type: 'application/pdf' });
  const texto = textoWhatsAppConsentimientoConAvisoPdf(view);
  const waUrl = urlWhatsAppConsentimiento(telefono, texto);

  if (puedeWebSharePdf()) {
    try {
      await navigator.share({
        files: [file],
        title: `${view.clinica} — Consentimiento`,
        text: texto,
      });
      return { mode: 'web_share', pdfFileName: fileName, waOpened: false };
    } catch (err) {
      const name = err && typeof err === 'object' && 'name' in err ? String((err as { name: string }).name) : '';
      if (name === 'AbortError') {
        return { mode: 'web_share', pdfFileName: fileName, waOpened: false };
      }
    }
  }

  descargarBlob(blob, fileName);
  if (waUrl) {
    window.open(waUrl, '_blank', 'noopener');
    return { mode: 'download_wa', pdfFileName: fileName, waOpened: true };
  }
  return { mode: 'download_only', pdfFileName: fileName, waOpened: false };
}
