/**
 * Spec 116.2 — PDF A4 de la receta (jspdf bajo demanda). Si el texto es largo, sigue en otra hoja.
 * Compartir/abrir lo decide la veterinaria con un botón; nada se manda solo.
 */
import { descargarBlob, puedeWebSharePdf } from '../visitas/ticket-digital.util';
import { RecetaView } from './receta-documento.util';

interface JsPdfLike {
  internal: { pageSize: { getWidth(): number; getHeight(): number } };
  setFontSize(size: number): void;
  splitTextToSize(text: string, maxWidth: number): string[];
  setFillColor(r: number, g: number, b: number): void;
  rect(x: number, y: number, w: number, h: number, style: string): void;
  setTextColor(r: number, g: number, b: number): void;
  setFont(name: string, style: string): void;
  text(text: string | string[], x: number, y: number, opts?: { align?: string }): void;
  setDrawColor(r: number, g: number, b: number): void;
  setLineWidth(w: number): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  addPage(): void;
  output(type: 'blob'): Blob;
}

const M = 16; // margen
const LINEA = 5.4;

export async function generarPdfRecetaBlob(v: RecetaView): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' }) as unknown as JsPdfLike;
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const ancho = W - M * 2;
  const abajo = H - 28;

  // Encabezado
  doc.setFillColor(10, 150, 155);
  doc.rect(0, 0, W, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(v.clinica, M, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Receta e indicaciones', M, 18);
  doc.text(v.fecha, W - M, 18, { align: 'right' });

  // Datos de la mascota
  let y = 34;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(v.paciente, M, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const meta = [v.pacienteDetalle, v.peso ? `Peso: ${v.peso}` : '', v.expediente ? `Exp. ${v.expediente}` : '']
    .filter(Boolean)
    .join('   ·   ');
  if (meta) {
    y += 6;
    doc.text(doc.splitTextToSize(meta, ancho), M, y);
  }
  if (v.dueno) {
    y += 5.5;
    doc.text(`Dueño: ${v.dueno}`, M, y);
  }
  y += 5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(M, y, W - M, y);
  y += 9;

  const seccion = (titulo: string, cuerpo: string) => {
    if (!cuerpo) return;
    if (y > abajo - 14) {
      doc.addPage();
      y = M + 4;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(6, 93, 96);
    doc.text(titulo, M, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11.5);
    doc.setTextColor(15, 23, 42);
    for (const parrafo of cuerpo.split('\n')) {
      const lineas = parrafo.trim() ? doc.splitTextToSize(parrafo, ancho) : [''];
      for (const l of lineas) {
        if (y > abajo) {
          doc.addPage();
          y = M + 4;
        }
        doc.text(l, M, y);
        y += LINEA;
      }
    }
    y += 6;
  };

  seccion('Receta', v.receta);
  seccion('Indicaciones', v.indicaciones);

  // Firma
  if (y > abajo - 10) {
    doc.addPage();
    y = M + 4;
  }
  const yFirma = Math.max(y + 18, abajo - 4);
  doc.setDrawColor(148, 163, 184);
  doc.line(W - M - 70, yFirma, W - M, yFirma);
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(v.veterinario || 'Médico veterinario', W - M - 35, yFirma + 5, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Ante cualquier reacción o duda, comuníquese con la clínica.', W / 2, H - 10, { align: 'center' });

  return doc.output('blob');
}

export type RecetaPdfModo = 'compartido' | 'abierto' | 'descargado';

/**
 * Celular con compartir: abre el menú del sistema (WhatsApp, imprimir, guardar…).
 * Computadora: abre el PDF en otra pestaña para imprimir; si el navegador lo bloquea, lo descarga.
 * `ventana` se abre antes de generar el PDF (los navegadores bloquean ventanas abiertas después de esperar).
 */
export async function abrirOCompartirPdfReceta(
  v: RecetaView,
  nombreArchivo: string,
  ventana: Window | null
): Promise<RecetaPdfModo> {
  const blob = await generarPdfRecetaBlob(v);
  const file = new File([blob], nombreArchivo, { type: 'application/pdf' });

  if (!ventana && puedeWebSharePdf()) {
    try {
      await navigator.share({ files: [file], title: `Receta de ${v.paciente}` });
      return 'compartido';
    } catch (err) {
      const name = err && typeof err === 'object' && 'name' in err ? String((err as { name: string }).name) : '';
      if (name === 'AbortError') return 'compartido';
    }
  }

  if (ventana && !ventana.closed) {
    const url = URL.createObjectURL(blob);
    ventana.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return 'abierto';
  }

  descargarBlob(blob, nombreArchivo);
  return 'descargado';
}
