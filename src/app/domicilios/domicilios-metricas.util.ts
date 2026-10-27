/**
 * Spec 107 — historial y métricas de domicilios.
 * Junta (solo lectura): baños y citas con `domicilio`, líneas «Domicilio» sueltas del ticket
 * y los viajes viejos de la app (`Katzen/Gasolina`).
 */

export type FuenteDomicilio = 'peluqueria' | 'cita' | 'caja' | 'app';

export const FUENTE_DOMICILIO_LABELS: Record<FuenteDomicilio, string> = {
  peluqueria: 'Peluquería',
  cita: 'Cita',
  caja: 'Cobrar',
  app: 'App (historial)',
};

export interface FilaDomicilio {
  /** YYYY-MM-DD */
  fecha: string;
  fuente: FuenteDomicilio;
  cliente: string;
  clienteId?: string;
  paciente: string;
  direccion: string;
  colonia: string;
  km: number;
  tipo: string;
  costo: number;
  precio: number;
  ganancia: number;
  quien: string;
}

type Obj = Record<string, unknown>;
const s = (v: unknown) => String(v ?? '').trim();
const n = (v: unknown) => {
  const x = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(x) ? x : 0;
};
const r2 = (x: number) => Math.round(x * 100) / 100;

function iso(v: unknown): string {
  const t = s(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  // App: «d-MM-yyyy» o «dd-MM-yyyy» (también con «/»).
  const m = t.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return '';
}

function desdeDomicilio(
  dom: Obj,
  base: { fecha: unknown; fuente: FuenteDomicilio; cliente: unknown; clienteId?: unknown; paciente: unknown; quien: unknown }
): FilaDomicilio | null {
  const km = n(dom['km']);
  const precio = n(dom['precio']);
  if (!(km > 0) && !(precio > 0)) return null;
  const costo = n(dom['costoGasolina']);
  return {
    fecha: iso(base.fecha) || iso(dom['cotizadoEn']),
    fuente: base.fuente,
    cliente: s(base.cliente),
    clienteId: s(base.clienteId) || undefined,
    paciente: s(base.paciente),
    direccion: s(dom['direccion']),
    colonia: s(dom['colonia']),
    km,
    tipo: s(dom['tipoNombre']),
    costo: r2(costo),
    precio: r2(precio),
    ganancia: r2(precio - costo),
    quien: s(base.quien) || s(dom['cotizadoPor']),
  };
}

export function filasDesdeBanios(banios: Obj[] | null | undefined): FilaDomicilio[] {
  return (banios || [])
    .filter((b) => b && b['activo'] !== false && s(b['estado']).toLowerCase() !== 'cancelado')
    .map((b) =>
      b['domicilio'] && typeof b['domicilio'] === 'object'
        ? desdeDomicilio(b['domicilio'] as Obj, {
            fecha: b['fecha_banio'],
            fuente: 'peluqueria',
            cliente: b['cliente'],
            clienteId: b['cliente_id'],
            paciente: b['paciente'],
            quien: b['peluquero'],
          })
        : null
    )
    .filter((x): x is FilaDomicilio => !!x);
}

export function filasDesdeCitas(citas: Obj[] | null | undefined): FilaDomicilio[] {
  return (citas || [])
    .filter((c) => c && c['activo'] !== false && s(c['estado']).toLowerCase() !== 'cancelada')
    .map((c) =>
      c['domicilio'] && typeof c['domicilio'] === 'object'
        ? desdeDomicilio(c['domicilio'] as Obj, {
            fecha: c['fecha'] || c['fecha_hora'],
            fuente: 'cita',
            cliente: c['nombreCliente'] || c['cliente'],
            clienteId: c['cliente_id'],
            paciente: c['paciente'],
            quien: c['veterinario'],
          })
        : null
    )
    .filter((x): x is FilaDomicilio => !!x);
}

/** Líneas «Domicilio» sueltas (las de baño/cita ya cuentan arriba). */
export function filasDesdeVisitas(visitas: Obj[] | null | undefined): FilaDomicilio[] {
  const out: FilaDomicilio[] = [];
  for (const v of visitas || []) {
    if (!v || s(v['estado']).toLowerCase() === 'cancelada') continue;
    const lineas = Array.isArray(v['lineas']) ? (v['lineas'] as Obj[]) : Object.values((v['lineas'] as Obj) || {});
    for (const l of lineas as Obj[]) {
      if (!l || l['categoria'] !== 'domicilio' || l['domicilioDe'] || l['fueDevuelto']) continue;
      const dom = (l['domicilio'] as Obj) || { precio: l['monto'], costoGasolina: l['costo'] };
      const fila = desdeDomicilio(dom, {
        fecha: v['fecha'],
        fuente: 'caja',
        cliente: v['cliente'],
        clienteId: v['cliente_id'],
        paciente: v['paciente'],
        quien: '',
      });
      if (fila) out.push(fila);
    }
  }
  return out;
}

/** Viajes de la app: Katzen/Gasolina/{año}/{MM-año}/cargos/{fecha}/{id}. */
export function filasDesdeGasolinaApp(raiz: unknown): FilaDomicilio[] {
  const out: FilaDomicilio[] = [];
  const walk = (o: unknown) => {
    if (!o || typeof o !== 'object') return;
    const r = o as Obj;
    if ('kilometros' in r && 'categoria' in r) {
      out.push({
        fecha: iso(r['fecha']),
        fuente: 'app',
        cliente: s(r['nombreCliente']),
        clienteId: s(r['idCliente']) || undefined,
        paciente: s(r['nombreDomicilio']),
        direccion: s(r['domicilio']),
        colonia: '',
        km: n(r['kilometros']),
        tipo: s(r['categoria']),
        costo: r2(n(r['costo'])),
        precio: r2(n(r['venta'])),
        ganancia: r2(n(r['ganancia']) || n(r['venta']) - n(r['costo'])),
        quien: 'App',
      });
      return;
    }
    Object.values(r).forEach(walk);
  };
  walk(raiz);
  return out.filter((f) => f.fecha);
}

/** Completa colonia desde la ficha del cliente cuando el viaje no la trae. */
export function completarColonias(filas: FilaDomicilio[], coloniaPorCliente: ReadonlyMap<string, string>): FilaDomicilio[] {
  return filas.map((f) =>
    f.colonia || !f.clienteId ? f : { ...f, colonia: coloniaPorCliente.get(f.clienteId) || '' }
  );
}

export interface ResumenDomicilios {
  total: number;
  km: number;
  costo: number;
  precio: number;
  ganancia: number;
}

export function resumir(filas: FilaDomicilio[]): ResumenDomicilios {
  return filas.reduce(
    (a, f) => ({
      total: a.total + 1,
      km: r2(a.km + f.km),
      costo: r2(a.costo + f.costo),
      precio: r2(a.precio + f.precio),
      ganancia: r2(a.ganancia + f.ganancia),
    }),
    { total: 0, km: 0, costo: 0, precio: 0, ganancia: 0 }
  );
}

export interface GrupoDomicilios extends ResumenDomicilios {
  clave: string;
  etiqueta: string;
}

export function agrupar(
  filas: FilaDomicilio[],
  clave: (f: FilaDomicilio) => string,
  etiqueta: (k: string) => string = (k) => k
): GrupoDomicilios[] {
  const m = new Map<string, FilaDomicilio[]>();
  for (const f of filas) {
    const k = clave(f) || 'Sin dato';
    m.set(k, [...(m.get(k) || []), f]);
  }
  return [...m.entries()].map(([k, fs]) => ({ clave: k, etiqueta: etiqueta(k), ...resumir(fs) }));
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Los 12 meses del año (aunque estén en cero) para la gráfica. */
export function porMes(filas: FilaDomicilio[], anio: string): GrupoDomicilios[] {
  const delAnio = filas.filter((f) => f.fecha.startsWith(`${anio}-`));
  const grupos = new Map<string, GrupoDomicilios>(
    agrupar(delAnio, (f) => f.fecha.slice(5, 7)).map((g) => [g.clave, g] as [string, GrupoDomicilios])
  );
  return MESES.map((m, i) => {
    const k = String(i + 1).padStart(2, '0');
    return grupos.get(k) || { clave: k, etiqueta: m, total: 0, km: 0, costo: 0, precio: 0, ganancia: 0 };
  }).map((g, i) => ({ ...g, etiqueta: MESES[i] }));
}

export function top(grupos: GrupoDomicilios[], cuantos = 5): GrupoDomicilios[] {
  return [...grupos].sort((a, b) => b.total - a.total || b.precio - a.precio).slice(0, cuantos);
}
