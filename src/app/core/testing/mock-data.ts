/**
 * Datos mock locales para desarrollo y pruebas UI (SDD workflow).
 *
 * Uso: importar en componentes o servicios durante desarrollo para evitar
 * llamadas a RTDB/Firebase de producción. Ver specs/memory/constitution.md
 * y .cursor/rules/sdd-workflow.mdc — pruebas UI exclusivamente con mocks
 * o emuladores, nunca contra katzen-a0e3e.
 *
 * Ejemplo:
 *   import { MOCK_CLIENTE, MOCK_MASCOTA } from '../core/testing/mock-data';
 */

import { Cliente, Cita, Paciente } from '../models';

/** Usuario staff según nodo Katzen/Usuarios/{uid}. */
export interface StaffUsuario {
  id?: string;
  nombre: string;
  correo: string;
  telefono?: string;
  perfil?: string;
  staffRole?: string;
  activo?: boolean;
  fecha_registro?: string;
}

export const MOCK_CLIENTE: Cliente = {
  id: 'mock-cliente-001',
  nombre: 'Ana',
  apellidoPaterno: 'García',
  apellidoMaterno: 'López',
  telefono: '5551234567',
  correo: 'ana.garcia.mock@example.test',
  expediente: 'EXP-MOCK-001',
  direccion: 'Calle Ficticia 123, Col. Demo',
  activo: true,
};

export const MOCK_MASCOTA: Paciente = {
  id: 'mock-mascota-001',
  nombre: 'Luna',
  especie: 'Canino',
  raza: 'Mestizo',
  sexo: 'Hembra',
  edad: '3 años',
  color: 'Atigrado',
  peso: 12.5,
  idCliente: MOCK_CLIENTE.id,
  cliente_id: MOCK_CLIENTE.id,
  activo: true,
  fecha_creacion: '2026-01-15T10:00:00.000Z',
};

export const MOCK_CITA: Cita = {
  id: 'mock-cita-001',
  cliente_id: MOCK_CLIENTE.id,
  paciente_id: MOCK_MASCOTA.id,
  fecha: '2026-09-01',
  fecha_hora: '2026-09-01T10:30:00.000Z',
  hora: '10:30',
  motivo: 'Consulta general',
  estado: 'pendiente',
  veterinario: 'Dr. Juan Pérez Mock',
  veterinario_id: 'mock-staff-001',
  duracion_minutos: 30,
  activo: true,
};

export const MOCK_CITA_CANCELADA: Cita = {
  ...MOCK_CITA,
  id: 'mock-cita-002',
  estado: 'cancelada',
  motivo_cancelacion: 'Cliente solicitó reprogramar',
};

export const MOCK_STAFF_USUARIO: StaffUsuario = {
  id: 'mock-staff-001',
  nombre: 'Dr. Juan Pérez Mock',
  correo: 'dr.perez.mock@katzenvet.test',
  telefono: '5559876543',
  perfil: 'doctor',
  staffRole: 'doctor',
  activo: true,
  fecha_registro: '2025-06-01T08:00:00.000Z',
};

