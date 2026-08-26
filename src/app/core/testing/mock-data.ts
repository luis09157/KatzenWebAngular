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

/** Movimiento de caja — mocks UI (spec 014). */
export const MOCK_CAJA_MOVIMIENTO = {
  id: 'mock-caja-001',
  tipo: 'ingreso' as const,
  monto: 350,
  metodoPago: 'efectivo' as const,
  ivaDeclarado: false,
  concepto: 'Baño completo mock',
  fecha: '2026-08-26',
  activo: true,
  createdAt: '2026-08-26T12:00:00.000Z',
  createdBy: 'mock-staff'
};


