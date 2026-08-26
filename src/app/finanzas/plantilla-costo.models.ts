/** Plantillas de costo de servicio — specs 021 + 022. */
export type PlantillaTipoServicio =
  | 'banio'
  | 'corte'
  | 'cirugia'
  | 'consulta'
  | 'vacuna'
  | 'pension'
  | 'otro';

export type PlantillaItemTipo = 'producto_inventario' | 'gasto_libre';

export interface PlantillaCostoItem {
  tipo: PlantillaItemTipo;
  productoId?: string;
  nombre: string;
  cantidad: number;
  costoUnitario: number;
}

export interface PlantillaCosto {
  id?: string;
  nombre: string;
  tipoServicio: PlantillaTipoServicio;
  precioSugeridoCliente?: number;
  items: PlantillaCostoItem[];
  costoTotalEstimado: number;
  activo: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface PlantillaCostoFormData {
  nombre: string;
  tipoServicio: PlantillaTipoServicio;
  precioSugeridoCliente?: number;
  items: PlantillaCostoItem[];
}

export const PLANTILLA_TIPO_LABELS: Record<PlantillaTipoServicio, string> = {
  banio: 'Baño / peluquería',
  corte: 'Corte',
  cirugia: 'Cirugía',
  consulta: 'Consulta',
  vacuna: 'Vacuna',
  pension: 'Pensión / alojamiento',
  otro: 'Otro'
};

export function calcularCostoTotalItems(items: PlantillaCostoItem[]): number {
  return (items || []).reduce((acc, it) => {
    const qty = Number(it.cantidad) || 0;
    const unit = Number(it.costoUnitario) || 0;
    return acc + qty * unit;
  }, 0);
}
