/**
 * Spec 117 — campanita de avisos en la barra superior.
 * Convierte «Para avisar hoy» (spec 111) en renglones cortos que llevan a su pantalla.
 * Solo lectura: tocar un renglón navega; avisar al cliente sigue siendo con botón.
 */
import { formatLocalDate, parseLocalDate } from '../core/utils/periodo-filtro.util';
import { AvisoPendiente, TipoAviso, TIPO_AVISO_LABELS, hora12, listaNombres } from './para-avisar.util';

export interface ItemCampanita {
  clave: string;
  icono: string;
  titulo: string;
  detalle: string;
  /** Ruta de la actividad. */
  ruta: string;
}

const ICONOS: Record<TipoAviso, string> = {
  banio_manana: 'spa',
  banio_proximo: 'spa',
  cita_manana: 'event',
  recordatorio: 'notifications',
};

const RUTAS: Record<TipoAviso, string> = {
  banio_manana: '/admin/banios',
  banio_proximo: '/admin/banios',
  cita_manana: '/admin/citas',
  recordatorio: '/admin/recordatorios',
};

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** `Hoy`, `Mañana`, `Ayer` o `vie 30 oct`. */
export function fechaCortaAviso(fechaIso: string, hoyIso: string): string {
  const d = parseLocalDate(fechaIso);
  const h = parseLocalDate(hoyIso);
  if (!d || !h) return '';
  const dif = Math.round((d.getTime() - h.getTime()) / 86_400_000);
  if (dif === 0) return 'Hoy';
  if (dif === 1) return 'Mañana';
  if (dif === -1) return 'Ayer';
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
}

function ordenAviso(a: AvisoPendiente): string {
  return `${a.fecha || '9999-99-99'} ${a.hora || '99:99'}`;
}

/** Renglones de la campanita, del más próximo al más lejano. */
export function itemsCampanita(avisos: ReadonlyArray<AvisoPendiente>, hoyIso: string = formatLocalDate(new Date())): ItemCampanita[] {
  return [...avisos]
    .sort((a, b) => ordenAviso(a).localeCompare(ordenAviso(b)))
    .map((a) => {
      const cuando = a.tipo === 'banio_proximo' ? a.detalle : [fechaCortaAviso(a.fecha, hoyIso), hora12(a.hora)].filter(Boolean).join(' ');
      const extra = a.tipo === 'recordatorio' && a.detalle ? ` · ${a.detalle}` : '';
      return {
        clave: a.clave,
        icono: ICONOS[a.tipo] || 'notifications',
        titulo: `${TIPO_AVISO_LABELS[a.tipo] || 'Aviso'} · ${listaNombres(a.mascotas)}`,
        detalle: [a.dueno, cuando].filter(Boolean).join(' · ') + extra,
        ruta: RUTAS[a.tipo] || '/admin/recordatorios',
      };
    });
}

/** Número del globito: avisos + alertas de inventario. `99+` si se pasa. */
export function textoGlobito(total: number): string {
  if (!(total > 0)) return '';
  return total > 99 ? '99+' : String(total);
}
