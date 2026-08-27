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
  /** Spec 034 — alergias canónicas en expediente. */
  alergias: ['Penicilina', 'Shampoo común'],
};

/** Cliente adicional para probar autocomplete «Luis» (spec 029). */
export const MOCK_CLIENTE_LUIS: Cliente = {
  id: 'mock-cliente-luis',
  nombre: 'Luis',
  apellidoPaterno: 'Niño',
  apellidoMaterno: 'Martínez',
  telefono: '5550001234',
  correo: 'luisk21fy@gmail.com',
  expediente: 'EXP-LUIS-001',
  activo: true,
};

/** Mascota de Luis — preview picker pensión/citas. */
export const MOCK_MASCOTA_LUIS: Paciente = {
  id: 'mock-mascota-luis',
  nombre: 'Firulais',
  especie: 'Canino',
  raza: 'Labrador',
  tamano_perro: 'mediano',
  idCliente: MOCK_CLIENTE_LUIS.id,
  cliente_id: MOCK_CLIENTE_LUIS.id,
  activo: true,
};

/** Lista mock para autocomplete cliente→paciente (spec 029). */
export const MOCK_CLIENTES_PICKER: Cliente[] = [MOCK_CLIENTE, MOCK_CLIENTE_LUIS];

export const MOCK_PACIENTES_PICKER: Paciente[] = [MOCK_MASCOTA, MOCK_MASCOTA_LUIS];

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

