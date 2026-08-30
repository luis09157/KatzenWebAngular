import { Producto } from '../shared/inventario.models';

/**
 * 6 productos de muestra del POS (055). Solo preview UI.
 * Nunca escribir a `Katzen/Inventario/Productos`.
 */

const AHORA = '2026-08-30T00:00:00.000Z';

function demoPos(parcial: Partial<Producto> & Pick<Producto, 'id' | 'nombre' | 'categoria' | 'rielPos' | 'imagen_url'>): Producto {
  return {
    codigo_barras: String(parcial.id).toUpperCase(),
    descripcion: 'Muestra UI POS — no es catálogo real. No persistir a RTDB.',
    subcategoria: '',
    marca: 'Demo POS',
    presentacion: 'Unidad',
    unidad_medida: 'unidad',
    stock_actual: 10,
    stock_minimo: 0,
    stock_maximo: 99,
    punto_reorden: 0,
    ubicacion_almacen: '',
    requiere_refrigeracion: false,
    fecha_caducidad_alerta_dias: 0,
    precio_compra: 1,
    precio_venta: 10,
    margen_ganancia: 0,
    iva_aplicable: false,
    tasa_iva: 0,
    proveedor_principal_id: '',
    proveedores_alternos: [],
    requiere_receta: false,
    controlado: false,
    activo: true,
    created_at: AHORA,
    updated_at: AHORA,
    soloDemo: true,
    origen: 'pos_preview',
    ...parcial
  };
}

export const MOCK_PRODUCTO_DEMO_POS_CROQUETA = demoPos({
  id: 'demo-pos-petshop-1',
  codigo_barras: 'DEMO-POS-PETSHOP-1',
  nombre: 'Croqueta muestra 2 kg',
  categoria: 'alimento',
  subcategoria: 'seco',
  presentacion: 'Bolsa 2 kg',
  rielPos: 'petshop',
  imagen_url: 'assets/pos-demo/petshop-croqueta.png',
  stock_actual: 12,
  precio_venta: 189,
  iva_aplicable: true,
  tasa_iva: 16
});

export const MOCK_PRODUCTO_DEMO_POS_COLLAR = demoPos({
  id: 'demo-pos-petshop-2',
  codigo_barras: 'DEMO-POS-PETSHOP-2',
  nombre: 'Collar y juguete muestra',
  categoria: 'accesorio',
  subcategoria: 'collar',
  presentacion: 'Unidad',
  rielPos: 'petshop',
  imagen_url: 'assets/pos-demo/petshop-collar.png',
  stock_actual: 9,
  precio_venta: 85,
  iva_aplicable: true,
  tasa_iva: 16
});

export const MOCK_PRODUCTO_DEMO_POS_CONSULTA = demoPos({
  id: 'demo-pos-consulta-1',
  codigo_barras: 'DEMO-POS-CONSULTA-1',
  nombre: 'Consulta muestra',
  categoria: 'diagnostico',
  subcategoria: 'consulta',
  presentacion: 'Servicio',
  rielPos: 'consulta',
  imagen_url: 'assets/pos-demo/consulta-consulta.png',
  stock_actual: 99,
  precio_venta: 350
});

export const MOCK_PRODUCTO_DEMO_POS_MEDICAMENTO = demoPos({
  id: 'demo-pos-consulta-2',
  codigo_barras: 'DEMO-POS-CONSULTA-2',
  nombre: 'Medicamento muestra',
  categoria: 'medicamento',
  subcategoria: 'frasco',
  presentacion: 'Frasco',
  rielPos: 'consulta',
  imagen_url: 'assets/pos-demo/consulta-medicamento.png',
  stock_actual: 6,
  precio_venta: 120
});

export const MOCK_PRODUCTO_DEMO_POS_BANIO = demoPos({
  id: 'demo-pos-peluqueria-1',
  codigo_barras: 'DEMO-POS-PELUQUERIA-1',
  nombre: 'Baño muestra',
  categoria: 'peluqueria',
  subcategoria: 'baño',
  presentacion: 'Servicio',
  rielPos: 'peluqueria',
  imagen_url: 'assets/pos-demo/peluqueria-banio.png',
  stock_actual: 99,
  precio_venta: 250
});

export const MOCK_PRODUCTO_DEMO_POS_CORTE = demoPos({
  id: 'demo-pos-peluqueria-2',
  codigo_barras: 'DEMO-POS-PELUQUERIA-2',
  nombre: 'Corte muestra',
  categoria: 'peluqueria',
  subcategoria: 'corte',
  presentacion: 'Servicio',
  rielPos: 'peluqueria',
  imagen_url: 'assets/pos-demo/peluqueria-corte.png',
  stock_actual: 99,
  precio_venta: 280
});

/** 6 ítems de muestra (2 por riel). Nunca persistir estos IDs a RTDB. */
export const MOCK_PRODUCTOS_POS: Producto[] = [
  MOCK_PRODUCTO_DEMO_POS_CROQUETA,
  MOCK_PRODUCTO_DEMO_POS_COLLAR,
  MOCK_PRODUCTO_DEMO_POS_CONSULTA,
  MOCK_PRODUCTO_DEMO_POS_MEDICAMENTO,
  MOCK_PRODUCTO_DEMO_POS_BANIO,
  MOCK_PRODUCTO_DEMO_POS_CORTE
];
