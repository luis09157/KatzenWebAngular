import { Producto } from '../inventario.models';

export interface ProductoSelection {
  producto: Producto | null;
}

export interface ProductoPickerFields {
  productoId?: string;
  productoNombre?: string;
}

export const DEFAULT_PRODUCTO_PICKER_FIELDS: Required<ProductoPickerFields> = {
  productoId: 'producto_id',
  productoNombre: 'producto_nombre'
};
