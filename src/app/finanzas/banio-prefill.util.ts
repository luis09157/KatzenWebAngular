import {
  DefaultsBanioPorTamano,
  TamanoPerroBanio
} from './defaults-banio.models';
import { PlantillaCosto } from './plantilla-costo.models';

export type BanioPrefillFuente = 'defaults' | 'plantilla' | 'ninguno';

export interface BanioPrefillResult {
  costoEstimado: number | null;
  precioSugerido: number | null;
  plantillaCostoId?: string;
  fuente: BanioPrefillFuente;
}

const TAMANO_KEYWORDS: Record<TamanoPerroBanio, string[]> = {
  pequeno: ['peque', 'chico', 'small', 'mini'],
  mediano: ['medi', 'medium', 'estandar', 'estándar'],
  grande: ['grand', 'large', 'xl', 'maxi']
};

function positivo(n: unknown): number | null {
  if (n == null || n === '') return null;
  const v = Number(n);
  if (Number.isNaN(v) || v <= 0) return null;
  return v;
}

function plantillaPorId(
  plantillas: PlantillaCosto[],
  id: string | undefined
): PlantillaCosto | undefined {
  if (!id) return undefined;
  return plantillas.find((p) => p.id === id && p.activo !== false);
}

/** Preferir plantilla baño cuyo nombre aluda al tamaño; si no, primera baño/corte activa. */
export function plantillaBanioFallback(
  plantillas: PlantillaCosto[],
  tamano: TamanoPerroBanio
): PlantillaCosto | undefined {
  const candidatas = (plantillas || []).filter(
    (p) =>
      p.activo !== false &&
      (p.tipoServicio === 'banio' || p.tipoServicio === 'corte')
  );
  if (!candidatas.length) return undefined;
  const keys = TAMANO_KEYWORDS[tamano] || [];
  const porNombre = candidatas.find((p) => {
    const nom = String(p.nombre || '').toLowerCase();
    return keys.some((k) => nom.includes(k));
  });
  return porNombre || candidatas.find((p) => p.tipoServicio === 'banio') || candidatas[0];
}

/**
 * Resuelve costo/precio al elegir tamaño en el modal de baño.
 * Nunca trata 0 como tarifa válida: 0 = «no configurado».
 */
export function resolverPrefillBanioPorTamano(
  tamano: TamanoPerroBanio | '' | null | undefined,
  defaults: DefaultsBanioPorTamano | null | undefined,
  plantillas: PlantillaCosto[] = []
): BanioPrefillResult {
  if (!tamano) {
    return { costoEstimado: null, precioSugerido: null, fuente: 'ninguno' };
  }

  const row = defaults?.[tamano];
  let plantilla = plantillaPorId(plantillas, row?.plantillaCostoId);
  if (!plantilla) {
    plantilla = plantillaBanioFallback(plantillas, tamano);
  }

  const costoDefault = positivo(row?.costoDefault);
  const precioDefault = positivo(row?.precioSugerido);
  const costoPlantilla = positivo(plantilla?.costoTotalEstimado);
  const precioPlantilla = positivo(plantilla?.precioSugeridoCliente);

  const costo = costoPlantilla ?? costoDefault;
  const precio = precioPlantilla ?? precioDefault;

  if (costo == null && precio == null) {
    return { costoEstimado: null, precioSugerido: null, fuente: 'ninguno' };
  }

  const usoPlantilla = !!(costoPlantilla || precioPlantilla);
  return {
    costoEstimado: costo,
    precioSugerido: precio,
    plantillaCostoId: plantilla?.id || row?.plantillaCostoId || undefined,
    fuente: usoPlantilla ? 'plantilla' : 'defaults'
  };
}
