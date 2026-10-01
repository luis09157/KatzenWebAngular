/**
 * Copy puro del POS (spec 065 / 046 / 075) — sin estado Angular.
 * Extraído de `visita-dialog` para testear y reutilizar.
 */
import { PosRiel } from './pos-rieles.util';
import { VisitaLinea } from './visitas.models';

export interface MensajeClienteCtx {
  tieneClienteReal: boolean;
  tienePaciente: boolean;
  /** Nombre display del dueño (opcional). */
  nombreDueno?: string | null;
}

/** Copy «te falta X» según el riel clínico que se quiso agregar. */
export function mensajeRequiereClientePara(riel: PosRiel, ctx: MensajeClienteCtx): string {
  const faltaMascota = ctx.tieneClienteReal && !ctx.tienePaciente;
  const dueno = String(ctx.nombreDueno || '').trim();
  if (riel === 'peluqueria') {
    return faltaMascota
      ? `Elige o agrega la mascota de ${dueno} para registrar el baño.`
      : 'Para registrar un baño necesito saber de qué mascota es. Elige al dueño y la mascota, o créalos aquí.';
  }
  return faltaMascota
    ? `Elige o agrega la mascota de ${dueno} para registrar la consulta.`
    : 'Para registrar una consulta necesito saber de qué paciente es. Elige al dueño y la mascota, o créalos aquí.';
}

/** Hint de origen de una línea del ticket (solo lectura UI). */
export function origenLineaHint(
  linea:
    | Pick<
        VisitaLinea,
        'movimientoInventarioId' | 'banioId' | 'citaId' | 'vacunaId' | 'pensionId' | 'historialId' | 'productoId'
      >
    | null
    | undefined
): string {
  if (!linea) return '';
  if (linea.movimientoInventarioId) {
    return 'Origen: salida de inventario (stock ya vinculado).';
  }
  if (linea.banioId) return 'Origen: servicio de baño / peluquería.';
  if (linea.citaId) return 'Origen: cita de consulta.';
  if (linea.vacunaId) return 'Origen: registro de vacuna.';
  if (linea.pensionId) return 'Origen: estancia de pensión.';
  if (linea.historialId) return 'Origen: historial clínico.';
  if (linea.productoId && !linea.movimientoInventarioId) {
    return 'Producto agregado manualmente — al guardar/cobrar se descontará stock.';
  }
  return '';
}
