/** Spec 072 — filtros del tablero Hoy (recordatorios y pensión). */

export function fechaIsoLocalDeValor(raw: unknown): string | null {
  if (!raw) return null;
  const s = String(raw);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fechaRecordatorioIso(r: Record<string, unknown> | null | undefined): string | null {
  if (!r) return null;
  return (
    fechaIsoLocalDeValor(r['fecha_hora_recordatorio']) ||
    fechaIsoLocalDeValor(r['fecha_recordatorio']) ||
    fechaIsoLocalDeValor(r['fecha'])
  );
}

export function esRecordatorioHoyOVencido(r: Record<string, unknown> | null | undefined, hoyIso: string): boolean {
  if (!r || r['activo'] === false) return false;
  const estado = String(r['estado'] || 'pendiente').toLowerCase();
  if (estado === 'completado' || estado === 'cancelado') return false;
  const dia = fechaRecordatorioIso(r);
  if (!dia) return false;
  return dia <= hoyIso;
}

export function esEstanciaPensionHoy(e: { activo?: boolean; estado?: string } | null | undefined): boolean {
  if (!e || e.activo === false) return false;
  return e.estado === 'activa';
}
