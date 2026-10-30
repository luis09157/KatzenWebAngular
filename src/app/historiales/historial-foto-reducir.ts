/**
 * Spec 116.1 — achica una foto en el navegador antes de subirla (lado mayor 1600 px, JPEG 0.82).
 * Si el navegador no puede leerla (p. ej. HEIC en Chrome de escritorio) regresa el archivo original.
 * Nunca lanza error.
 */
import { LADO_MAX_FOTO, medidasReducidas, nombreComoJpg } from './historial-archivos.util';

function cargarImagen(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

export async function reducirFotoParaSubir(file: File, ladoMax: number = LADO_MAX_FOTO): Promise<File> {
  try {
    const tipo = String(file.type || '').toLowerCase();
    if (!tipo.startsWith('image/') || tipo === 'image/gif' || tipo === 'image/svg+xml') return file;
    const img = await cargarImagen(file);
    const medidas = medidasReducidas(img.naturalWidth, img.naturalHeight, ladoMax);
    // Ya es chica y es JPEG/PNG/WebP: se sube como está.
    if (!medidas && ['image/jpeg', 'image/png', 'image/webp'].includes(tipo)) return file;
    const ancho = medidas?.ancho ?? img.naturalWidth;
    const alto = medidas?.alto ?? img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(img, 0, 0, ancho, alto);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.82));
    if (!blob || blob.size === 0) return file;
    if (blob.size >= file.size && ['image/jpeg', 'image/png', 'image/webp'].includes(tipo)) return file;
    return new File([blob], nombreComoJpg(file.name), { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  }
}
