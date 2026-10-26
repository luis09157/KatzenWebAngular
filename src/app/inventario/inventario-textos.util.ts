/**
 * Textos legibles de Inventario (2026-10-26, revisión UX con Luis).
 * Solo presentación: no cambia los valores guardados en RTDB.
 */

const MOTIVOS: Record<string, string> = {
  uso_consulta: 'Usado en consulta',
  venta_directa: 'Venta',
  muestra_medica: 'Muestra médica',
  merma: 'Merma / caducado',
  robo_perdida: 'Robo o pérdida',
  conteo_fisico: 'Conteo físico',
  error_registro: 'Corrección de registro',
  merma_no_registrada: 'Merma no registrada',
  robo: 'Robo',
  dano: 'Daño / deterioro',
  otro: 'Otro',
  compra: 'Compra',
};

/** `venta_directa` → «Venta». Texto libre (ej. «Entrada por compra») se deja igual. */
export function motivoMovimientoTexto(motivo: string | null | undefined): string {
  const t = String(motivo || '').trim();
  if (!t) return '—';
  const key = t.toLowerCase();
  if (MOTIVOS[key]) return MOTIVOS[key];
  if (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(key)) {
    const s = key.replace(/_/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  return t;
}

const SIN_PLURAL = new Set(['ml', 'gr', 'g', 'kg', 'mg', 'l', 'lt', 'oz', 'cm', 'm']);
const PLURAL_ESPECIAL: Record<string, string> = {
  unidad: 'unidades',
  capsula: 'cápsulas',
  cápsula: 'cápsulas',
  dosis: 'dosis',
};

/** «0 unidad» → «0 unidades»; «1 caja»; «5 ml». */
export function cantidadConUnidad(cantidad: number | string | null | undefined, unidad: string | null | undefined): string {
  const n = Number(cantidad);
  const num = Number.isFinite(n) ? String(Math.round(n * 100) / 100) : String(cantidad ?? '');
  const u = String(unidad || '').trim();
  if (!u) return num;
  const key = u.toLowerCase();
  if (n === 1 || SIN_PLURAL.has(key)) return `${num} ${key === 'capsula' ? 'cápsula' : u}`;
  if (PLURAL_ESPECIAL[key]) return `${num} ${PLURAL_ESPECIAL[key]}`;
  if (/[aeiouáéíóú]$/i.test(u)) return `${num} ${u}s`;
  if (/[a-z]$/i.test(u) && u.length > 3) return `${num} ${u}es`;
  return `${num} ${u}`;
}

/**
 * Nombre de quien hizo el movimiento. `usuarios` = mapa uid → nombre.
 * Sin dato → «Sistema»; uid desconocido → «Otro usuario» (nunca el código).
 */
export function nombreResponsable(uid: string | null | undefined, usuarios: ReadonlyMap<string, string>): string {
  const id = String(uid || '').trim();
  if (!id) return 'Sistema';
  return usuarios.get(id) || (id.includes('@') ? id : 'Otro usuario');
}
