/**
 * Spec 092 — ticket digital (HTML/CSS imprimible + PDF) para compartir.
 * Reutiliza `Ticket80View` / `buildTicket80View` (071); no reemplaza el térmico 80 mm.
 *
 * WhatsApp: `wa.me` no adjunta PDF. Opciones:
 * 1) Web Share API con File (móvil compatible)
 * 2) Fallback: descargar PDF + abrir wa.me con texto del ticket + aviso de adjunto
 */
import { Ticket80View, buildTicket80View } from './ticket-80mm.util';
import { TicketWhatsAppInput, generarTextoTicketWhatsApp, urlWhatsAppTicket } from './pos-ticket-whatsapp.util';

export const TICKET_DIGITAL_MARCA = '#0A969B';
export const TICKET_DIGITAL_MARCA_FUERTE = '#065D60';
export const TICKET_DIGITAL_TEXTO = '#0f172a';
export const TICKET_DIGITAL_MUTED = '#64748b';
export const TICKET_DIGITAL_BORDE = '#e2e8f0';

export type TicketDigitalShareMode = 'web_share' | 'download_wa' | 'download_only';

export interface TicketDigitalShareResult {
  mode: TicketDigitalShareMode;
  pdfFileName: string;
  waOpened: boolean;
}

/** CSS embebido del comprobante digital (pantalla / print / PDF mirror). */
export function cssTicketDigital(): string {
  return `
@page { size: A4; margin: 12mm; }
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 0;
  background: #f1f5f9;
  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  color: ${TICKET_DIGITAL_TEXTO};
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.ticket-digital {
  width: 100%;
  max-width: 420px;
  margin: 16px auto;
  background: #fff;
  border-radius: 12px;
  border: 1px solid ${TICKET_DIGITAL_BORDE};
  overflow: hidden;
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.08);
}
.ticket-digital__brand {
  background: linear-gradient(135deg, ${TICKET_DIGITAL_MARCA} 0%, ${TICKET_DIGITAL_MARCA_FUERTE} 100%);
  color: #fff;
  padding: 20px 22px 16px;
  text-align: center;
}
.ticket-digital__clinica {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.ticket-digital__tipo {
  margin: 6px 0 0;
  font-size: 13px;
  opacity: 0.92;
  font-weight: 500;
}
.ticket-digital__meta {
  padding: 16px 22px 8px;
  font-size: 13px;
  line-height: 1.45;
}
.ticket-digital__meta p { margin: 0 0 4px; }
.ticket-digital__meta strong { font-weight: 600; }
.ticket-digital__folio {
  display: inline-block;
  margin-top: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(10, 150, 155, 0.12);
  color: ${TICKET_DIGITAL_MARCA_FUERTE};
  font-size: 12px;
  font-weight: 600;
}
.ticket-digital__lines {
  list-style: none;
  margin: 8px 22px;
  padding: 12px 0;
  border-top: 1px solid ${TICKET_DIGITAL_BORDE};
  border-bottom: 1px solid ${TICKET_DIGITAL_BORDE};
}
.ticket-digital__lines li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  font-size: 13px;
}
.ticket-digital__lines .nombre { flex: 1; text-align: left; }
.ticket-digital__lines .importe { font-variant-numeric: tabular-nums; white-space: nowrap; font-weight: 600; }
.ticket-digital__lines .devuelto { color: ${TICKET_DIGITAL_MUTED}; text-decoration: line-through; }
.ticket-digital__totales {
  padding: 8px 22px 16px;
  font-size: 13px;
}
.ticket-digital__totales p {
  display: flex;
  justify-content: space-between;
  margin: 4px 0;
  gap: 12px;
}
.ticket-digital__total {
  margin-top: 10px !important;
  padding-top: 10px;
  border-top: 2px solid ${TICKET_DIGITAL_MARCA};
  font-size: 16px;
  font-weight: 700;
  color: ${TICKET_DIGITAL_MARCA_FUERTE};
}
.ticket-digital__foot {
  text-align: center;
  padding: 14px 22px 20px;
  font-size: 12px;
  color: ${TICKET_DIGITAL_MUTED};
  border-top: 1px dashed ${TICKET_DIGITAL_BORDE};
}
@media print {
  body { background: #fff; }
  .ticket-digital {
    margin: 0 auto;
    box-shadow: none;
    border: 1px solid ${TICKET_DIGITAL_BORDE};
  }
}
`.trim();
}

