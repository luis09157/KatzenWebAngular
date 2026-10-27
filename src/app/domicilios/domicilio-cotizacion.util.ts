/**
 * Cotización de domicilio — misma fórmula que KatzenApp (`GasHelper.calcular`), spec 107.
 *
 *   gasolina = km × recorridos ÷ kmPorLitro × precioLitro
 *   sugerido = gasolina × (1 + margen%)      (app: ×1.66 = 66 %, ×1.32 = 32 %)
 *
 * La veterinaria puede cambiar el precio: esto solo sugiere.
 */

export type RedondeoDomicilio = 'centavos' | 'peso' | 'cinco';

export interface TipoDomicilio {
  id: string;
  nombre: string;
  /** Cuántas veces se recorre la distancia (ida y vuelta = 2). */
  recorridos: number;
  /** Ganancia sobre la gasolina, en % (66 = cobrar 1.66 veces la gasolina). */
  margenPct: number;
  activo?: boolean;
  /** Nombre en la app (Semana X2…), para leer el historial viejo. */
  nombreApp?: string;
  orden?: number;
}

export interface TarifasDomicilio {
  precioLitro: number;
  kmPorLitro: number;
  redondeo: RedondeoDomicilio;
  tipos: TipoDomicilio[];
  updated_at?: string;
  updated_by?: string;
}

/** Valores de la app (GasHelper) como punto de partida. */
export function tarifasDomicilioDefault(): TarifasDomicilio {
  return {
    precioLitro: 24.5,
    kmPorLitro: 10,
    redondeo: 'peso',
    tipos: [
      { id: 'ida_vuelta', nombre: 'Ida y vuelta', recorridos: 2, margenPct: 66, activo: true, nombreApp: 'Semana X2', orden: 1 },
      { id: 'llevar_traer', nombre: 'Llevar y traer (2 idas y vueltas)', recorridos: 4, margenPct: 66, activo: true, nombreApp: 'Semana X4', orden: 2 },
      { id: 'campana', nombre: 'Campaña', recorridos: 4, margenPct: 32, activo: true, nombreApp: 'Campaña', orden: 3 },
      { id: 'ruta', nombre: 'Ruta', recorridos: 2, margenPct: 32, activo: true, nombreApp: 'Ruta', orden: 4 },
      { id: 'moto', nombre: 'Moto', recorridos: 2, margenPct: 66, activo: true, nombreApp: 'Moto', orden: 5 },
    ],
  };
}

function num(v: unknown, def = 0): number {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : def;
}

/** Normaliza lo leído de RTDB (puede venir incompleto, como mapa o con strings). */
export function normalizarTarifasDomicilio(raw: unknown): TarifasDomicilio {
  const base = tarifasDomicilioDefault();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const tiposRaw = r['tipos'];
  const lista: unknown[] = Array.isArray(tiposRaw)
    ? tiposRaw
    : tiposRaw && typeof tiposRaw === 'object'
      ? Object.entries(tiposRaw as Record<string, unknown>).map(([id, v]) => ({ id, ...(v as object) }))
      : [];
  const tipos: TipoDomicilio[] = lista
    .map((t) => t as Record<string, unknown>)
    .filter((t) => t && String(t['id'] || '').trim())
    .map((t, i) => ({
      id: String(t['id']),
      nombre: String(t['nombre'] || t['id']),
      recorridos: Math.max(1, num(t['recorridos'], 2)),
      margenPct: Math.max(0, num(t['margenPct'], 0)),
      activo: t['activo'] !== false,
      nombreApp: t['nombreApp'] ? String(t['nombreApp']) : undefined,
      orden: num(t['orden'], i + 1),
    }))
    .sort((a, b) => (a.orden || 0) - (b.orden || 0));
  const redondeo = String(r['redondeo'] || '');
  return {
    precioLitro: num(r['precioLitro'], base.precioLitro) > 0 ? num(r['precioLitro'], base.precioLitro) : base.precioLitro,
    kmPorLitro: num(r['kmPorLitro'], base.kmPorLitro) > 0 ? num(r['kmPorLitro'], base.kmPorLitro) : base.kmPorLitro,
    redondeo: redondeo === 'centavos' || redondeo === 'cinco' || redondeo === 'peso' ? redondeo : base.redondeo,
    tipos: tipos.length ? tipos : base.tipos,
    updated_at: r['updated_at'] ? String(r['updated_at']) : undefined,
    updated_by: r['updated_by'] ? String(r['updated_by']) : undefined,
  };
}

export function redondearPrecioDomicilio(valor: number, modo: RedondeoDomicilio): number {
  const v = Math.max(0, num(valor));
  if (modo === 'peso') return Math.ceil(v - 1e-9);
  if (modo === 'cinco') return Math.ceil(v / 5 - 1e-9) * 5;
  // Como la app: trunca a centavos (RoundingMode.DOWN).
  return Math.floor(v * 100) / 100;
}

export interface CotizacionDomicilio {
  km: number;
  tipo: TipoDomicilio;
  kmRecorridos: number;
  litros: number;
  costoGasolina: number;
  /** Antes de redondear (como la app). */
  precioCalculado: number;
  precioSugerido: number;
  gananciaSugerida: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function cotizarDomicilio(km: unknown, tipo: TipoDomicilio, t: TarifasDomicilio): CotizacionDomicilio {
  const k = Math.max(0, num(km));
  const kmRecorridos = k * Math.max(1, num(tipo?.recorridos, 2));
  const litros = kmRecorridos / (t.kmPorLitro > 0 ? t.kmPorLitro : 10);
  const costoGasolina = litros * t.precioLitro;
  // toFixed: 66 % → 1.66 exacto como en la app (evita 1.6600000000000001).
  const factor = Number((1 + Math.max(0, num(tipo?.margenPct)) / 100).toFixed(6));
  const precioCalculado = costoGasolina * factor;
  const precioSugerido = k > 0 ? redondearPrecioDomicilio(precioCalculado, t.redondeo) : 0;
  return {
    km: k,
    tipo,
    kmRecorridos: r2(kmRecorridos),
    litros: r2(litros),
    costoGasolina: r2(costoGasolina),
    precioCalculado: Math.floor(precioCalculado * 100) / 100,
    precioSugerido,
    gananciaSugerida: r2(precioSugerido - costoGasolina),
  };
}

/** Ganancia real con el precio que puso la veterinaria. */
export function gananciaDomicilio(precio: unknown, costoGasolina: unknown): number {
  return r2(num(precio) - num(costoGasolina));
}

/** «2.9», «2,9 km», 2.9 → 2.9; vacío o inválido → 0. */
export function kmDesdeTexto(v: unknown): number {
  const m = String(v ?? '').replace(',', '.').match(/\d+(\.\d+)?/);
  return m ? Math.max(0, Number(m[0])) : 0;
}
