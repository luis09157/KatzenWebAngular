/**
 * Servicios guardados como producto en Inventario (2026-10-26, spec 100).
 * Detecta artículos sin stock que en realidad son servicios y propone a dónde van.
 * Solo propone: la persona elige y confirma en «Servicios en inventario».
 */
import { TipoServicioClinica } from '../servicios-clinica/servicios-clinica.models';

export type DestinoServicioInventario = 'catalogo_nuevo' | 'catalogo_existente' | 'peluqueria' | 'pension';

export const DESTINO_SERVICIO_LABELS: Record<DestinoServicioInventario, string> = {
  catalogo_nuevo: 'Nuevo en Catálogo de servicios',
  catalogo_existente: 'Ya está en el catálogo (solo se oculta)',
  peluqueria: 'Peluquería (precio al momento)',
  pension: 'Pensión (usa sus tarifas)',
};

export interface ProductoLike {
  id?: string;
  nombre?: string;
  categoria?: string;
  stock_actual?: number | string;
  precio_venta?: number | string;
  precio_compra?: number | string;
  iva_aplicable?: boolean;
  tasa_iva?: number | string;
  activo?: boolean;
}

export interface ServicioLike {
  id?: string;
  nombre?: string;
  activo?: boolean;
}

export interface CandidatoServicioInventario {
  productoId: string;
  nombre: string;
  categoria: string;
  precioVenta: number;
  precioCosto: number;
  aplicaIva: boolean;
  tasaIva: number;
  destino: DestinoServicioInventario;
  /** Solo `catalogo_nuevo`. */
  tipoServicio?: TipoServicioClinica;
  /** Nombre del servicio que ya existe (solo `catalogo_existente`). */
  servicioExistente?: string;
  /** Marcado por defecto en la lista. */
  sugeridoMover: boolean;
  /** Por qué no se marca por defecto. */
  motivoNoMover?: string;
}

const PALABRAS_SERVICIO =
  /ba[ñn]o|consulta|castraci|esteriliz|eutanasia|hospitaliz|profilaxis|ultrasonido|ecograf|radiograf|pensi[oó]n|desparasitaci|aplicaci[oó]n|cirug|curaci|sutura|biometr|ex[aá]men|snap|citolog|hisopado|an[aá]lisis|domicilio|anticipo|vacunaci[oó]n|corte de u[ñn]as|cremaci|servicio|honorario/i;
const PARECE_PRODUCTO = /espuma|deslanador|shampoo|champ[uú]|cepillo|perfume|collar|correa|\b\d+(\.\d+)?\s?(g|gr|ml|kg|lt|l)\b/i;
const PRUEBA_O_REVISAR = /^\d+\s*-/;
const DIAGNOSTICO = /radiograf|ultrason|ecograf|snap|ex[aá]men|biometr|citolog|hisopado|an[aá]lisis|prueba|test/i;

const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();

function tipoPara(nombre: string): TipoServicioClinica {
  if (/^consulta/i.test(nombre)) return 'consulta';
  if (DIAGNOSTICO.test(nombre)) return 'diagnostico';
  if (/cremaci|domicilio|anticipo/i.test(nombre)) return 'otro';
  return 'procedimiento';
}

/** Servicio del catálogo con el mismo nombre, o que empieza igual («Consulta» → «Consulta General»). */
function existenteEnCatalogo(nombre: string, servicios: ServicioLike[]): ServicioLike | undefined {
  const n = norm(nombre);
  return (
    servicios.find((s) => norm(s.nombre) === n) || servicios.find((s) => norm(s.nombre).startsWith(n + ' '))
  );
}

export function detectarServiciosEnInventario(
  productos: Array<ProductoLike & { id?: string }> | Record<string, ProductoLike> | null | undefined,
  servicios: ServicioLike[] | Record<string, ServicioLike> | null | undefined
): CandidatoServicioInventario[] {
  const prods = Array.isArray(productos)
    ? productos
    : Object.entries(productos || {}).map(([id, p]) => ({ ...p, id: p?.id || id }));
  const servs = (Array.isArray(servicios) ? servicios : Object.values(servicios || {})).filter(
    (s) => s && s.activo !== false
  );
  const out: CandidatoServicioInventario[] = [];
  for (const p of prods) {
    if (!p || p.activo === false || !p.id) continue;
    if ((Number(p.stock_actual) || 0) > 0) continue;
    const nombre = String(p.nombre || '').trim();
    const categoria = norm(p.categoria);
    const esServicio = categoria === 'peluqueria' || categoria === 'diagnostico' || PALABRAS_SERVICIO.test(nombre);
    if (!esServicio || !nombre) continue;

    let motivoNoMover: string | undefined;
    if (PARECE_PRODUCTO.test(nombre)) motivoNoMover = 'Parece producto (se vende por pieza)';
    else if (PRUEBA_O_REVISAR.test(nombre)) motivoNoMover = 'Revisar con la clínica antes de moverlo';

    const existente = existenteEnCatalogo(nombre, servs);
    let destino: DestinoServicioInventario;
    if (existente) destino = 'catalogo_existente';
    else if (/^pensi[oó]n/i.test(nombre)) destino = 'pension';
    else if (categoria === 'peluqueria' && /ba[ñn]o/i.test(nombre)) destino = 'peluqueria';
    else destino = 'catalogo_nuevo';

    const aplicaIva = p.iva_aplicable !== false;
    out.push({
      productoId: p.id,
      nombre,
      categoria,
      precioVenta: Math.max(0, Number(p.precio_venta) || 0),
      precioCosto: Math.max(0, Number(p.precio_compra) || 0),
      aplicaIva,
      tasaIva: aplicaIva ? Number(p.tasa_iva) || 16 : 0,
      destino,
      tipoServicio: destino === 'catalogo_nuevo' ? tipoPara(nombre) : undefined,
      servicioExistente: existente?.nombre,
      sugeridoMover: !motivoNoMover,
      motivoNoMover,
    });
  }
  return out.sort((a, b) => a.destino.localeCompare(b.destino) || a.nombre.localeCompare(b.nombre));
}
