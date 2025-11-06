// ==================== TIPOS Y ENUMS ====================
export type CategoriaProducto = 
  | 'medicamento' 
  | 'quirurgico' 
  | 'alimento' 
  | 'peluqueria' 
  | 'diagnostico' 
  | 'accesorio';

export type UnidadMedida = 
  | 'unidad' 
  | 'ml' 
  | 'gr' 
  | 'kg' 
  | 'litro' 
  | 'caja' 
  | 'paquete';

export type TipoMovimiento = 
  | 'entrada' 
  | 'salida' 
  | 'ajuste' 
  | 'merma' 
  | 'devolucion' 
  | 'transferencia';

export type EstadoLote = 'vigente' | 'por_vencer' | 'vencido' | 'agotado';

export type EstadoOrden = 
  | 'borrador' 
  | 'enviada' 
  | 'parcial' 
  | 'recibida' 
  | 'cancelada';

export type FormaPagoProveedor = 
  | 'contado' 
  | 'credito_15' 
  | 'credito_30' 
  | 'credito_60';

export type TipoAlerta = 
  | 'stock_bajo' 
  | 'por_caducar' 
  | 'caducado' 
  | 'punto_reorden';

export type PrioridadAlerta = 'baja' | 'media' | 'alta' | 'critica';
export type EstadoAlerta = 'pendiente' | 'en_proceso' | 'resuelta' | 'ignorada';
export type TipoConteo = 'completo' | 'ciclico' | 'aleatorio';
export type EstadoConteo = 'en_proceso' | 'completado' | 'cancelado';

// ==================== PRODUCTO ====================
export interface Producto {
  id?: string;
  codigo_barras: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaProducto;
  subcategoria: string;
  marca: string;
  presentacion: string;
  unidad_medida: UnidadMedida;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  punto_reorden: number;
  ubicacion_almacen: string;
  requiere_refrigeracion: boolean;
  lote_actual?: string;
  fecha_caducidad?: string;
  fecha_caducidad_alerta_dias: number;
  precio_compra: number;
  precio_venta: number;
  margen_ganancia: number;
  iva_aplicable: boolean;
  proveedor_principal_id: string;
  proveedores_alternos: string[];
  requiere_receta: boolean;
  controlado: boolean;
  activo: boolean;
  imagen_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductoFormData {
  codigo_barras: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaProducto;
  subcategoria: string;
  marca: string;
  presentacion: string;
  unidad_medida: UnidadMedida;
  stock_minimo: number;
  stock_maximo: number;
  punto_reorden: number;
  ubicacion_almacen: string;
  requiere_refrigeracion: boolean;
  fecha_caducidad_alerta_dias: number;
  precio_compra: number;
  precio_venta: number;
  iva_aplicable: boolean;
  proveedor_principal_id: string;
  requiere_receta: boolean;
  controlado: boolean;
}

// ==================== LOTE ====================
export interface Lote {
  id?: string;
  producto_id: string;
  numero_lote: string;
  fecha_ingreso: string;
  fecha_caducidad: string;
  cantidad_inicial: number;
  cantidad_actual: number;
  proveedor_id: string;
  precio_compra_lote: number;
  numero_factura: string;
  estado: EstadoLote;
  created_at: string;
}

// ==================== MOVIMIENTO ====================
export interface Movimiento {
  id?: string;
  tipo: TipoMovimiento;
  producto_id: string;
  lote_id?: string;
  cantidad: number;
  cantidad_anterior: number;
  cantidad_nueva: number;
  motivo: string;
  costo_unitario: number;
  costo_total: number;
  paciente_id?: string;
  historial_clinico_id?: string;
  venta_id?: string;
  usuario_responsable_id: string;
  orden_compra_id?: string;
  observaciones: string;
  documento_soporte_url?: string;
  created_at: string;
}

// ==================== ORDEN DE COMPRA ====================
export interface OrdenCompra {
  id?: string;
  folio: string;
  proveedor_id: string;
  proveedor?: string;
  fecha_orden: string;
  fecha_entrega_esperada: string;
  fecha_entrega_real?: string;
  estado: EstadoOrden;
  items: ItemOrdenCompra[];
  subtotal: number;
  iva: number;
  total: number;
  forma_pago: FormaPagoProveedor;
  pagada: boolean;
  usuario_solicita_id: string;
  usuario_solicita?: string;
  usuario_autoriza_id?: string;
  usuario_autoriza?: string;
  observaciones: string;
  created_at: string;
  updated_at?: string;
}

export interface ItemOrdenCompra {
  producto_id: string;
  producto_nombre?: string;
  cantidad_solicitada: number;
  cantidad_recibida: number;
  precio_unitario: number;
  subtotal: number;
}

export type OrdenCompraFormData = Omit<OrdenCompra, 'id' | 'folio' | 'created_at' | 'updated_at'>;

// ==================== PROVEEDOR ====================
export interface Proveedor {
  id?: string;
  razon_social: string;
  nombre_comercial: string;
  rfc: string;
  contacto_nombre: string;
  contacto_telefono: string;
  contacto_email: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  productos_suministra: string[];
  dias_entrega: number;
  condiciones_pago: string;
  calificacion: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProveedorFormData {
  razon_social: string;
  nombre_comercial: string;
  rfc: string;
  contacto_nombre: string;
  contacto_telefono: string;
  contacto_email: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  dias_entrega: number;
  condiciones_pago: string;
}

// ==================== ALERTA ====================
export interface Alerta {
  id?: string;
  tipo: TipoAlerta;
  prioridad: PrioridadAlerta;
  producto_id: string;
  producto_nombre?: string;
  lote_id?: string;
  mensaje: string;
  fecha_alerta: string;
  fecha_resolucion?: string;
  estado: EstadoAlerta;
  usuario_asignado_id?: string;
  created_at: string;
}

// ==================== CONTEO ====================
export interface ConteoFisico {
  id?: string;
  folio: string;
  fecha_conteo: string;
  tipo: TipoConteo;
  estado: EstadoConteo;
  items: ItemConteo[];
  usuario_responsable_id: string;
  usuario_responsable?: string;
  total_diferencias: number;
  valor_diferencias: number;
  created_at: string;
}

export interface ItemConteo {
  producto_id: string;
  producto_nombre?: string;
  stock_sistema: number;
  stock_fisico: number;
  diferencia: number;
  ajuste_realizado: boolean;
  observaciones: string;
}

// ==================== ESTADÍSTICAS ====================
export interface EstadisticasInventario {
  total_productos: number;
  valor_total_inventario: number;
  productos_bajo_stock: number;
  productos_por_caducar: number;
  productos_caducados: number;
  productos_sin_movimiento_30dias: number;
  categorias_resumen: {
    categoria: CategoriaProducto;
    cantidad_productos: number;
    valor_total: number;
  }[];
}

