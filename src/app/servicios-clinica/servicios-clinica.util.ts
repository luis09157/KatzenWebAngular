import { VisitaLineaCategoria } from '../visitas/visitas.models';
import { esVentaMayorQueCosto } from '../core/utils/precio-margen.util';
import {
  ServicioClinica,
  TipoServicioClinica,
  TIPO_SERVICIO_CLINICA_LABELS,
  TIPOS_SERVICIO_CLINICA,
} from './servicios-clinica.models';

export const COPY_PRECIO_SERVICIO = 'Precio de servicio';

export const COPY_BANIO_EN_FINANZAS = 'Las tarifas de baño se editan en Finanzas. No forman parte de este catálogo.';

export type DecisionPrecioServicio = {
  pedirMonto: false;
  monto: number;
  servicio: ServicioClinica;
};

export type DecisionServicioClinica =
  | DecisionPrecioServicio
  | { pedirMonto: true; motivo: 'sin_precio'; servicio: ServicioClinica }
  | { pedirMonto: false; error: 'inactivo' | 'invalido' };

export function esDecisionPrecioServicio(d: DecisionServicioClinica): d is DecisionPrecioServicio {
  return !d.pedirMonto && !('error' in d);
}

function positivo(n: unknown): number | null {
  if (n == null || n === '') return null;
  const v = Number(n);
  if (Number.isNaN(v) || v <= 0) return null;
  return v;
}

export function esTipoServicioClinica(v: unknown): v is TipoServicioClinica {
  return TIPOS_SERVICIO_CLINICA.includes(String(v) as TipoServicioClinica);
}

/** Raw RTDB: incluye legacy `domicilio`. */
export function esTipoServicioClinicaLegacy(v: unknown): boolean {
  return esTipoServicioClinica(v) || String(v) === 'domicilio';
}

/**
 * Normaliza tipo clínico para UI/altas.
 * Legacy `domicilio` → `consulta` (modalidad va en `esDomicilio`).
 */
export function normalizarTipoServicioClinica(v: unknown): TipoServicioClinica {
  if (String(v) === 'domicilio') return 'consulta';
  return esTipoServicioClinica(v) ? v : 'otro';
}

/** Flag o tipo legacy `domicilio`. */
export function esServicioDomicilio(
  s: Pick<ServicioClinica, 'tipo' | 'esDomicilio'> | { tipo?: unknown; esDomicilio?: unknown } | null | undefined
): boolean {
  if (!s) return false;
  return s.esDomicilio === true || String(s.tipo) === 'domicilio';
}

/** Tipo de acto clínico (legacy domicilio → consulta). */
export function tipoEfectivoServicioClinica(
  s: Pick<ServicioClinica, 'tipo' | 'esDomicilio'> | { tipo?: unknown; esDomicilio?: unknown } | null | undefined
): TipoServicioClinica {
  if (!s) return 'otro';
  return normalizarTipoServicioClinica(s.tipo);
}

/** Nodo RTDB crudo (permite `tipo: domicilio` legacy). */
export type ServicioClinicaRaw = {
  id?: string;
  nombre?: unknown;
  tipo?: unknown;
  esDomicilio?: unknown;
  precio_venta?: unknown;
  precio_costo?: unknown;
  aplicaIva?: unknown;
  tasaIva?: unknown;
  activo?: unknown;
  notas?: unknown;
  sucursalId?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  created_by?: unknown;
};

/**
 * Hidrata nodo RTDB: tipo efectivo + `esDomicilio` desde flag o legacy.
 * No muta el nodo en Firebase (Fase 1 aditiva).
 */
export function hidratarServicioClinica(raw: ServicioClinicaRaw, id?: string | null): ServicioClinica {
  const esDomicilio = esServicioDomicilio(raw);
  return {
    id: id || (raw.id != null ? String(raw.id) : undefined),
    nombre: String(raw.nombre || '').trim(),
    tipo: tipoEfectivoServicioClinica(raw),
    esDomicilio,
    precio_venta: Number(raw.precio_venta) || 0,
    precio_costo: Number(raw.precio_costo) || 0,
    aplicaIva: raw.aplicaIva === true,
    tasaIva: raw.aplicaIva === true ? (Number(raw.tasaIva) > 0 ? Number(raw.tasaIva) : 16) : 0,
    activo: raw.activo !== false,
    notas: raw.notas != null ? String(raw.notas) : undefined,
    sucursalId: raw.sucursalId != null ? String(raw.sucursalId) : undefined,
    created_at: raw.created_at != null ? String(raw.created_at) : '',
    updated_at: raw.updated_at != null ? String(raw.updated_at) : undefined,
    created_by: raw.created_by != null ? String(raw.created_by) : undefined,
  };
}

export function labelTipoServicioClinica(tipo: unknown): string {
  const t = normalizarTipoServicioClinica(tipo);
  return TIPO_SERVICIO_CLINICA_LABELS[t];
}