/** Proveedor de inventario — catálogo para selects de producto/OC (spec 026). */
export const MOCK_PROVEEDOR = {
  id: 'mock-proveedor-001',
  razon_social: 'Distribuidora Mock SA de CV',
  nombre_comercial: 'Proveedor Mock',
  rfc: 'DMO010101AAA',
  contacto_nombre: 'Contacto Mock',
  contacto_telefono: '5512345678',
  contacto_email: 'proveedor.mock@katzenvet.test',
  direccion: 'Calle Mock 1',
  ciudad: 'CDMX',
  estado: 'CDMX',
  codigo_postal: '01000',
  productos_suministra: ['Medicamentos', 'Vacunas'] as string[],
  dias_entrega: 5,
  condiciones_pago: 'contado',
  calificacion: 5,
  activo: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
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
  margen_ganancia: 60,
  /** Medicamento: default sugerido sin IVA / tasa 0 (staff confirma). */
  iva_aplicable: false,
  tasa_iva: 0,
  proveedor_principal_id: 'mock-proveedor-001',
  proveedores_alternos: [] as string[],
  requiere_receta: true,
  controlado: false,
  activo: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

/** Accesorio con IVA 16% — preview precio con IVA. */
export const MOCK_PRODUCTO_ACCESORIO_IVA = {
  ...MOCK_PRODUCTO_INVENTARIO,
  id: 'mock-producto-accesorio-iva',
  nombre: 'Collar Mock',
  categoria: 'accesorio' as const,
  precio_compra: 40,
  precio_venta: 80,
  margen_ganancia: 100,
  iva_aplicable: true,
  tasa_iva: 16,
  requiere_receta: false,
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
  peluquero: 'María Peluquera Mock',
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

/**
 * Caso legacy costo = venta → margen 0, ingreso bruto 200 (spec 025 KPI).
 * Sin cajaMovimientoId: refuerzo dashboard ingresos.
 * Nota: el formulario de baño ya no permite guardar costo ≥ venta (regla 2026-08-26);
 * este mock solo simula datos históricos / lectura de KPIs.
 */
export const MOCK_BANIO_COSTO_IGUAL_VENTA = {
  ...MOCK_BANIO,
  id: 'mock-banio-margen-cero',
  precio_base: 200,
  precio_total: 200,
  costoEstimado: 200,
  pagado: true,
  fecha_banio: '2026-08-26'
};

/** Caso válido para formulario: costo estrictamente menor que venta. */
export const MOCK_BANIO_COSTO_MENOR_VENTA = {
  ...MOCK_BANIO,
  id: 'mock-banio-margen-ok',
  precio_base: 200,
  precio_total: 200,
  costoEstimado: 150,
  pagado: true,
  fecha_banio: '2026-08-26'
};

/** Caso inválido para validación de formulario: costo > venta. */
export const MOCK_BANIO_COSTO_MAYOR_VENTA = {
  ...MOCK_BANIO,
  id: 'mock-banio-costo-invalido',
  precio_base: 200,
  precio_total: 200,
  costoEstimado: 250,
  pagado: false,
  fecha_banio: '2026-08-26'
};

/** Baños visibles en portal dueño (spec 028) — sin costos ni caja. */
export const MOCK_PORTAL_BANIO = {
  ...MOCK_BANIO,
  paciente_id: MOCK_MASCOTA.id!,
  cliente_id: MOCK_CLIENTE.id!,
  peluquero: 'María Peluquera',
  observaciones: 'Shampoo hipoalergénico'
};

export const MOCK_PORTAL_BANIOS = [
  MOCK_PORTAL_BANIO,
  {
    ...MOCK_PORTAL_BANIO,
    id: 'mock-banio-portal-002',
    fecha_banio: '2026-07-15',
    hora_banio: '10:30',
    tipo_servicio: 'corte_pelo' as const,
    estado: 'completado' as const,
    observaciones: 'Corte verano'
  }
];

/** Portal pensión / recordatorios (spec 031) — sin costos ni caja. */
export const MOCK_PORTAL_PENSION = {
  id: MOCK_PENSION_ESTANCIA.id,
  paciente_id: MOCK_MASCOTA.id!,
  cliente_id: MOCK_CLIENTE.id!,
  fecha_ingreso: MOCK_PENSION_ESTANCIA.fecha_ingreso,
  fecha_salida_prevista: MOCK_PENSION_ESTANCIA.fecha_salida_prevista,
  estado: 'activa',
  estado_label: 'Activa',
  notas: MOCK_PENSION_ESTANCIA.notas,
  paciente: MOCK_PENSION_ESTANCIA.paciente,
  cliente: MOCK_PENSION_ESTANCIA.cliente
};

export const MOCK_PORTAL_RECORDATORIO = {
  id: 'mock-recordatorio-001',
  paciente_id: MOCK_MASCOTA.id!,
  titulo: 'Refuerzo vacuna',
  fecha: '2026-09-15',
  estado: 'pendiente',
  tipo: 'vacuna',
  notas: 'Traer cartilla'
};

export const MOCK_HISTORIAL = {
  id: 'mock-historial-001',
  paciente_id: MOCK_MASCOTA.id!,
  historia_clinica: 'Consulta mock',
  diagnostico_presuntivo: 'Dermatitis',
  manejo_terapeutico: 'Antihistamínico',
  peso: '8',
  tr: '38.5',
  hallazgos: 'Sin hallazgos graves',
  medico_atendio: 'Dr. Juan Pérez Mock',
  medico_atendio_uid: 'mock-staff-001',
  fecha_registro: '2026-08-26 10:00:00',
  activo: true
};

/** Spec 033 — vacuna con próxima + recordatorio auto enlazado. */
export const MOCK_VACUNA = {
  id: 'mock-vacuna-001',
  idPaciente: MOCK_MASCOTA.id!,
  paciente_id: MOCK_MASCOTA.id!,
  idCliente: MOCK_CLIENTE.id!,
  cliente_id: MOCK_CLIENTE.id!,
  vacuna: 'antirrabica',
  dosis: '1ml',
  fechaAplicacion: '2026-08-26',
  proximaAplicacion: '2027-08-26',
  intervalo: 365,
  aplicada: true,
  recordatorio: true,
  veterinario: 'Dr. Juan Pérez Mock',
  veterinario_id: 'mock-staff-001',
  activo: true
};

export const MOCK_RECORDATORIO_VACUNA_AUTO = {
  id: 'mock-recordatorio-vacuna-auto-001',
  paciente_id: MOCK_MASCOTA.id!,
  cliente_id: MOCK_CLIENTE.id!,
  titulo: 'Refuerzo vacuna: Antirrábica',
  descripcion: 'Próximo refuerzo de Antirrábica (1ml) programado para el 26 de agosto de 2027.',
  tipo: 'vacuna',
  fecha_hora_recordatorio: '2027-08-26 09:00:00',
  fecha_recordatorio: '2027-08-26 09:00:00',
  estado: 'pendiente',
  prioridad: 'alta',
  vacunaId: MOCK_VACUNA.id,
  vacuna_relacionada_id: MOCK_VACUNA.id,
  origen: 'vacuna_auto',
  activo: true
};

/** Spec 032 — ticket visita + CxC. */
export const MOCK_VISITA = {
  id: 'mock-visita-001',
  cliente_id: MOCK_CLIENTE.id!,
  cliente: 'Ana Pérez',
  paciente_id: MOCK_MASCOTA.id!,
  paciente: MOCK_MASCOTA.nombre,
  fecha: '2026-08-26',
  estado: 'abierta' as const,
  atendidoPorUid: 'mock-staff-001',
  atendidoPorNombre: 'Dr. Juan Pérez Mock',
  lineas: [
    {
      id: 'ln-1',
      descripcion: 'Consulta general',
      monto: 400,
      categoria: 'consulta' as const
    },
    {
      id: 'ln-2',
      descripcion: 'Baño completo',
      monto: 350,
      categoria: 'banio' as const
    }
  ],
  total: 750,
  pagado: 0,
  saldo: 750,
  cajaMovimientoIds: [] as string[],
  activo: true,
  created_at: '2026-08-26T15:00:00.000Z'
};

export const MOCK_VISITA_PARCIAL = {
  ...MOCK_VISITA,
  id: 'mock-visita-002',
  estado: 'parcial' as const,
  pagado: 300,
  saldo: 450,
  cajaMovimientoIds: ['mock-caja-visita-1']
};

export const MOCK_PORTAL_VISITA = {
  id: MOCK_VISITA_PARCIAL.id,
  paciente_id: MOCK_MASCOTA.id!,
  cliente_id: MOCK_CLIENTE.id!,
  fecha: MOCK_VISITA_PARCIAL.fecha,
  estado: 'parcial',
  estado_label: 'Pago parcial',
  total: 750,
  pagado: 300,
  saldo: 450,
  lineas_count: 2,
  notas: '',
  paciente: MOCK_MASCOTA.nombre,
  cliente: 'Ana Pérez'
};

/** Spec 037 — consentimiento clínico. */
export const MOCK_CONSENTIMIENTO = {
  id: 'mock-consent-001',
  cliente_id: MOCK_CLIENTE.id!,
  cliente: 'Ana Pérez',
  paciente_id: MOCK_MASCOTA.id!,
  paciente: MOCK_MASCOTA.nombre,
  tipo: 'cirugia' as const,
  fecha: '2026-08-26',
  firmado_por: 'Ana Pérez',
  parentesco: 'Dueña',
  staff_uid: 'mock-staff-001',
  staff_nombre: 'Dr. Juan Pérez Mock',
  notas: 'Consentimiento informado prequirúrgico',
  estado: 'vigente' as const,
  activo: true,
  created_at: '2026-08-26T16:00:00.000Z'
};

export const MOCK_PORTAL_CONSENTIMIENTO = {
  id: MOCK_CONSENTIMIENTO.id,
  paciente_id: MOCK_CONSENTIMIENTO.paciente_id,
  cliente_id: MOCK_CONSENTIMIENTO.cliente_id,
  fecha: MOCK_CONSENTIMIENTO.fecha,
  tipo: MOCK_CONSENTIMIENTO.tipo,
  tipo_label: 'Cirugía',
  estado: 'vigente',
  estado_label: 'Vigente',
  firmado_por: MOCK_CONSENTIMIENTO.firmado_por,
  parentesco: MOCK_CONSENTIMIENTO.parentesco,
  notas: MOCK_CONSENTIMIENTO.notas,
  paciente: MOCK_CONSENTIMIENTO.paciente,
  cliente: MOCK_CONSENTIMIENTO.cliente
};

/** Meta de inversión dashboard (spec 030). */
export const MOCK_INVERSION_META = {
  montoMeta: 500000,
  updatedAt: '2026-08-26T12:00:00.000Z',
  updatedBy: 'mock-staff-admin'
};

