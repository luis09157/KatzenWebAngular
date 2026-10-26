/**
 * Panel «Avisos» (2026-10-26): quién del personal tiene avisos push funcionando.
 * Lee `Katzen/FcmTokens/{uid}/{tokenKey}` y `Katzen/Usuarios/{uid}` (solo lectura).
 */

export type EstadoCelularAvisos = 'activo' | 'viejo' | 'apagado';
export type EstadoPersonaAvisos = 'activo' | 'revisar' | 'sin_avisos';

export interface TokenAvisosRow {
  token?: string;
  platform?: string;
  updatedAt?: string;
  activo?: boolean;
  dispositivo?: string;
}

export interface CelularAvisos {
  dispositivo: string;
  actualizado: string;
  diasSinUso: number | null;
  estado: EstadoCelularAvisos;
}

export interface PersonaAvisos {
  uid: string;
  nombre: string;
  estado: EstadoPersonaAvisos;
  celulares: CelularAvisos[];
}

/** Un celular que no abre el sistema en este tiempo probablemente ya no recibe avisos. */
export const DIAS_CELULAR_VIEJO = 30;

export function estadoCelular(row: TokenAvisosRow, now: Date = new Date()): CelularAvisos {
  const t = row?.updatedAt ? Date.parse(row.updatedAt) : NaN;
  const dias = Number.isFinite(t) ? Math.floor((now.getTime() - t) / 86400000) : null;
  const estado: EstadoCelularAvisos =
    row?.activo === false ? 'apagado' : dias === null || dias > DIAS_CELULAR_VIEJO ? 'viejo' : 'activo';
  const plataforma = row?.platform === 'portal_web' ? 'portal' : 'clínica';
  return {
    dispositivo: String(row?.dispositivo || '').trim() || `Celular sin nombre (${plataforma})`,
    actualizado: row?.updatedAt || '',
    diasSinUso: dias,
    estado,
  };
}

/**
 * Una fila por persona del personal (aunque no tenga celular registrado).
 * `activo` = al menos un celular activo; `revisar` = solo celulares viejos o apagados.
 */
export function estadoAvisosPorPersona(
  usuarios: Array<{ id?: string; uid?: string; nombre?: string; email?: string; activo?: boolean }> | null | undefined,
  tokens: Record<string, Record<string, TokenAvisosRow> | null> | null | undefined,
  now: Date = new Date()
): PersonaAvisos[] {
  const orden: Record<EstadoPersonaAvisos, number> = { sin_avisos: 0, revisar: 1, activo: 2 };
  return (usuarios || [])
    .filter((u) => !!u && u.activo !== false && !!(u.id || u.uid))
    .map((u) => {
      const uid = String(u.id || u.uid);
      const filas = Object.values((tokens || {})[uid] || {}).filter((r) => !!r && (r.platform || 'admin_web') !== 'portal_web');
      const celulares = filas.map((r) => estadoCelular(r, now)).sort((a, b) => b.actualizado.localeCompare(a.actualizado));
      const estado: EstadoPersonaAvisos = celulares.some((c) => c.estado === 'activo')
        ? 'activo'
        : celulares.length
          ? 'revisar'
          : 'sin_avisos';
      return { uid, nombre: String(u.nombre || u.email || 'Sin nombre'), estado, celulares };
    })
    .sort((a, b) => orden[a.estado] - orden[b.estado] || a.nombre.localeCompare(b.nombre, 'es'));
}