/** Producto de inventario para pruebas UI de mermas/stock (spec 007). */
export const MOCK_PRODUCTO_INVENTARIO = {
  id: 'mock-producto-001',
  codigo_barras: '7501234567890',
  nombre: 'Antibiótico Mock',
  descripcion: 'Producto de prueba para mermas',
  categoria: 'medicamento' as const,
  subcategoria: 'antibiótico',
  marca: 'Mock Pharma',
  presentacion: 'Caja 10 tab',
  unidad_medida: 'unidad' as const,
  stock_actual: 10,
  stock_minimo: 3,
  stock_maximo: 50,
  punto_reorden: 5,
  ubicacion_almacen: 'A-1',
  requiere_refrigeracion: false,
  fecha_caducidad_alerta_dias: 30,
  precio_compra: 50,
  precio_venta: 80,
  margen_ganancia: 37.5,
  iva_aplicable: true,
  proveedor_principal_id: 'mock-proveedor-001',
  proveedores_alternos: [] as string[],
  requiere_receta: true,
  controlado: false,
  activo: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

/** Stock agotado — casos de merma/salida rechazada. */
export const MOCK_PRODUCTO_SIN_STOCK = {
  ...MOCK_PRODUCTO_INVENTARIO,
  id: 'mock-producto-002',
  nombre: 'Vacuna Mock Agotada',
  stock_actual: 0,
};

/** Movimiento de caja — mocks UI (specs 014 + 021). */
export const MOCK_CAJA_MOVIMIENTO = {
  id: 'mock-caja-001',
  tipo: 'ingreso' as const,
  monto: 350,
  metodoPago: 'efectivo' as const,
  ivaDeclarado: false,
  concepto: 'Baño completo mock',
  fecha: '2026-08-26',
  categoria: 'banio' as const,
  costoAsociado: 85,
  margenEstimado: 265,
  activo: true,
  createdAt: '2026-08-26T12:00:00.000Z',
  createdBy: 'mock-staff'
};

/** Plantilla de costo de servicio — mocks UI (spec 021). */
export const MOCK_PLANTILLA_COSTO = {
  id: 'mock-plantilla-001',
  nombre: 'Baño completo mediano',
  tipoServicio: 'banio' as const,
  precioSugeridoCliente: 350,
  items: [
    {
      tipo: 'producto_inventario' as const,
      productoId: 'mock-producto-001',
      nombre: 'Shampoo mock',
      cantidad: 1,
      costoUnitario: 45
    },
    {
      tipo: 'gasto_libre' as const,
      nombre: 'Tiempo peluquero (~30 min)',
      cantidad: 1,
      costoUnitario: 40
    }
  ],
  costoTotalEstimado: 85,
  activo: true,
  createdAt: '2026-08-26T12:00:00.000Z',
  createdBy: 'mock-staff'
};

/** Defaults baño por tamaño — mocks UI (spec 022). */
export const MOCK_DEFAULTS_BANIO_TAMANO = {
  pequeno: { costoDefault: 40, precioSugerido: 250 },
  mediano: { costoDefault: 85, precioSugerido: 350 },
  grande: { costoDefault: 120, precioSugerido: 450 },
  updatedAt: '2026-08-26T12:00:00.000Z',
  updatedBy: 'mock-staff'
};

/** Defaults pensión por tamaño — mocks UI (spec 022 B). */
export const MOCK_DEFAULTS_PENSION_TAMANO = {
  pequeno: { precioDia: 200, costoDia: 60, cantidadComidaPorDia: 1 },
  mediano: { precioDia: 280, costoDia: 90, cantidadComidaPorDia: 1 },
  grande: { precioDia: 360, costoDia: 120, cantidadComidaPorDia: 2 },
  updatedAt: '2026-08-26T12:00:00.000Z',
  updatedBy: 'mock-staff'
};

/** Estancia pensión — mocks UI (spec 022 scaffold). */
export const MOCK_PENSION_ESTANCIA = {
  id: 'mock-pension-001',
  paciente_id: 'mock-paciente-001',
  paciente: 'Firulais Mock',
  cliente_id: 'mock-cliente-001',
  cliente: 'Dueño Mock',
  fecha_ingreso: '2026-08-26',
  fecha_salida_prevista: '2026-08-29',
  tamano_mascota: 'mediano' as const,
  precio_dia: 280,
  precio_total: 840,
  costo_dia: 90,
  costo_total_estimado: 270,
  estado: 'activa' as const,
  notas: 'Trae croquetas propias',
  activo: true,
  created_at: '2026-08-26T12:00:00.000Z',
  created_by: 'mock-staff'
};

/** Snapshot mock dashboard dueño (spec 025) — preview UI sin RTDB. */
export const MOCK_OWNER_DASHBOARD = {
  preset: 'este_mes' as const,
  rango: { desde: '2026-08-01', hasta: '2026-08-31', label: 'Este mes (2026-08)' },
  financieros: {
    ventaBruta: 18500,
    costosAsociados: 4200,
    gastosOperativos: 3100,
    gananciaNeta: 11200,
    transaccionesPeriodo: 42
  },
  operativos: {
    citasHoy: 5,
    citasPeriodo: 48,
    baniosPeriodo: 22,
    stockBajo: 3,
    clientesNuevosPeriodo: 7,
    pensionActivas: 2
  },
  topServicios: [
    { rank: 1, nombre: 'Baño / peluquería', detalle: '12 cobro(s)', monto: 6400 },
    { rank: 2, nombre: 'Consulta', detalle: '18 cobro(s)', monto: 5400 },
    { rank: 3, nombre: 'Vacuna', detalle: '6 cobro(s)', monto: 2100 }
  ],
  topProductos: [
    { rank: 1, nombre: 'Croquetas premium 2kg', detalle: '4 venta(s)', monto: 1800 },
    { rank: 2, nombre: 'Antipulgas Mock', detalle: '3 venta(s)', monto: 960 }
  ],
  serieIngresos: [
    { fecha: '2026-08-01', ingresos: 400 },
    { fecha: '2026-08-07', ingresos: 1200 },
    { fecha: '2026-08-15', ingresos: 800 },
    { fecha: '2026-08-21', ingresos: 1500 },
    { fecha: '2026-08-26', ingresos: 950 }
  ]
};

/** Baño mock para KPIs de peluquería (spec 025). */
export const MOCK_BANIO = {
  id: 'mock-banio-001',
  paciente_id: 'mock-mascota-001',
  cliente_id: 'mock-cliente-001',
  fecha_banio: '2026-08-20',
  hora_banio: '11:00',
  tipo_servicio: 'baño_completo' as const,
  estado: 'completado' as const,
  prioridad: 'media' as const,
  peluquero_id: 'mock-staff-001',
  precio_base: 350,
  precio_total: 450,
  pagado: true,
  metodo_pago: 'efectivo' as const,
  tamano_perro: 'mediano' as const,
  costoEstimado: 120,
  duracion_estimada: 60,
  activo: true,
  created_at: '2026-08-20T11:00:00.000Z',
  updated_at: '2026-08-20T12:00:00.000Z',
  created_by: 'mock-staff-001'
};


