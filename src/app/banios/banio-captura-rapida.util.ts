/** Spec 085 Fase A — defaults de captura rápida de baño (sin UI). */

export function fechaHoyLocal(ref: Date = new Date()): string {
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, '0');
  const d = String(ref.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Hora local `HH:mm` (24 h) para timepicker. */
export function horaAhoraLocal(ref: Date = new Date()): string {
  const h = String(ref.getHours()).padStart(2, '0');
  const min = String(ref.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

export interface PrefillCapturaRapidaBanio {
  fecha_banio: string;
  hora_banio: string;
  estado: 'programado' | 'en_proceso';
  prioridad: 'media';
  comportamiento: 'tranquilo';
  duracion_estimada: number;
  pagado: false;
}

/** Valores iniciales para nuevo baño en modo rápido. */
export function prefillCapturaRapidaBanio(opts: { iniciarYa?: boolean; now?: Date } = {}): PrefillCapturaRapidaBanio {
  const now = opts.now || new Date();
  return {
    fecha_banio: fechaHoyLocal(now),
    hora_banio: horaAhoraLocal(now),
    estado: opts.iniciarYa ? 'en_proceso' : 'programado',
    prioridad: 'media',
    comportamiento: 'tranquilo',
    duracion_estimada: 60,
    pagado: false,
  };
}
