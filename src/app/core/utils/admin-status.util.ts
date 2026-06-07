/** Clases CSS de badge de estado — referencia: módulo Vacunas. */
export type AdminEstadoBadgeClass =
  | 'estado-badge--success'
  | 'estado-badge--pending'
  | 'estado-badge--info'
  | 'estado-badge--danger'
  | 'estado-badge--neutral'
  | 'estado-badge--vivo'
  | 'estado-badge--fallecido';

export function normalizeEstado(estado: string | boolean | null | undefined): string {
  if (estado === true) {
    return 'aplicada';
  }
  if (estado === false) {
    return 'pendiente';
  }
  return (estado ?? '').toString().trim().toLowerCase();
}

export function getEstadoBadgeClass(estado: string | boolean | null | undefined): AdminEstadoBadgeClass {
  const value = normalizeEstado(estado);

  switch (value) {
    case 'aplicada':
    case 'completada':
    case 'completado':
    case 'confirmada':
    case 'activo':
    case 'activa':
    case 'vivo':
    case 'leido':
    case 'leído':
      return 'estado-badge--success';
    case 'pendiente':
    case 'programado':
    case 'programada':
      return 'estado-badge--pending';
    case 'en_proceso':
    case 'en proceso':
    case 'confirmado':
      return 'estado-badge--info';
    case 'cancelada':
    case 'cancelado':
    case 'inactivo':
    case 'inactiva':
      return 'estado-badge--danger';
    case 'fallecido':
    case 'fallecida':
      return 'estado-badge--fallecido';
    default:
      return 'estado-badge--neutral';
  }
}

export function getPrioridadBadgeClass(prioridad: string | null | undefined): AdminEstadoBadgeClass {
  switch (normalizeEstado(prioridad)) {
    case 'alta':
    case 'urgente':
    case 'critica':
    case 'crítica':
      return 'estado-badge--danger';
    case 'media':
    case 'normal':
      return 'estado-badge--pending';
    case 'baja':
      return 'estado-badge--info';
    default:
      return 'estado-badge--neutral';
  }
}