function escapeHtml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Cuerpo HTML del ticket (sin documento completo). */
export function htmlCuerpoTicketDigital(view: Ticket80View): string {
  const lineas =
    view.lineas.length > 0
      ? view.lineas
          .map((l) => {
            const cls = l.devuelto ? ' class="devuelto"' : '';
            const suf = l.devuelto ? ' (devuelto)' : '';
            return `<li${cls}><span class="nombre">${escapeHtml(String(l.qty))} × ${escapeHtml(l.nombre)}${suf}</span><span class="importe">${escapeHtml(l.importe)}</span></li>`;
          })
          .join('')
      : `<li><span class="nombre">Sin artículos</span><span class="importe"></span></li>`;

  const extras: string[] = [];
  if (view.descuento) extras.push(`<p><span>Descuento</span><span>${escapeHtml(view.descuento)}</span></p>`);
  if (view.devuelto) extras.push(`<p><span>Devoluciones</span><span>${escapeHtml(view.devuelto)}</span></p>`);
  if (view.iva) extras.push(`<p><span>IVA incluido</span><span>${escapeHtml(view.iva)}</span></p>`);

  let pagosHtml = '';
  if (view.pagoUnico) {
    pagosHtml = `<p><span>Pago</span><span>${escapeHtml(view.pagoUnico)}</span></p>`;
  } else if (view.pagos.length) {
    pagosHtml =
      `<p><span>Pago mixto</span><span></span></p>` +
      view.pagos.map((p) => `<p><span>${escapeHtml(p.label)}</span><span>${escapeHtml(p.monto)}</span></p>`).join('');
  }
  if (view.recibido) extras.push(`<p><span>Recibido</span><span>${escapeHtml(view.recibido)}</span></p>`);
  if (view.cambio) extras.push(`<p><span>Cambio</span><span>${escapeHtml(view.cambio)}</span></p>`);
  if (view.saldoPendiente) {
    extras.push(`<p><span>Saldo pendiente</span><span>${escapeHtml(view.saldoPendiente)}</span></p>`);
  }

  const paciente = view.paciente ? `<p><strong>Mascota:</strong> ${escapeHtml(view.paciente)}</p>` : '';

  return `
<article class="ticket-digital">
  <header class="ticket-digital__brand">
    <h1 class="ticket-digital__clinica">${escapeHtml(view.clinica)}</h1>
    <p class="ticket-digital__tipo">Ticket de venta</p>
  </header>
  <div class="ticket-digital__meta">
    <p><strong>Fecha:</strong> ${escapeHtml(view.fecha)}</p>
    ${view.folio ? `<span class="ticket-digital__folio">Folio ${escapeHtml(view.folio)}</span>` : ''}
    <p style="margin-top:10px"><strong>Cliente:</strong> ${escapeHtml(view.cliente)}</p>
    ${paciente}
  </div>
  <ul class="ticket-digital__lines">${lineas}</ul>
  <div class="ticket-digital__totales">
    ${extras.join('')}
    <p class="ticket-digital__total"><span>Total</span><span>${escapeHtml(view.total)}</span></p>
    ${pagosHtml}
  </div>
  <footer class="ticket-digital__foot">Gracias por su visita</footer>
</article>`.trim();
}

