import { bloquearCobroDirectoEnCaja, vinculadoATicketVisita } from '../core/utils/cobro-integridad.util';
import { PorCobrarInput, PorCobrarItem } from './por-cobrar-hoy.models';

function fechaIso(val: string | undefined | null): string {
  if (!val) return '';
  return String(val).slice(0, 10);
}

function vacunaAplicada(v: PorCobrarInput['vacunas'][0]): boolean {
  const est = String(v.estado || '').toLowerCase();
  if (est === 'aplicada' || est === 'completada') return true;
  return v.aplicada === true;
}

/** Agrega ítems «por cobrar hoy» desde fuentes clínicas y tickets. */
export function buildPorCobrarHoy(input: PorCobrarInput): PorCobrarItem[] {
  const hoy = input.hoy;
  const items: PorCobrarItem[] = [];
  const clientes = input.clientesMap || {};
  const pacMap = input.pacientesClienteMap || {};

  for (const v of input.visitas || []) {
    if (v.activo === false || v.estado === 'cancelada') continue;
    const saldo = Number(v.saldo) || 0;
    if (v.fecha !== hoy || saldo <= 0 || !v.id) continue;
    items.push({
      key: `visita-${v.id}`,
      tipo: 'visita',
      id: v.id,
      cliente_id: v.cliente_id || '',
      cliente: v.cliente,
      paciente: v.paciente,
      descripcion: `Ticket · saldo pendiente`,
      monto: saldo,
      fecha: v.fecha || hoy,
      visitaId: v.id,
      accion: 'abrir_ticket'
    });
  }

  for (const b of input.banios || []) {
    if (b.activo === false || b.estado === 'cancelado') continue;
    if (bloquearCobroDirectoEnCaja(b) || b.pagado) continue;
    if (b.estado !== 'completado') continue;
    const f = fechaIso(b.fecha_banio);
    if (f !== hoy || !b.id || !b.cliente_id) continue;
    items.push({
      key: `banio-${b.id}`,
      tipo: 'banio',
      id: b.id,
      cliente_id: b.cliente_id,
      cliente: b.cliente || clientes[b.cliente_id],
      paciente: b.paciente,
      paciente_id: b.paciente_id,
      descripcion: `Baño · ${b.paciente || 'paciente'}`,
      monto: Number(b.precio_total) || 0,
      fecha: f,
      accion: 'agregar_ticket'
    });
  }

  for (const c of input.citas || []) {
    if (c.activo === false) continue;
    if (bloquearCobroDirectoEnCaja(c)) continue;
    if (String(c.estado || '').toLowerCase() !== 'completada') continue;
    const f = fechaIso(c.fecha_hora || c.fecha);
    if (f !== hoy || !c.id || !c.cliente_id) continue;
    items.push({
      key: `cita-${c.id}`,
      tipo: 'cita',
      id: c.id,
      cliente_id: c.cliente_id,
      cliente: c.cliente || clientes[c.cliente_id],
      paciente: c.paciente,
      paciente_id: c.paciente_id,
      descripcion: `Consulta · ${c.paciente || 'paciente'}`,
      monto: Number(c.precio) || Number(c.monto) || 0,
      fecha: f,
      accion: 'agregar_ticket'
    });
  }

  for (const p of input.pensiones || []) {
    if (p.activo === false || p.estado === 'cancelada' || p.estado === 'reservada') continue;
    if (p.cajaMovimientoId || p.visitaId || p.cobradaEnVisitaId) continue;
    if (p.estado !== 'activa' && p.estado !== 'finalizada') continue;
    const f = fechaIso(p.fecha_ingreso);
    if (f !== hoy || !p.id || !p.cliente_id) continue;
    items.push({
      key: `pension-${p.id}`,
      tipo: 'pension',
      id: p.id,
      cliente_id: p.cliente_id,
      cliente: p.cliente || clientes[p.cliente_id],
      paciente: p.paciente,
      paciente_id: p.paciente_id,
      descripcion: `Pensión · ${p.paciente || 'mascota'}`,
      monto: Number(p.precio_total) || Number(p.precio_dia) || 0,
      fecha: f,
      accion: 'agregar_ticket'
    });
  }

  for (const v of input.vacunas || []) {
    if (v.activo === false || !vacunaAplicada(v)) continue;
    if (v.visitaId || !v.id) continue;
    const f = fechaIso(v.fecha_vacuna || v.fechaAplicacion);
    if (f !== hoy) continue;
    const pacienteId = v.paciente_id || '';
    const link = pacMap[pacienteId];
    const clienteId = v.cliente_id || v.idCliente || link?.cliente_id || '';
    if (!clienteId) continue;
    items.push({
      key: `vacuna-${v.id}`,
      tipo: 'vacuna',
      id: v.id,
      cliente_id: clienteId,
      cliente: clientes[clienteId],
      paciente: link?.nombre,
      paciente_id: pacienteId,
      descripcion: `Vacuna · ${v.tipo_vacuna || v.vacuna || 'aplicada'}`,
      monto: Number(v.precio) || 0,
      fecha: f,
      accion: 'agregar_ticket'
    });
  }

  for (const h of input.historiales || []) {
    if (h.activo === false || !h.id) continue;
    if (vinculadoATicketVisita(h) || h.cajaMovimientoId || h.cobradaEnVisitaId) continue;
    const f = fechaIso(h.fecha_registro);
    if (f !== hoy) continue;
    const clienteId = h.cliente_id || pacMap[h.paciente_id || '']?.cliente_id || '';
    if (!clienteId) continue;
    items.push({
      key: `historial-${h.id}`,
      tipo: 'historial',
      id: h.id,
      cliente_id: clienteId,
      cliente: clientes[clienteId],
      paciente: h.paciente,
      paciente_id: h.paciente_id,
      descripcion: `Consulta · ${String(h.diagnostico_presuntivo || 'historial').slice(0, 40)}`,
      monto: 0,
      fecha: f,
      accion: 'agregar_ticket'
    });
  }

  return items.sort((a, b) => {
    if (a.accion !== b.accion) return a.accion === 'abrir_ticket' ? -1 : 1;
    return a.descripcion.localeCompare(b.descripcion);
  });
}

export function totalPorCobrarHoy(items: PorCobrarItem[]): number {
  return Math.round(items.reduce((s, i) => s + Math.max(0, Number(i.monto) || 0), 0) * 100) / 100;
}
