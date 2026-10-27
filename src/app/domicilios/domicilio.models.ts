/**
 * Spec 107 — datos de un domicilio guardados junto al baño, la cita o la línea del ticket.
 * Aditivo: la app móvil ignora este campo.
 */
export interface DomicilioDatos {
  km: number;
  tipoId: string;
  tipoNombre: string;
  recorridos: number;
  /** Tarifas usadas al cotizar (para que el historial no cambie si cambia la gasolina). */
  precioLitro: number;
  kmPorLitro: number;
  margenPct: number;
  costoGasolina: number;
  precioSugerido: number;
  /** Lo que se cobra (la veterinaria puede cambiarlo). */
  precio: number;
  ganancia: number;
  direccion?: string;
  colonia?: string;
  municipio?: string;
  linkMaps?: string;
  cotizadoEn: string;
  cotizadoPor?: string;
}