export function esServicioClinicaActivo(s: Pick<ServicioClinica, 'activo'> | null | undefined): boolean {
  return !!s && s.activo !== false;
}

export function precioVentaServicio(s: Pick<ServicioClinica, 'precio_venta'> | null | undefined): number | null {
  return positivo(s?.precio_venta);
}

export function iconoTipoServicioClinica(tipo: unknown): string {
  switch (normalizarTipoServicioClinica(tipo)) {
    case 'consulta':
      return 'medical_services';
    case 'diagnostico':
      return 'biotech';
    case 'procedimiento':
      return 'healing';
    default:
      return 'request_quote';
  }
}

/**
 * Línea visita → categoría caja (Fase 2):
 * consulta **y** diagnóstico → `consulta` (sin categoría caja nueva `diagnostico`
 * hasta decisión P&L de Luis; ver Fuera de alcance spec 093).
 * procedimiento → cirugia; otro → otro.
 * Legacy `domicilio` → tipo efectivo consulta (no fuerza `otro`).
 * Distinción consulta≠diagnóstico vive en catálogo/KPIs (`contarKpisServiciosClinica`
 * / `labelTipoClinicoParaReporte`), no en `CajaCategoria` escrita a RTDB.
 */
export function categoriaLineaDesdeTipoServicio(tipo: unknown): VisitaLineaCategoria {
  const t = normalizarTipoServicioClinica(tipo);
  if (t === 'procedimiento') return 'cirugia';
  if (t === 'otro') return 'otro';
  return 'consulta';
}

/**
 * Label admin para reportes/KPIs de catálogo (consulta ≠ diagnóstico).
 * No es `CajaCategoria` — no escribir esto en movimientos de caja.
 */
export function labelTipoClinicoParaReporte(tipo: unknown): string {
  return labelTipoServicioClinica(tipo);
}

/** KPIs del listado admin: tipos clínicos + modalidad domicilio (flag/legacy). */
export type KpisServiciosClinica = {
  activos: number;
  consultas: number;
  diagnosticos: number;
  procedimientos: number;
  aDomicilio: number;
};

export function contarKpisServiciosClinica(rows: ServicioClinica[] | null | undefined): KpisServiciosClinica {
  const visibles = (rows || []).filter((r) => r.activo !== false);
  return {
    activos: visibles.length,
    consultas: visibles.filter((r) => tipoEfectivoServicioClinica(r) === 'consulta').length,
    diagnosticos: visibles.filter((r) => tipoEfectivoServicioClinica(r) === 'diagnostico').length,
    procedimientos: visibles.filter((r) => tipoEfectivoServicioClinica(r) === 'procedimiento').length,
    aDomicilio: visibles.filter((r) => esServicioDomicilio(r)).length,
  };
}

/** Patch aditivo SC-008: nunca borra campos; solo normaliza tipo + flag. */
export type PatchMigracionDomicilio = {
  tipo: TipoServicioClinica;
  esDomicilio: true;
  updated_at: string;
};

export type PlanMigracionDomicilio =
  | { needsMigration: false; reason: 'no_legacy_domicilio' | 'ya_migrado' }
  | { needsMigration: true; patch: PatchMigracionDomicilio };

/**
 * Planifica migración suave de un nodo con `tipo: 'domicilio'`.
 * Idempotente: si ya tiene tipo clínico UI + `esDomicilio`, no propone patch.
 */
export function planPatchMigracionDomicilio(
  raw: ServicioClinicaRaw | null | undefined,
  opts?: { now?: string }
): PlanMigracionDomicilio {
  if (!raw || String(raw.tipo) !== 'domicilio') {
    if (raw && esTipoServicioClinica(raw.tipo) && raw.esDomicilio === true && String(raw.tipo) !== 'domicilio') {
      return { needsMigration: false, reason: 'ya_migrado' };
    }
    return { needsMigration: false, reason: 'no_legacy_domicilio' };
  }
  const now = opts?.now || new Date().toISOString();
  return {
    needsMigration: true,
    patch: {
      tipo: normalizarTipoServicioClinica('domicilio'),
      esDomicilio: true,
      updated_at: now,
    },
  };
}

export type ResultadoPlanMigracionDomicilio = {
  total: number;
  aMigrar: number;
  yaOk: number;
  items: Array<{ id: string; nombre: string; patch: PatchMigracionDomicilio }>;
};

/** Recorre mapa id→nodo (como snapshot RTDB) y lista patches SC-008. */
export function planMigracionServiciosClinicaDomicilio(
  map: Record<string, ServicioClinicaRaw | null | undefined> | null | undefined,
  opts?: { now?: string }
): ResultadoPlanMigracionDomicilio {
  const items: ResultadoPlanMigracionDomicilio['items'] = [];
  let yaOk = 0;
  const entries = Object.entries(map || {});
  for (const [id, raw] of entries) {
    if (!raw || typeof raw !== 'object') continue;
    const plan = planPatchMigracionDomicilio(raw, opts);
    if (!plan.needsMigration) {
      yaOk += 1;
      continue;
    }
    items.push({
      id,
      nombre: String(raw.nombre || '').trim() || id,
      patch: plan.patch,
    });
  }
  return {
    total: entries.length,
    aMigrar: items.length,
    yaOk,
    items,
  };
}

