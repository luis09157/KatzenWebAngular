/**
 * Spec 065 — ticket de venta por WhatsApp (`wa.me`), sin infraestructura.
 * Util puro: no toca RTDB ni servicios. Copy en español latino para el dueño.
 */
import { CajaMetodoPago } from '../finanzas/caja.models';
import { VisitaLinea } from './visitas.models';
import { cantidadLinea, nombreBaseLinea, roundMoney } from './visitas.util';

export const CLINICA_NOMBRE_TICKET = 'KatzenVet';
export const WHATSAPP_LADA_MX = '52';

export interface PagoTicketWhatsApp {
  metodo: CajaMetodoPago | string;
  monto: number;
}

export type LineaTicketWhatsApp = Pick<VisitaLinea, 'descripcion' | 'monto' | 'cantidad'> &
  Partial<Pick<VisitaLinea, 'fueDevuelto' | 'iva' | 'aplicaIva'>>;

export interface TicketWhatsAppInput {
  /** Nombre visible de la clínica (default KatzenVet). */
  clinica?: string;
  /** Fecha del ticket `yyyy-mm-dd` (o texto ya formateado). */
  fecha: string;
  /** Id de la visita; se recorta a folio corto si no hay `folio`. */
  visitaId?: string | null;
  /** Spec 071 — folio persistido (KV-YYYYMMDD-NNN). Gana sobre el id. */
  folio?: string | null;
  /** Nombre del cliente; vacío o mostrador → «Venta de mostrador». */
  cliente?: string | null;
  esMostrador?: boolean;
  paciente?: string | null;
  lineas: LineaTicketWhatsApp[];
  pagos: PagoTicketWhatsApp[];
  /** Opcional (aditivo): efectivo recibido y cambio entregado. */
  recibido?: number | null;
  cambio?: number | null;
  /** Descuento total aplicado (si el flujo lo tiene). */
  descuento?: number | null;
  /** Saldo que queda pendiente tras el pago (pago parcial). */
  saldoPendiente?: number | null;
}

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
};

