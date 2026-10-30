/**
 * Spec 116.1 — fotos y estudios del expediente (consulta).
 * Funciones puras: leer la lista guardada (cualquier formato legacy), distinguir foto de PDF,
 * armar el nombre en Storage y calcular el tamaño reducido de una foto.
 * Formato que se guarda: `archivos: string[]` (URLs de descarga), igual que antes.
 */

/** Máximo de fotos/archivos por consulta. */
export const MAX_ARCHIVOS_HISTORIAL = 10;
/** Lado mayor de una foto al subirla (px). */
export const LADO_MAX_FOTO = 1600;
/** Límite de Storage para `historiales_clinicos` (storage.rules). */
export const MAX_BYTES_STORAGE_HISTORIAL = 10 * 1024 * 1024;
/** Fotos más grandes que esto ni se intentan (el celular no debería producirlas). */
export const MAX_BYTES_FOTO_ORIGINAL = 40 * 1024 * 1024;

const EXT_IMAGEN = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'bmp'];

/** Lista guardada → `string[]` sin vacíos. Acepta array, objeto `{k: url}` o un solo texto. */
export function normalizarArchivosHistorial(valor: unknown): string[] {
  let lista: unknown[] = [];
  if (Array.isArray(valor)) lista = valor;
  else if (valor && typeof valor === 'object') lista = Object.values(valor as Record<string, unknown>);
  else if (typeof valor === 'string') lista = [valor];
  const out: string[] = [];
  for (const v of lista) {
    const s = typeof v === 'string' ? v.trim() : '';
    if (s && !out.includes(s)) out.push(s);
  }
  return out;
}

/** Nombre del archivo dentro de una URL de Firebase Storage (o ruta simple). */
export function nombreArchivoDeUrl(url: string): string {
  const s = String(url || '');
  let ruta = s;
  const i = s.indexOf('/o/');
  if (i >= 0) ruta = s.slice(i + 3);
  ruta = ruta.split('?')[0].split('#')[0];
  try {
    ruta = decodeURIComponent(ruta);
  } catch {
    /* se queda como viene */
  }
  const partes = ruta.split('/');
  return partes[partes.length - 1] || '';
}

function extension(nombre: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(nombre || '');
  return m ? m[1].toLowerCase() : '';
}

/** ¿La URL guardada es una foto (se puede mostrar como miniatura)? */
export function esImagenArchivoHistorial(url: string): boolean {
  return EXT_IMAGEN.includes(extension(nombreArchivoDeUrl(url)));
}

/** Nombre para mostrar: sin el prefijo de tiempo que se agrega al subir. */
export function nombreVisibleArchivo(url: string, indice: number): string {
  const nombre = nombreArchivoDeUrl(url).replace(/^\d{10,}_(\d+_)?/, '');
  return nombre || `Archivo ${indice + 1}`;
}

/** ¿Es un tipo de archivo que se puede adjuntar? (foto de cualquier tipo o PDF) */
export function esTipoPermitidoHistorial(tipo: string, nombre = ''): boolean {
  const t = String(tipo || '').toLowerCase();
  if (t.startsWith('image/')) return true;
  if (t === 'application/pdf') return true;
  // Algunos celulares no mandan tipo: decidir por extensión.
  if (!t) {
    const ext = extension(nombre);
    return ext === 'pdf' || EXT_IMAGEN.includes(ext);
  }
  return false;
}

/** Nombre seguro para Storage: `{timestamp}_{n}_{nombre-sin-espacios}`. */
export function nombreStorageArchivo(nombreOriginal: string, timestamp: number, n: number): string {
  const limpio =
    String(nombreOriginal || 'foto')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(-60) || 'foto';
  return `${timestamp}_${n}_${limpio}`;
}

/** Cambia la extensión a `.jpg` (la foto reducida siempre sale en JPEG). */
export function nombreComoJpg(nombre: string): string {
  const base = String(nombre || 'foto').replace(/\.[a-z0-9]+$/i, '');
  return `${base || 'foto'}.jpg`;
}

/** Medidas reducidas manteniendo proporción; `null` si ya es suficientemente chica. */
export function medidasReducidas(
  ancho: number,
  alto: number,
  ladoMax: number = LADO_MAX_FOTO
): { ancho: number; alto: number } | null {
  if (!(ancho > 0) || !(alto > 0)) return null;
  const mayor = Math.max(ancho, alto);
  if (mayor <= ladoMax) return null;
  const f = ladoMax / mayor;
  return { ancho: Math.max(1, Math.round(ancho * f)), alto: Math.max(1, Math.round(alto * f)) };
}
