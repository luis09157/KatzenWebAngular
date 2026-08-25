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
  veterinario_id: 'mock-staff-001',
  activo: true,
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
