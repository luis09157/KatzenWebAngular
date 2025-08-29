export interface Banio {
  id?: string;
  paciente_id: string;
  paciente?: string; // Nombre del paciente
  cliente_id: string;
  cliente?: string; // Nombre del cliente
  
  // Información del servicio
  fecha_banio: string;
  hora_banio: string;
  tipo_servicio: 'baño_básico' | 'baño_completo' | 'corte_pelo' | 'corte_uñas' | 'deslanado' | 'tratamiento_especial';
  estado: 'programado' | 'en_proceso' | 'completado' | 'cancelado';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  
  // Detalles del servicio
  observaciones?: string;
  productos_utilizados?: string[];
  alergias_conocidas?: string[];
  comportamiento?: 'tranquilo' | 'nervioso' | 'agresivo' | 'cooperativo';
  
  // Información del peluquero
  peluquero_id: string;
  peluquero?: string; // Nombre del peluquero
  
  // Precios y pagos
  precio_base: number;
  servicios_adicionales?: Array<{
    servicio: string;
    precio: number;
  }>;
  precio_total: number;
  pagado: boolean;
  metodo_pago?: 'efectivo' | 'tarjeta' | 'transferencia';
  
  // Tiempos estimados
  duracion_estimada: number; // en minutos
  tiempo_inicio?: string;
  tiempo_fin?: string;
  
  // Sistema
  activo: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
}

export interface TipoServicio {
  id?: string;
  nombre: string;
  descripcion: string;
  precio_base: number;
  duracion_estimada: number; // en minutos
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductoPeluqueria {
  id?: string;
  nombre: string;
  descripcion: string;
  tipo: 'shampoo' | 'acondicionador' | 'tratamiento' | 'herramienta' | 'otro';
  marca: string;
  precio: number;
  stock: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}
