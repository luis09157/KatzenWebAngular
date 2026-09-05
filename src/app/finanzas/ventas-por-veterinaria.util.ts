import { Visita } from '../visitas/visitas.models';

export interface VentaPorVeterinaria {
  nombre: string;
  tickets: number;
  total: number;
  pagado: number;
}

const SIN_ASIGNAR = 'Sin asignar';

/** Agrupa visitas del día por `atendidoPorNombre` (035 / 071). */
export function agruparVentasPorVeterinaria(
  visitas:
    | Array<Pick<Visita, 'fecha' | 'estado' | 'activo' | 'atendidoPorNombre' | 'total' | 'pagado'> | null | undefined>
    | null
    | undefined,
  fecha: string
): VentaPorVeterinaria[] {
  const f = String(fecha || '').slice(0, 10);
  const map = new Map<string, VentaPorVeterinaria>();
  for (const v of visitas || []) {
    if (!v || v.activo === false || v.estado === 'cancelada') continue;
    if (String(v.fecha || '').slice(0, 10) !== f) continue;
    const nombre = String(v.atendidoPorNombre || '').trim() || SIN_ASIGNAR;
    const cur = map.get(nombre) || { nombre, tickets: 0, total: 0, pagado: 0 };
    cur.tickets += 1;
    cur.total += Number(v.total) || 0;
    cur.pagado += Number(v.pagado) || 0;
    map.set(nombre, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.pagado - a.pagado || b.total - a.total);
}

export function resumenCxcClientes(
  clientes: Array<{ saldoPendiente?: number } | null | undefined> | null | undefined
): { deudores: number; total: number } {
  let deudores = 0;
  let total = 0;
  for (const c of clientes || []) {
    const s = Math.max(0, Number(c?.saldoPendiente) || 0);
    if (s > 0) {
      deudores += 1;
      total += s;
    }
  }
  return { deudores, total: Math.round(total * 100) / 100 };
}
