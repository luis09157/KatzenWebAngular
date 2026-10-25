/** Spec 085 — tipos de servicio del diálogo Nuevo baño, por modo. */

export interface OpcionTipoServicioBanio {
  value: string;
  label: string;
  icon: string;
}

/** Rápido: servicios sueltos. */
export const TIPOS_SERVICIO_RAPIDO: readonly OpcionTipoServicioBanio[] = [
  { value: 'corte_uñas', label: 'Corte de Uñas', icon: 'scissors' },
  { value: 'rasurado_higienico', label: 'Rasurado higiénico', icon: 'content_cut' },
  { value: 'baño_medicado', label: 'Baño medicado', icon: 'healing' },
];

/** Completo: el paquete ya incluye corte, deslanado y el resto. */
export const TIPOS_SERVICIO_COMPLETO: readonly OpcionTipoServicioBanio[] = [
  { value: 'baño_con_corte', label: 'Baño con corte', icon: 'content_cut' },
  { value: 'baño', label: 'Baño', icon: 'shower' },
  { value: 'baño_con_deslanado', label: 'Baño con deslanado', icon: 'brush' },
];

/** Ya no se ofrecen al crear. Siguen visibles al editar un registro viejo. */
const TIPOS_SERVICIO_LEGACY: readonly OpcionTipoServicioBanio[] = [
  { value: 'baño_básico', label: 'Baño Básico', icon: 'shower' },
  { value: 'baño_completo', label: 'Baño Completo', icon: 'spa' },
  { value: 'corte_pelo', label: 'Corte de Pelo', icon: 'content_cut' },
  { value: 'deslanado', label: 'Deslanado', icon: 'brush' },
  { value: 'tratamiento_especial', label: 'Tratamiento Especial', icon: 'healing' },
];

const CATALOGO: readonly OpcionTipoServicioBanio[] = [
  ...TIPOS_SERVICIO_RAPIDO,
  ...TIPOS_SERVICIO_COMPLETO,
  ...TIPOS_SERVICIO_LEGACY,
];

/** Etiquetas solo de tipos nuevos. El listado admin no cambia el texto de los viejos. */
const ETIQUETA_LISTADO_NUEVO: Record<string, string> = {
  rasurado_higienico: 'Rasurado higiénico',
  baño_medicado: 'Baño medicado',
  baño_con_corte: 'Baño con corte',
  baño: 'Baño',
  baño_con_deslanado: 'Baño con deslanado',
};

/** Alta única: los seis servicios. Un tipo viejo guardado se suma al final. */
export function opcionesTipoServicioAlta(tipoActual?: string | null): OpcionTipoServicioBanio[] {
  const base = [...TIPOS_SERVICIO_RAPIDO, ...TIPOS_SERVICIO_COMPLETO];
  const actual = String(tipoActual || '').trim();
  if (!actual || base.some((opcion) => opcion.value === actual)) {
    return base;
  }
  const conocido = CATALOGO.find((opcion) => opcion.value === actual);
  base.push(
    conocido || {
      value: actual,
      label: etiquetaSuelta(actual),
      icon: 'pets',
    }
  );
  return base;
}

export type LeyendaCobroBanio = 'falta_precio' | 'por_cobrar' | 'pagado';

/** Lo que ve peluquería en el listado. Sin precio, no se manda a cobrar. */
export function leyendaCobroBanio(
  banio: { precio_total?: number | null; pagado?: boolean } | null | undefined
): LeyendaCobroBanio {
  if (!(Number(banio?.precio_total) > 0)) return 'falta_precio';
  if (banio?.pagado) return 'pagado';
  return 'por_cobrar';
}

export function textoLeyendaCobroBanio(leyenda: LeyendaCobroBanio): string {
  if (leyenda === 'falta_precio') return 'Falta el precio';
  if (leyenda === 'pagado') return 'Pagado';
  return 'Por cobrar';
}

export function tipoServicioPerteneceAlModo(tipo: string, modoRapido: boolean): boolean {
  const lista = modoRapido ? TIPOS_SERVICIO_RAPIDO : TIPOS_SERVICIO_COMPLETO;
  return lista.some((opcion) => opcion.value === tipo);
}

/**
 * Las 3 opciones del modo. Si el valor guardado no está en esa lista
 * (baño viejo), se agrega al final para no perderlo al guardar.
 */
export function opcionesTipoServicioBanio(modoRapido: boolean, tipoActual?: string | null): OpcionTipoServicioBanio[] {
  const base = [...(modoRapido ? TIPOS_SERVICIO_RAPIDO : TIPOS_SERVICIO_COMPLETO)];
  const actual = String(tipoActual || '').trim();
  if (!actual || base.some((opcion) => opcion.value === actual)) {
    return base;
  }
  const conocido = CATALOGO.find((opcion) => opcion.value === actual);
  base.push(
    conocido || {
      value: actual,
      label: etiquetaSuelta(actual),
      icon: 'pets',
    }
  );
  return base;
}

export function buscarOpcionTipoServicioBanio(tipo: string): OpcionTipoServicioBanio | undefined {
  return CATALOGO.find((opcion) => opcion.value === tipo);
}

/** null si no es un tipo nuevo: el llamador conserva el texto de siempre. */
export function etiquetaTipoServicioBanioNuevo(tipo: unknown): string | null {
  const key = String(tipo || '').trim();
  return ETIQUETA_LISTADO_NUEVO[key] || null;
}

function etiquetaSuelta(tipo: string): string {
  const limpio = tipo.replace(/_/g, ' ');
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}
