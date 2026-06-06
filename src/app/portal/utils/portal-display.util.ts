/** Formateo de fechas y UI (paridad con PortalExpedienteUi / PortalNotificacionUi). */

export function formatDisplayDate(value: string | undefined | null): string {
  if (!value) return '—';
  const trimmed = String(value).trim();
  let date: Date | null = null;

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    date = new Date(trimmed.replace(' ', 'T'));
  } else if (/^\d{2}\/\d{2}\/\d{4}/.test(trimmed)) {
    const [d, m, y] = trimmed.split(/[\s/]+/);
    date = new Date(Number(y), Number(m) - 1, Number(d));
  }

  if (!date || isNaN(date.getTime())) return trimmed;
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatNotificationTime(value: string | undefined | null): string {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  if (isNaN(date.getTime())) return String(value);

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  return formatDisplayDate(value);
}

export function chipClassForEstado(estado: string): string {
  const e = (estado || '').toLowerCase();
  if (e.includes('confirm') || e.includes('complet')) return 'chip-ok';
  if (e.includes('cancel')) return 'chip-warn';
  return 'chip-pending';
}

export function notificacionCategoria(tipo: string, titulo: string): string {
  const t = `${tipo} ${titulo}`.toLowerCase();
  if (t.includes('vacuna')) return 'vacuna';
  if (t.includes('cita')) return 'cita';
  if (t.includes('historial') || t.includes('consulta') || t.includes('clinic')) return 'historial';
  return 'general';
}
