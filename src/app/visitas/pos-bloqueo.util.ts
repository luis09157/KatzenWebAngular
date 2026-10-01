/**
 * Hints / bloqueos de acciones del POS — copy puro (spec 065 / 076).
 * Extraído de getters de `visita-dialog` sin cambiar textos.
 */
import { VisitaLinea } from './visitas.models';

export interface PosBloqueoCtx {
  soloLectura: boolean;
  modoMostrador: boolean;
  /** Mensaje activo «te falta dueño/mascota» (riel clínico). */
  mensajeRequiereCliente: string;
  tieneClienteId: boolean;
  formInvalid: boolean;
  tieneFecha: boolean;
  lineasCount: number;
  saldo: number;
  pagado: number;
}

export interface PosSubtituloCtx {
  resultadoCobro: { parcial: boolean } | null;
  modoMostrador: boolean;
  cliente: string;
  paciente: string;
}

export interface PosChipClienteCtx {
  modoMostrador: boolean;
  cliente: string;
  paciente: string;
}

export interface PosInventarioHintCtx {
  soloLectura: boolean;
  mostrandoProducto: boolean;
  lineas: ReadonlyArray<Pick<VisitaLinea, 'categoria' | 'movimientoInventarioId'>>;
}

export interface PosWhatsappHintCtx {
  modoMostrador: boolean;
  telefonoCliente: string;
}

export interface PosPuedeGuardarCtx {
  loading: boolean;
  soloLectura: boolean;
  tieneFecha: boolean;
  modoMostrador: boolean;
  formValid: boolean;
}

const HINT_BLOQUE_CLIENTE_DEFAULT =
  'Opcional para productos: liga el ticket a un dueño para guardar su historial y saldo. Para consulta, vacuna, baño o pensión sí hace falta dueño y mascota.';

export function hintBloqueCliente(mensajeRequiereCliente: string): string {
  if (mensajeRequiereCliente) return mensajeRequiereCliente;
  return HINT_BLOQUE_CLIENTE_DEFAULT;
}

export function subtituloPos(ctx: PosSubtituloCtx): string {
  const cliente = String(ctx.cliente || '').trim();
  const paciente = String(ctx.paciente || '').trim();
  if (ctx.resultadoCobro) {
    return ctx.resultadoCobro.parcial ? 'Pago parcial registrado' : 'Venta cobrada · ticket en $0';
  }
  if (ctx.modoMostrador) return 'Venta rápida · sin cliente (opcional)';
  if (cliente) return paciente ? `${cliente} · ${paciente}` : cliente;
  return 'Elige al dueño o sigue sin cliente';
}

export function chipClienteLabel(ctx: PosChipClienteCtx): string {
  if (ctx.modoMostrador) return 'Sin cliente · ¿Es cliente?';
  const nombre = String(ctx.cliente || '').trim();
  const paciente = String(ctx.paciente || '').trim();
  if (!nombre) return 'Elegir dueño';
  return paciente ? `${nombre} · ${paciente}` : nombre;
}

export function whatsappHint(ctx: PosWhatsappHintCtx): string {
  if (ctx.modoMostrador) {
    return 'Venta de mostrador: escribe el teléfono del comprador si quiere su ticket (opcional).';
  }
  if (!ctx.telefonoCliente) {
    return 'Este dueño no tiene teléfono registrado. Escríbelo aquí para enviarle el ticket.';
  }
  return 'Se abre WhatsApp con el ticket ya escrito; solo toca enviar.';
}

export function cobrarLabel(saldo: number, pagado: number, formatMoney: (n: number) => string): string {
  if (saldo <= 0) return 'Cobrar';
  if (pagado > 0) return `Cobrar resto ${formatMoney(saldo)}`;
  return `Cobrar ${formatMoney(saldo)}`;
}

export function accionBloqueoHint(ctx: PosBloqueoCtx): string {
  if (ctx.soloLectura) return '';
  if (ctx.mensajeRequiereCliente) return ctx.mensajeRequiereCliente;
  if (!ctx.modoMostrador && !ctx.tieneClienteId) {
    return 'Elige al dueño, o sigue sin cliente para vender solo productos.';
  }
  if (ctx.formInvalid && !ctx.modoMostrador) {
    return 'Completa la fecha y el dueño para continuar.';
  }
  if (!ctx.tieneFecha) {
    return 'Indica la fecha de la cuenta.';
  }
  if (!ctx.lineasCount) {
    return 'Agrega un producto o servicio antes de cobrar.';
  }
  if (ctx.saldo <= 0) {
    return 'No hay saldo pendiente. Puedes guardar o cerrar.';
  }
  return '';
}

export function guardarBloqueoHint(ctx: PosBloqueoCtx): string {
  if (ctx.soloLectura) return 'Ticket cerrado o cancelado';
  if (!ctx.modoMostrador && !ctx.tieneClienteId) {
    return 'Elige al dueño o sigue sin cliente';
  }
  if (!ctx.modoMostrador && ctx.formInvalid) return 'Completa los datos requeridos';
  if (!ctx.tieneFecha) return 'Indica la fecha';
  return 'Guardar sin cobrar';
}

export function cobrarBloqueoHint(ctx: PosBloqueoCtx): string {
  if (ctx.soloLectura) return 'Ticket cerrado o cancelado';
  if (!ctx.modoMostrador && !ctx.tieneClienteId) {
    return 'Elige al dueño o sigue sin cliente';
  }
  if (!ctx.modoMostrador && ctx.formInvalid) return 'Completa los datos requeridos';
  if (!ctx.lineasCount) return 'Agrega líneas al ticket';
  if (ctx.saldo <= 0) return 'No hay saldo por cobrar';
  return 'Confirmar cobro';
}

export function inventarioHint(ctx: PosInventarioHintCtx): string {
  if (ctx.soloLectura) return '';
  if (ctx.mostrandoProducto) {
    return 'Al guardar o cobrar se registrará la salida de inventario por la cantidad vendida.';
  }
  const productos = ctx.lineas.filter((l) => l.categoria === 'venta_producto');
  if (!productos.length) return '';
  const pendientes = productos.filter((l) => !l.movimientoInventarioId);
  if (pendientes.length) {
    return `${pendientes.length} producto(s) en el ticket: al guardar o cobrar se descontará del stock en Inventario.`;
  }
  return 'Los productos de este ticket ya tienen salida registrada en inventario.';
}

export function puedeGuardarPos(ctx: PosPuedeGuardarCtx): boolean {
  if (ctx.loading || ctx.soloLectura) return false;
  if (!ctx.tieneFecha) return false;
  if (ctx.modoMostrador) return true;
  return ctx.formValid;
}

export function puedeCobrarPos(puedeGuardar: boolean, saldo: number): boolean {
  return puedeGuardar && saldo > 0;
}
