/** Ítems pendientes de cobro del día — spec 040. */

export type PorCobrarTipo = 'visita' | 'banio' | 'cita' | 'pension' | 'vacuna' | 'historial';

export type PorCobrarAccion = 'abrir_ticket' | 'agregar_ticket';

export interface PorCobrarItem {
  key: string;
  tipo: PorCobrarTipo;
  id: string;
  cliente_id: string;
  cliente?: string;
  paciente?: string;
  paciente_id?: string;
  descripcion: string;
  monto: number;
  fecha: string;
  visitaId?: string;
  accion: PorCobrarAccion;
}

export interface PorCobrarInput {
  hoy: string;
  visitas: Array<{
    id?: string;
    cliente_id?: string;
    cliente?: string;
    paciente?: string;
    fecha?: string;
    saldo?: number;
    estado?: string;
    activo?: boolean;
  }>;
  banios: Array<{
    id?: string;
    cliente_id?: string;
    cliente?: string;
    paciente?: string;
    paciente_id?: string;
    fecha_banio?: string;
    precio_total?: number;
    estado?: string;
    pagado?: boolean;
    cajaMovimientoId?: string;
    visitaId?: string;
    activo?: boolean;
  }>;
  citas: Array<{
    id?: string;
    cliente_id?: string;
    cliente?: string;
    paciente?: string;
    paciente_id?: string;
    fecha?: string;
    fecha_hora?: string;
    estado?: string;
    precio?: number;
    monto?: number;
    cajaMovimientoId?: string;
    visitaId?: string;
    cobrada?: boolean;
    activo?: boolean;
  }>;
  pensiones: Array<{
    id?: string;
    cliente_id?: string;
    cliente?: string;
    paciente?: string;
    paciente_id?: string;
    fecha_ingreso?: string;
    precio_total?: number;
    precio_dia?: number;
    estado?: string;
    cajaMovimientoId?: string;
    visitaId?: string;
    cobradaEnVisitaId?: string;
    activo?: boolean;
  }>;
  vacunas: Array<{
    id?: string;
    paciente_id?: string;
    idCliente?: string;
    cliente_id?: string;
    fecha_vacuna?: string;
    fechaAplicacion?: string;
    tipo_vacuna?: string;
    vacuna?: string;
    estado?: string;
    aplicada?: boolean;
    precio?: number;
    visitaId?: string;
    activo?: boolean;
  }>;
  historiales: Array<{
    id?: string;
    cliente_id?: string;
    paciente_id?: string;
    paciente?: string;
    fecha_registro?: string;
    diagnostico_presuntivo?: string;
    visitaId?: string;
    cajaMovimientoId?: string;
    cobradaEnVisitaId?: string;
    activo?: boolean;
  }>;
  clientesMap?: Record<string, string>;
  pacientesClienteMap?: Record<string, { cliente_id: string; nombre?: string }>;
}
