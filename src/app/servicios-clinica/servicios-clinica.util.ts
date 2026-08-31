import { VisitaLineaCategoria } from '../visitas/visitas.models';
import {
  ServicioClinica,
  TipoServicioClinica,
  TIPO_SERVICIO_CLINICA_LABELS,
  TIPOS_SERVICIO_CLINICA
} from './servicios-clinica.models';

export const COPY_PRECIO_SERVICIO = 'Precio de servicio';

export const COPY_BANIO_EN_FINANZAS =
  'Las tarifas de baño se editan en Finanzas. No forman parte de este catálogo.';

export type DecisionPrecioServicio = {
  pedirMonto: false;
  monto: number;
  servicio: ServicioClinica;
};

export type DecisionServicioClinica =
  | DecisionPrecioServicio
  | { pedirMonto: true; motivo: 'sin_precio'; servicio: ServicioClinica }
  | { pedirMonto: false; error: 'inactivo' | 'invalido' };

export function esDecisionPrecioServicio(
  d: DecisionServicioClinica
): d is DecisionPrecioServicio {
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

export function normalizarTipoServicioClinica(v: unknown): TipoServicioClinica {
  return esTipoServicioClinica(v) ? v : 'otro';
}

export function labelTipoServicioClinica(tipo: unknown): string {
  const t = normalizarTipoServicioClinica(tipo);
  return TIPO_SERVICIO_CLINICA_LABELS[t];
}

export function esServicioClinicaActivo(
  s: Pick<ServicioClinica, 'activo'> | null | undefined
): boolean {
  return !!s && s.activo !== false;
}

export function precioVentaServicio(
  s: Pick<ServicioClinica, 'precio_venta'> | null | undefined
): number | null {
  return positivo(s?.precio_venta);
}

export function iconoTipoServicioClinica(tipo: unknown): string {
  switch (normalizarTipoServicioClinica(tipo)) {
    case 'consulta':
      return 'medical_services';
    case 'diagnostico':
      return 'biotech';
    case 'domicilio':
      return 'home';
    default:
      return 'request_quote';
  }
}

/** Línea de visita: domicilio/honorarios → otro; el resto es consulta. */
export function categoriaLineaDesdeTipoServicio(
  tipo: unknown
): VisitaLineaCategoria {
  const t = normalizarTipoServicioClinica(tipo);
  return t === 'domicilio' || t === 'otro' ? 'otro' : 'consulta';
}

const ORDEN_TIPO: Record<TipoServicioClinica, number> = {
  consulta: 0,
  diagnostico: 1,
  domicilio: 2,
  otro: 3
};

export function ordenarServiciosClinica(rows: ServicioClinica[]): ServicioClinica[] {
  return [...rows].sort((a, b) => {
    const ta = ORDEN_TIPO[normalizarTipoServicioClinica(a.tipo)] ?? 9;
    const tb = ORDEN_TIPO[normalizarTipoServicioClinica(b.tipo)] ?? 9;
    if (ta !== tb) return ta - tb;
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
    const tipo = labelTipoServicioClinica(s.tipo).toLowerCase();
    const blob = `${s.nombre || ''} ${tipo} ${s.notas || ''}`.toLowerCase();
    return blob.includes(q);
  });
}

/** Riel Consulta: todos los tipos del catálogo (incluye domicilio). */
export function serviciosParaRielConsulta(
  rows: ServicioClinica[] | null | undefined,
  query?: string | null
): ServicioClinica[] {
  return filtrarServiciosClinica(rows, query);
}

export function encontrarServicioConsulta(
  rows: ServicioClinica[] | null | undefined
): ServicioClinica | null {
  const activos = (rows || []).filter(esServicioClinicaActivo);
  const consultas = activos.filter(
    (s) => normalizarTipoServicioClinica(s.tipo) === 'consulta'
  );
  const conPrecio = consultas.filter((s) => precioVentaServicio(s) != null);
  if (conPrecio.length) {
    const exacto = conPrecio.find((s) =>
      String(s.nombre || '').trim().toLowerCase().startsWith('consulta')
    );
    return exacto || conPrecio[0];
  }
  return consultas[0] || null;
}

export function resolverLineaServicioClinica(
  servicio: ServicioClinica | null | undefined
): DecisionServicioClinica {
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

export function hayServicioConsultaConPrecio(
  rows: ServicioClinica[] | null | undefined
): boolean {
  const s = encontrarServicioConsulta(rows);
  return s != null && precioVentaServicio(s) != null;
}

export function validarFormularioServicioClinica(input: {
  nombre?: unknown;
  tipo?: unknown;
  precio_venta?: unknown;
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
  return { ok: true };
}
