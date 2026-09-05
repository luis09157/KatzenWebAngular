/**
 * Spec 071 — view-model del ticket térmico 80 mm.
 * Mismo desglose que WhatsApp (065) para no divergir copy.
 */
import { cantidadLinea, nombreBaseLinea, roundMoney } from './visitas.util';
import {
  CLINICA_NOMBRE_TICKET,
  TicketWhatsAppInput,
  fechaTicketLegible,
  folioCortoVisita,
  formatMoneyTicket,
  labelMetodoPagoTicket,
  totalesTicketWhatsApp,
} from './pos-ticket-whatsapp.util';
import { folioVisibleTicket } from './folio-ticket-visita.util';

export const TICKET_80_ANCHO_MM = 80;
export const TICKET_80_UTIL_MM = 72;

export interface Ticket80LineaView {
  qty: number;
  nombre: string;
  importe: string;
  devuelto: boolean;
}

export interface Ticket80PagoView {
  label: string;
  monto: string;
}

export interface Ticket80View {
  clinica: string;
  folio: string;
  fecha: string;
  cliente: string;
  paciente: string;
  esMostrador: boolean;
  lineas: Ticket80LineaView[];
  descuento: string;
  iva: string;
  devuelto: string;
  total: string;
  pagos: Ticket80PagoView[];
  pagoUnico: string;
  recibido: string;
  cambio: string;
  saldoPendiente: string;
}

export function folioParaTicket(input: Pick<TicketWhatsAppInput, 'folio' | 'visitaId'>): string {
  return folioVisibleTicket(input.folio) || folioCortoVisita(input.visitaId);
}

export function buildTicket80View(input: TicketWhatsAppInput): Ticket80View {
  const clinica = String(input.clinica || CLINICA_NOMBRE_TICKET).trim() || CLINICA_NOMBRE_TICKET;
  const lineasIn = (input.lineas || []).filter(Boolean);
  const { total, iva, devuelto } = totalesTicketWhatsApp(lineasIn);
  const descuento = Number(input.descuento) || 0;
  const esMostrador =
    input.esMostrador === true || !String(input.cliente || '').trim() || /mostrador/i.test(String(input.cliente));
  const pagos = (input.pagos || []).filter((p) => p && Number(p.monto) > 0);
  const recibido = Number(input.recibido) || 0;
  const cambio = Number(input.cambio) || 0;
  const saldo = Number(input.saldoPendiente) || 0;

  return {
    clinica,
    folio: folioParaTicket(input),
    fecha: fechaTicketLegible(input.fecha),
    cliente: esMostrador ? 'Venta de mostrador' : String(input.cliente || '').trim(),
    paciente: esMostrador ? '' : String(input.paciente || '').trim(),
    esMostrador,
    lineas: lineasIn.map((l) => ({
      qty: cantidadLinea(l),
      nombre: nombreBaseLinea(l.descripcion) || 'Artículo',
      importe: formatMoneyTicket(l.monto),
      devuelto: !!l.fueDevuelto,
    })),
    descuento: descuento > 0 ? `-${formatMoneyTicket(descuento)}` : '',
    iva: iva > 0 ? formatMoneyTicket(iva) : '',
    devuelto: devuelto > 0 ? `-${formatMoneyTicket(devuelto)}` : '',
    total: formatMoneyTicket(roundMoney(Math.max(0, total - descuento))),
    pagos: pagos.map((p) => ({
      label: labelMetodoPagoTicket(p.metodo),
      monto: formatMoneyTicket(p.monto),
    })),
    pagoUnico:
      pagos.length === 1 ? `${labelMetodoPagoTicket(pagos[0].metodo)} ${formatMoneyTicket(pagos[0].monto)}` : '',
    recibido: recibido > 0 ? formatMoneyTicket(recibido) : '',
    cambio: cambio > 0 ? formatMoneyTicket(cambio) : '',
    saldoPendiente: saldo > 0 ? formatMoneyTicket(saldo) : '',
  };
}