/** Documento HTML completo listo para iframe / blob. */
export function documentoTicketDigital(view: Ticket80View): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>${escapeHtml(view.clinica)} — Ticket</title><style>${cssTicketDigital()}</style></head><body>${htmlCuerpoTicketDigital(view)}</body></html>`;
}

export function nombreArchivoPdfTicket(view: Pick<Ticket80View, 'folio' | 'fecha'>): string {
  const folio = String(view.folio || '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const fecha = String(view.fecha || '').replace(/\//g, '-');
  return `ticket-${folio || fecha || 'katzenvet'}.pdf`;
}

/** Texto WhatsApp + aviso de que el PDF se descarga/adjuntará aparte. */
export function textoWhatsAppConAvisoPdf(input: TicketWhatsAppInput): string {
  const base = generarTextoTicketWhatsApp(input);
  return `${base}\n\n📎 Te enviamos también el PDF del ticket (adjúntalo si no se compartió automáticamente).`;
}

export function puedeWebSharePdf(): boolean {
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    if (!nav || typeof nav.share !== 'function') return false;
    const probe = new File([new Blob(['x'], { type: 'application/pdf' })], 't.pdf', {
      type: 'application/pdf',
    });
    if (typeof nav.canShare === 'function') return nav.canShare({ files: [probe] });
    return true;
  } catch {
    return false;
  }
}

/** Genera PDF A4 estrecho con el mismo desglose que el HTML digital. `jspdf` se carga bajo demanda. */
export async function generarPdfTicketBlob(view: Ticket80View): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 18;
  const contentW = pageW - marginX * 2;
  let y = 16;

  doc.setFillColor(10, 150, 155);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(view.clinica || 'KatzenVet', pageW / 2, 12, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Ticket de venta', pageW / 2, 20, { align: 'center' });

  y = 38;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(`Fecha: ${view.fecha}`, marginX, y);
  y += 6;
  if (view.folio) {
    doc.setTextColor(6, 93, 96);
    doc.setFont('helvetica', 'bold');
    doc.text(`Folio ${view.folio}`, marginX, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    y += 6;
  }
  doc.text(`Cliente: ${view.cliente}`, marginX, y);
  y += 6;
  if (view.paciente) {
    doc.text(`Mascota: ${view.paciente}`, marginX, y);
    y += 6;
  }

  y += 2;
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, y, marginX + contentW, y);
  y += 8;

  const lineas = view.lineas.length ? view.lineas : [{ qty: 0, nombre: 'Sin artículos', importe: '', devuelto: false }];
  for (const l of lineas) {
    if (y > 270) {
      doc.addPage();
      y = 16;
    }
    const left = l.qty > 0 ? `${l.qty} × ${l.nombre}${l.devuelto ? ' (devuelto)' : ''}` : l.nombre;
    const leftLines = doc.splitTextToSize(left, contentW - 36);
    doc.setFontSize(10);
    doc.setTextColor(l.devuelto ? 100 : 15, l.devuelto ? 116 : 23, l.devuelto ? 139 : 42);
    doc.text(leftLines, marginX, y);
    if (l.importe) {
      doc.setFont('helvetica', 'bold');
      doc.text(l.importe, marginX + contentW, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
    }
    y += Math.max(6, leftLines.length * 5);
  }

  y += 2;
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, y, marginX + contentW, y);
  y += 8;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);

  const pushRow = (label: string, value: string, bold = false) => {
    if (y > 275) {
      doc.addPage();
      y = 16;
    }
    if (bold) doc.setFont('helvetica', 'bold');
    doc.text(label, marginX, y);
    doc.text(value, marginX + contentW, y, { align: 'right' });
    if (bold) doc.setFont('helvetica', 'normal');
    y += 6;
  };

  if (view.descuento) pushRow('Descuento', view.descuento);
  if (view.devuelto) pushRow('Devoluciones', view.devuelto);
  if (view.iva) pushRow('IVA incluido', view.iva);

  doc.setDrawColor(10, 150, 155);
  doc.setLineWidth(0.6);
  doc.line(marginX, y, marginX + contentW, y);
  y += 8;
  doc.setTextColor(6, 93, 96);
  doc.setFontSize(13);
  pushRow('Total', view.total, true);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  if (view.pagoUnico) pushRow('Pago', view.pagoUnico);
  else if (view.pagos.length) {
    pushRow('Pago mixto', '');
    for (const p of view.pagos) pushRow(p.label, p.monto);
  }
  if (view.recibido) pushRow('Recibido', view.recibido);
  if (view.cambio) pushRow('Cambio', view.cambio);
  if (view.saldoPendiente) pushRow('Saldo pendiente', view.saldoPendiente);

  y += 10;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  doc.text('Gracias por su visita', pageW / 2, y, { align: 'center' });

  return doc.output('blob');
}

export function descargarBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

/** Imprime el diseño digital en iframe oculto (no usa el ticket-80 térmico). */
export function imprimirTicketDigital(view: Ticket80View): void {
  const html = documentoTicketDigital(view);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(iframe);
  const win = iframe.contentWindow;
  const doc = iframe.contentDocument || win?.document;
  if (!win || !doc) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  const cleanup = () => {
    try {
      iframe.remove();
    } catch {
      /* noop */
    }
  };
  const doPrint = () => {
    try {
      win.focus();
      win.print();
    } finally {
      setTimeout(cleanup, 800);
    }
  };
  if (doc.readyState === 'complete') {
    setTimeout(doPrint, 50);
  } else {
    iframe.onload = () => setTimeout(doPrint, 50);
  }
}

export function buildTicketDigitalView(input: TicketWhatsAppInput): Ticket80View {
  return buildTicket80View(input);
}

export async function descargarPdfTicket(input: TicketWhatsAppInput): Promise<string> {
  const view = buildTicketDigitalView(input);
  const fileName = nombreArchivoPdfTicket(view);
  const blob = await generarPdfTicketBlob(view);
  descargarBlob(blob, fileName);
  return fileName;
}

/**
 * Comparte PDF (Web Share) o descarga + abre wa.me con texto.
 * Sin teléfono válido: solo descarga PDF.
 */
export async function compartirTicketWhatsAppPdf(
  input: TicketWhatsAppInput,
  telefono: unknown
): Promise<TicketDigitalShareResult> {
  const view = buildTicketDigitalView(input);
  const fileName = nombreArchivoPdfTicket(view);
  const blob = await generarPdfTicketBlob(view);
  const file = new File([blob], fileName, { type: 'application/pdf' });
  const texto = textoWhatsAppConAvisoPdf(input);
  const waUrl = urlWhatsAppTicket(telefono, texto);

  if (puedeWebSharePdf()) {
    try {
      await navigator.share({
        files: [file],
        title: `${view.clinica} — Ticket`,
        text: texto,
      });
      return { mode: 'web_share', pdfFileName: fileName, waOpened: false };
    } catch (err) {
      const name = err && typeof err === 'object' && 'name' in err ? String((err as { name: string }).name) : '';
      if (name === 'AbortError') {
        return { mode: 'web_share', pdfFileName: fileName, waOpened: false };
      }
      // sigue al fallback
    }
  }

  descargarBlob(blob, fileName);
  if (waUrl) {
    window.open(waUrl, '_blank', 'noopener');
    return { mode: 'download_wa', pdfFileName: fileName, waOpened: true };
  }
  return { mode: 'download_only', pdfFileName: fileName, waOpened: false };
}
