import { CategoriaProducto, UnidadMedida } from '../../shared/inventario.models';
import * as QrCodeLib from 'qrcode';

const CODIGO_INTERNO_RE = /^KZ-[A-Z]{2,4}-\d{6}-[A-Z0-9]{4}$/;

const PREFIJO_CATEGORIA: Record<string, string> = {
  medicamento: 'MED',
  vacuna: 'VAC',
  quirurgico: 'QUI',
  alimento: 'ALI',
  peluqueria: 'PEL',
  diagnostico: 'DIA',
  accesorio: 'ACC'
};

export const ETIQUETA_CATEGORIA_PRODUCTO: Record<CategoriaProducto, string> = {
  medicamento: 'Medicamento',
  vacuna: 'Vacuna',
  quirurgico: 'Quirúrgico',
  alimento: 'Alimento',
  peluqueria: 'Peluquería',
  diagnostico: 'Diagnóstico',
  accesorio: 'Accesorio'
};

export const ETIQUETA_UNIDAD_MEDIDA: Record<UnidadMedida, string> = {
  unidad: 'Unidad',
  ml: 'Mililitros (ml)',
  gr: 'Gramos (g)',
  kg: 'Kilogramos (kg)',
  litro: 'Litros',
  caja: 'Caja',
  paquete: 'Paquete',
  tableta: 'Tableta',
  capsula: 'Cápsula',
  frasco: 'Frasco',
  dosis: 'Dosis'
};

export interface PresetProductoClinica {
  unidad: UnidadMedida;
  requiere_refrigeracion: boolean;
  fecha_caducidad_alerta_dias: number;
  presentacion: string;
  subcategoriaHint: string;
}

type QrApi = {
  toDataURL: (
    text: string,
    opts?: { width?: number; margin?: number; errorCorrectionLevel?: string }
  ) => Promise<string>;
};

function qrApi(): QrApi {
  const mod = QrCodeLib as unknown as QrApi & { default?: QrApi };
  if (typeof mod.toDataURL === 'function') return mod;
  if (mod.default && typeof mod.default.toDataURL === 'function') return mod.default;
  throw new Error('No se pudo cargar el generador de QR');
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function esCodigoInternoKatzen(codigo: string | null | undefined): boolean {
  return CODIGO_INTERNO_RE.test(String(codigo || '').trim().toUpperCase());
}

export function generarCodigoInternoProducto(
  categoria: CategoriaProducto | string,
  opts?: { now?: Date; aleatorio?: string }
): string {
  const prefix = PREFIJO_CATEGORIA[String(categoria || '').toLowerCase()] || 'GEN';
  const d = opts?.now ?? new Date();
  const ymd = `${String(d.getFullYear()).slice(-2)}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
  const raw = (opts?.aleatorio ?? Math.random().toString(36).slice(2, 6)).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
  const rand = (raw + 'XXXX').slice(0, 4);
  return `KZ-${prefix}-${ymd}-${rand}`;
}

export function presetProductoPorCategoria(categoria: CategoriaProducto | string): PresetProductoClinica {
  switch (String(categoria || '').toLowerCase()) {
    case 'medicamento':
      return {
        unidad: 'tableta',
        requiere_refrigeracion: false,
        fecha_caducidad_alerta_dias: 90,
        presentacion: 'Caja',
        subcategoriaHint: 'Antibiótico, analgésico, antiparasitario…'
      };
    case 'vacuna':
      return {
        unidad: 'dosis',
        requiere_refrigeracion: true,
        fecha_caducidad_alerta_dias: 60,
        presentacion: 'Frasco',
        subcategoriaHint: 'Antirrábica, triple felina, séxtuple…'
      };
    case 'alimento':
      return {
        unidad: 'kg',
        requiere_refrigeracion: false,
        fecha_caducidad_alerta_dias: 90,
        presentacion: 'Bolsa',
        subcategoriaHint: 'Croquetas, húmedo, prescripción…'
      };
    case 'peluqueria':
      return {
        unidad: 'ml',
        requiere_refrigeracion: false,
        fecha_caducidad_alerta_dias: 180,
        presentacion: 'Frasco',
        subcategoriaHint: 'Shampoo, acondicionador, colonia…'
      };
    case 'quirurgico':
      return {
        unidad: 'unidad',
        requiere_refrigeracion: false,
        fecha_caducidad_alerta_dias: 365,
        presentacion: 'Pieza',
        subcategoriaHint: 'Jeringa, sutura, gasa, catéter…'
      };
    case 'diagnostico':
      return {
        unidad: 'unidad',
        requiere_refrigeracion: false,
        fecha_caducidad_alerta_dias: 180,
        presentacion: 'Caja',
        subcategoriaHint: 'Tiras, reactivos, pruebas rápidas…'
      };
    case 'accesorio':
    default:
      return {
        unidad: 'unidad',
        requiere_refrigeracion: false,
        fecha_caducidad_alerta_dias: 365,
        presentacion: 'Pieza',
        subcategoriaHint: 'Collar, transportadora, juguete…'
      };
  }
}

export function etiquetaCategoriaProducto(categoria: string | null | undefined): string {
  const key = String(categoria || '') as CategoriaProducto;
  return ETIQUETA_CATEGORIA_PRODUCTO[key] || String(categoria || '—');
}

export function etiquetaUnidadMedida(unidad: string | null | undefined): string {
  const key = String(unidad || '') as UnidadMedida;
  return ETIQUETA_UNIDAD_MEDIDA[key] || String(unidad || '—');
}

export function marcaProductoODefault(marca: string | null | undefined): string {
  const t = String(marca || '').trim();
  return t || 'S/M';
}

export async function generarQrDataUrl(payload: string): Promise<string> {
  const texto = String(payload || '').trim();
  if (texto.length < 3) return '';
  return qrApi().toDataURL(texto, {
    width: 240,
    margin: 1,
    errorCorrectionLevel: 'M'
  });
}

function escapeHtml(value: string): string {
  return String(value).replace(/[&<>"']/g, ch => {
    switch (ch) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}

export function imprimirEtiquetaProducto(opts: {
  nombre: string;
  codigo: string;
  presentacion?: string;
  qrDataUrl: string;
}): void {
  const w = window.open('', '_blank', 'width=420,height=560');
  if (!w) return;
  const nombre = escapeHtml(opts.nombre || 'Producto');
  const codigo = escapeHtml(opts.codigo || '');
  const presentacion = escapeHtml(opts.presentacion || '');
  w.document.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Etiqueta ${codigo}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
    .label { width: 280px; border: 1px solid #ddd; border-radius: 12px; padding: 16px; text-align: center; }
    h1 { font-size: 13px; letter-spacing: .12em; text-transform: uppercase; margin: 0 0 8px; color: #065d60; }
    h2 { font-size: 16px; margin: 0 0 4px; }
    p { margin: 0 0 12px; font-size: 12px; color: #555; }
    img { width: 180px; height: 180px; }
    code { font-size: 13px; letter-spacing: .04em; }
  </style>
</head>
<body>
  <div class="label">
    <h1>KatzenVet</h1>
    <h2>${nombre}</h2>
    <p>${presentacion}</p>
    <img src="${escapeHtml(opts.qrDataUrl)}" alt="QR ${codigo}">
    <p><code>${codigo}</code></p>
  </div>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`);
  w.document.close();
}