export function formatMoneyTicket(n: number | null | undefined): string {
  return `$${(Number(n) || 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Folio legible: últimos 6 caracteres alfanuméricos en mayúsculas. */
export function folioCortoVisita(visitaId: string | null | undefined): string {
  const limpio = String(visitaId || '').replace(/[^a-z0-9]/gi, '');
  if (!limpio) return '';
  return limpio.slice(-6).toUpperCase();
}

/**
 * Normaliza a 10 dígitos MX. Ignora espacios, guiones, paréntesis, `+`.
 * Acepta 52XXXXXXXXXX / 521XXXXXXXXXX (quita lada). Devuelve `null` si no son 10 dígitos.
 */
export function normalizarTelefonoWhatsApp(raw: unknown): string | null {
  let digits = String(raw ?? '').replace(/\D+/g, '');
  if (!digits) return null;
  if (digits.length === 13 && digits.startsWith('521')) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith('52')) digits = digits.slice(2);
  return /^\d{10}$/.test(digits) ? digits : null;
}

/** ¿El teléfono sirve para abrir WhatsApp? */
export function telefonoWhatsAppValido(raw: unknown): boolean {
  return normalizarTelefonoWhatsApp(raw) !== null;
}

/** Fecha `yyyy-mm-dd` → `dd/mm/yyyy`; otros formatos se devuelven tal cual. */
export function fechaTicketLegible(fecha: string | null | undefined): string {
  const f = String(fecha || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(f);
  if (!m) return f;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function labelMetodoPagoTicket(metodo: string | null | undefined): string {
  const k = String(metodo || '')
    .trim()
    .toLowerCase();
  return METODO_LABEL[k] || (k ? k.charAt(0).toUpperCase() + k.slice(1) : 'Pago');
}

function lineaTexto(l: LineaTicketWhatsApp): string {
  const qty = cantidadLinea(l);
  const nombre = nombreBaseLinea(l.descripcion) || 'Artículo';
  const importe = formatMoneyTicket(l.monto);
  const devuelto = l.fueDevuelto ? ' (devuelto)' : '';
  return `• ${qty} × ${nombre} = ${importe}${devuelto}`;
}

/** Total cobrable (excluye devueltas), IVA incluido en líneas con snapshot. */
export function totalesTicketWhatsApp(lineas: LineaTicketWhatsApp[]): {
  total: number;
  iva: number;
  devuelto: number;
} {
  let total = 0;
  let iva = 0;
  let devuelto = 0;
  for (const l of lineas || []) {
    const monto = Number(l?.monto) || 0;
    if (l?.fueDevuelto) {
      devuelto += monto;
      continue;
    }
    total += monto;
    if (Number(l?.iva) > 0) iva += Number(l.iva);
  }
  return { total: roundMoney(total), iva: roundMoney(iva), devuelto: roundMoney(devuelto) };
}

/** Texto plano del ticket para prellenar WhatsApp. */
export function generarTextoTicketWhatsApp(input: TicketWhatsAppInput): string {
  const clinica = String(input.clinica || CLINICA_NOMBRE_TICKET).trim() || CLINICA_NOMBRE_TICKET;
  const lineas = (input.lineas || []).filter(Boolean);
  const { total, iva, devuelto } = totalesTicketWhatsApp(lineas);
  const folio = String(input.folio || '').trim() || folioCortoVisita(input.visitaId);
  const esMostrador =
    input.esMostrador === true || !String(input.cliente || '').trim() || /mostrador/i.test(String(input.cliente));

  const out: string[] = [];
  out.push(`*${clinica}* — Ticket de venta`);
  out.push(`Fecha: ${fechaTicketLegible(input.fecha)}${folio ? ` · Folio ${folio}` : ''}`);
  if (esMostrador) {
    out.push('Cliente: Venta de mostrador');
  } else {
    out.push(`Cliente: ${String(input.cliente).trim()}`);
    const paciente = String(input.paciente || '').trim();
    if (paciente) out.push(`Mascota: ${paciente}`);
  }
  out.push('');
  if (lineas.length) {
    for (const l of lineas) out.push(lineaTexto(l));
  } else {
    out.push('• Sin artículos');
  }
  out.push('');
  const descuento = Number(input.descuento) || 0;
  if (descuento > 0) {
    out.push(`Descuento: -${formatMoneyTicket(descuento)}`);
  }
  if (devuelto > 0) {
    out.push(`Devoluciones: -${formatMoneyTicket(devuelto)}`);
  }
  if (iva > 0) {
    out.push(`IVA incluido: ${formatMoneyTicket(iva)}`);
  }
  out.push(`*Total: ${formatMoneyTicket(roundMoney(Math.max(0, total - descuento)))}*`);

  const pagos = (input.pagos || []).filter((p) => p && Number(p.monto) > 0);
  if (pagos.length === 1) {
    out.push(`Pago: ${labelMetodoPagoTicket(pagos[0].metodo)} ${formatMoneyTicket(pagos[0].monto)}`);
  } else if (pagos.length > 1) {
    out.push('Pago mixto:');
    for (const p of pagos) {
      out.push(`  - ${labelMetodoPagoTicket(p.metodo)}: ${formatMoneyTicket(p.monto)}`);
    }
  }
  const recibido = Number(input.recibido) || 0;
  const cambio = Number(input.cambio) || 0;
  if (recibido > 0) out.push(`Recibido: ${formatMoneyTicket(recibido)}`);
  if (cambio > 0) out.push(`Cambio: ${formatMoneyTicket(cambio)}`);
  const saldo = Number(input.saldoPendiente) || 0;
  if (saldo > 0) out.push(`Saldo pendiente: ${formatMoneyTicket(saldo)}`);

  out.push('');
  out.push('Gracias por su visita 🐾');
  return out.join('\n');
}

/** `https://wa.me/52XXXXXXXXXX?text=...`. Sin teléfono válido → `null`. */
export function urlWhatsAppTicket(telefono: unknown, texto: string): string | null {
  const tel = normalizarTelefonoWhatsApp(telefono);
  if (!tel) return null;
  return `https://wa.me/${WHATSAPP_LADA_MX}${tel}?text=${encodeURIComponent(texto)}`;
}