/** Preferido: usa tipo efectivo del servicio (incluye legacy). */
export function categoriaLineaDesdeServicioClinica(
  s: Pick<ServicioClinica, 'tipo' | 'esDomicilio'> | { tipo?: unknown } | null | undefined
): VisitaLineaCategoria {
  return categoriaLineaDesdeTipoServicio(tipoEfectivoServicioClinica(s));
}

const ORDEN_TIPO: Record<TipoServicioClinica, number> = {
  consulta: 0,
  diagnostico: 1,
  procedimiento: 2,
  otro: 3,
};

export function ordenarServiciosClinica(rows: ServicioClinica[]): ServicioClinica[] {
  return [...rows].sort((a, b) => {
    const ta = ORDEN_TIPO[tipoEfectivoServicioClinica(a)] ?? 9;
    const tb = ORDEN_TIPO[tipoEfectivoServicioClinica(b)] ?? 9;
    if (ta !== tb) return ta - tb;
    if (!!esServicioDomicilio(a) !== !!esServicioDomicilio(b)) {
      return esServicioDomicilio(a) ? 1 : -1;
    }
    return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
  });
}

export function filtrarServiciosClinica(
  rows: ServicioClinica[] | null | undefined,
  query?: string | null
): ServicioClinica[] {
  const activos = ordenarServiciosClinica((rows || []).filter(esServicioClinicaActivo));
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return activos;
  return activos.filter((s) => {
    const tipo = labelTipoServicioClinica(tipoEfectivoServicioClinica(s)).toLowerCase();
    const modalidad = esServicioDomicilio(s) ? 'domicilio a domicilio' : '';
    const blob = `${s.nombre || ''} ${tipo} ${modalidad} ${s.notas || ''}`.toLowerCase();
    return blob.includes(q);
  });
}

/** Riel Consulta: todo el catálogo activo (056/093; sin riel Domicilio). */
export function serviciosParaRielConsulta(
  rows: ServicioClinica[] | null | undefined,
  query?: string | null
): ServicioClinica[] {
  return filtrarServiciosClinica(rows, query);
}

export function encontrarServicioConsulta(rows: ServicioClinica[] | null | undefined): ServicioClinica | null {
  const activos = (rows || []).filter(esServicioClinicaActivo);
  const consultas = activos.filter((s) => tipoEfectivoServicioClinica(s) === 'consulta');
  const conPrecio = consultas.filter((s) => precioVentaServicio(s) != null);
  if (conPrecio.length) {
    const exacto = conPrecio.find((s) =>
      String(s.nombre || '')
        .trim()
        .toLowerCase()
        .startsWith('consulta')
    );
    return exacto || conPrecio[0];
  }
  return consultas[0] || null;
}

export function resolverLineaServicioClinica(servicio: ServicioClinica | null | undefined): DecisionServicioClinica {
  if (!servicio || !servicio.id) {
    return { pedirMonto: false, error: 'invalido' };
  }
  if (!esServicioClinicaActivo(servicio)) {
    return { pedirMonto: false, error: 'inactivo' };
  }
  const monto = precioVentaServicio(servicio);
  if (monto == null) {
    return { pedirMonto: true, motivo: 'sin_precio', servicio };
  }
  return { pedirMonto: false, monto, servicio };
}

export function hayServicioConsultaConPrecio(rows: ServicioClinica[] | null | undefined): boolean {
  const s = encontrarServicioConsulta(rows);
  return s != null && precioVentaServicio(s) != null;
}

export function validarFormularioServicioClinica(input: {
  nombre?: unknown;
  tipo?: unknown;
  precio_venta?: unknown;
  precio_costo?: unknown;
}): { ok: true } | { ok: false; error: string } {
  const nombre = String(input.nombre || '').trim();
  if (nombre.length < 2) {
    return { ok: false, error: 'El nombre debe tener al menos 2 caracteres.' };
  }
  if (!esTipoServicioClinica(input.tipo)) {
    return { ok: false, error: 'Elige un tipo de servicio.' };
  }
  const precio = Number(input.precio_venta);
  if (Number.isNaN(precio) || precio < 0) {
    return { ok: false, error: 'El precio no puede ser negativo.' };
  }
  const costo = input.precio_costo === '' || input.precio_costo == null ? 0 : Number(input.precio_costo);
  if (Number.isNaN(costo) || costo < 0) {
    return { ok: false, error: 'El costo no puede ser negativo.' };
  }
  if (costo > 0 && precio > 0 && !esVentaMayorQueCosto(costo, precio, { allowEmptyCosto: false })) {
    return {
      ok: false,
      error: 'El costo debe ser menor que el precio de venta. Si es igual o mayor, no hay ganancia.',
    };
  }
  return { ok: true };
}
