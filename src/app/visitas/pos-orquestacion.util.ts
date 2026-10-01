/**
 * Orquestación de guardar / cobrar del POS (spec 079).
 * Orden de pasos, validaciones previas y mensajes de resultado —
 * casi puro (deps inyectadas para I/O). Sin cambiar negocio (mostrador, mixto, kits, turno implícito).
 */
import { CajaCategoria, CajaMetodoPago } from '../finanzas/caja.models';
import {
  PartePagoMixto,
  armarPartesPagoMixto,
  mensajePagoInvalido,
  validarPagoContraSaldo,
} from './pos-pago-mixto.util';
import { esClienteMostrador } from './visita-mostrador.util';
import { Visita, VisitaLinea, VisitaLineaCategoria, VISITA_LINEA_A_CAJA } from './visitas.models';
import { roundMoney } from './visitas.util';

export type PosUiAlertIcon = 'warning' | 'error' | 'success' | 'info' | 'question';

export interface PosUiAlert {
  title: string;
  text: string;
  icon: PosUiAlertIcon;
}

export interface PosToastExito {
  title: string;
  text: string;
  timer: number;
}

export interface PrecondicionesCobroInput {
  soloLectura: boolean;
  puedeCobrar: boolean;
  lineasCount: number;
  saldo: number;
  mixto: boolean;
  metodoPago: string;
  monto: number;
  montoEfectivo: number;
  montoTarjeta: number;
  montoTransferencia: number;
  incluyeEfectivo: boolean;
  cambioEfectivoOk: boolean;
  cambioEfectivoError?: string;
}

export type PrecondicionesCobroFail = {
  ok: false;
  skipped?: true;
  alert?: PosUiAlert;
  markCobroTouched?: boolean;
};

export type PrecondicionesCobroOk = {
  ok: true;
  partes: PartePagoMixto[];
  montoPago: number;
};

export type PrecondicionesCobroResult = PrecondicionesCobroFail | PrecondicionesCobroOk;

/** Validación previa a persistir/cobrar (mismas alertas que el diálogo). */
export function validarPrecondicionesCobro(input: PrecondicionesCobroInput): PrecondicionesCobroResult {
  if (input.soloLectura || !input.puedeCobrar) {
    return { ok: false, skipped: true };
  }
  if (!input.lineasCount) {
    return {
      ok: false,
      alert: {
        title: 'Sin líneas',
        text: 'Agrega al menos un servicio o producto al ticket.',
        icon: 'warning',
      },
    };
  }
  const partes = input.mixto
    ? armarPartesPagoMixto({
        efectivo: input.montoEfectivo,
        tarjeta: input.montoTarjeta,
        transferencia: input.montoTransferencia,
      })
    : armarPartesPagoMixto({
        [input.metodoPago || 'efectivo']: input.monto,
      } as { efectivo?: number; tarjeta?: number; transferencia?: number });
  const valid = validarPagoContraSaldo(partes, input.saldo);
  const pagoErr = mensajePagoInvalido(valid);
  if (pagoErr) {
    return {
      ok: false,
      markCobroTouched: true,
      alert: { title: 'Monto', text: pagoErr, icon: 'warning' },
    };
  }
  if (input.incluyeEfectivo && !input.cambioEfectivoOk) {
    return {
      ok: false,
      alert: {
        title: 'Efectivo',
        text: input.cambioEfectivoError || 'El efectivo recibido no alcanza.',
        icon: 'warning',
      },
    };
  }
  return { ok: true, partes, montoPago: valid.total };
}

export function mensajeToastCobro(esParcial: boolean): PosToastExito {
  return {
    title: esParcial ? 'Pago parcial registrado' : 'Venta cobrada',
    text: esParcial ? 'Queda saldo. Puedes cobrar el resto después.' : 'Ticket en $0. Puedes enviarlo por WhatsApp.',
    timer: 2600,
  };
}

export function esPagoParcial(montoPago: number, saldoAntes: number): boolean {
  return montoPago < saldoAntes - 0.001;
}

export interface EstadoPostCobroInput {
  visitaId: string;
  folio: string;
  saldoAntes: number;
  montoPago: number;
  partes: PartePagoMixto[];
  pagadoAcc: number;
  incluyeEfectivo: boolean;
  recibidoEfectivo: number | null;
  montoEfectivoCobro: number;
  cambioEfectivo: number;
  telefonoCliente: string;
}

export interface EstadoPostCobro {
  esParcial: boolean;
  folioTicket: string;
  ultimoRecibido: number | null;
  ultimoCambio: number | null;
  pagado: number;
  resultadoCobro: { visitaId: string; cobrado: true; parcial: boolean };
  ultimoPago: { partes: PartePagoMixto[]; saldoPendiente: number };
  telefonoWhatsApp: string;
  soloLectura: boolean;
  deshabilitarForms: boolean;
  /** Si parcial: patch del cobroForm; si null, no patch (ticket cerrado). */
  patchCobroParcial: { monto: number; mixto: false } | null;
  pasoWizard: 3;
  cerrarSheet: true;
  toast: PosToastExito;
}

/** Estado UI tras cobro exitoso (spec 065: diálogo permanece abierto). */
export function construirEstadoPostCobro(input: EstadoPostCobroInput): EstadoPostCobro {
  const esParcial = esPagoParcial(input.montoPago, input.saldoAntes);
  const saldoPendiente = roundMoney(Math.max(0, input.saldoAntes - input.montoPago));
  return {
    esParcial,
    folioTicket: input.folio,
    ultimoRecibido: input.incluyeEfectivo
      ? input.recibidoEfectivo != null
        ? input.recibidoEfectivo
        : input.montoEfectivoCobro
      : null,
    ultimoCambio: input.incluyeEfectivo ? input.cambioEfectivo : null,
    pagado: input.pagadoAcc,
    resultadoCobro: { visitaId: input.visitaId, cobrado: true, parcial: esParcial },
    ultimoPago: { partes: input.partes, saldoPendiente },
    telefonoWhatsApp: input.telefonoCliente || '',
    soloLectura: !esParcial,
    deshabilitarForms: !esParcial,
    patchCobroParcial: esParcial ? { monto: saldoPendiente, mixto: false } : null,
    pasoWizard: 3,
    cerrarSheet: true,
    toast: mensajeToastCobro(esParcial),
  };
}

export interface CobroMovimientoPayload {
  tipo: 'ingreso';
  concepto: string;
  monto: number;
  metodoPago: CajaMetodoPago;
  ivaDeclarado: false;
  fecha: string;
  visitaId: string;
  clienteId?: string;
  categoria: CajaCategoria;
  movimientoInventarioIds?: string[];
}

export interface FlujoCobroDeps {
  persistir: () => Promise<string>;
  getVisita: (id: string) => Promise<Pick<Visita, 'cajaMovimientoIds' | 'pagado'> | null>;
  crearMovimiento: (data: CobroMovimientoPayload) => Promise<string>;
  actualizarVisita: (id: string, patch: { pagado: number; cajaMovimientoIds: string[] }) => Promise<void>;
  asignarFolioSiFalta: (id: string) => Promise<string>;
}

export interface FlujoCobroContexto {
  partes: PartePagoMixto[];
  montoPago: number;
  saldoAntes: number;
  lineas: ReadonlyArray<Pick<VisitaLinea, 'categoria' | 'movimientoInventarioId'>>;
  fecha: string;
  cliente: string;
  clienteId: string;
  modoMostrador: boolean;
}

export interface FlujoCobroResultado {
  visitaId: string;
  folio: string;
  pagadoAcc: number;
  partes: PartePagoMixto[];
  montoPago: number;
  saldoAntes: number;
}

/**
 * Orden canónico de cobro:
 * 1) persistir ticket (+ kit/stock vía persistir del diálogo)
 * 2) movimientos de caja por parte (mixto o simple)
 * 3) actualizar pagado + ids caja
 * 4) asignar folio si falta
 */
export async function ejecutarFlujoCobro(ctx: FlujoCobroContexto, deps: FlujoCobroDeps): Promise<FlujoCobroResultado> {
  const visitaId = await deps.persistir();
  const cat: VisitaLineaCategoria = ctx.lineas.length === 1 ? ctx.lineas[0].categoria : 'otro';
  const movIdsInv = ctx.lineas.map((l) => l.movimientoInventarioId).filter((id): id is string => !!id);
  const visita = await deps.getVisita(visitaId);
  if (!visita) {
    throw new Error('Visita no encontrada');
  }
  const ids = [...(visita.cajaMovimientoIds || [])];
  let pagadoAcc = visita.pagado || 0;
  const clienteIdCaja = ctx.modoMostrador || esClienteMostrador(ctx.clienteId) ? undefined : ctx.clienteId || undefined;
  const conceptoCliente = ctx.cliente || (ctx.modoMostrador ? 'Mostrador' : ctx.clienteId);
  for (const parte of ctx.partes) {
    const movId = await deps.crearMovimiento({
      tipo: 'ingreso',
      concepto: `Ticket ${ctx.fecha} · ${conceptoCliente}`,
      monto: parte.monto,
      metodoPago: parte.metodo,
      ivaDeclarado: false,
      fecha: ctx.fecha,
      visitaId,
      clienteId: clienteIdCaja,
      categoria: VISITA_LINEA_A_CAJA[cat] || 'otro',
      movimientoInventarioIds: movIdsInv.length ? movIdsInv : undefined,
    });
    if (!ids.includes(movId)) {
      ids.push(movId);
    }
    pagadoAcc = roundMoney(pagadoAcc + parte.monto);
  }
  await deps.actualizarVisita(visitaId, {
    pagado: pagadoAcc,
    cajaMovimientoIds: ids,
  });
  const folio = await deps.asignarFolioSiFalta(visitaId);
  return {
    visitaId,
    folio,
    pagadoAcc,
    partes: ctx.partes,
    montoPago: ctx.montoPago,
    saldoAntes: ctx.saldoAntes,
  };
}

/** Guardar sin cobrar: solo persistir y devolver id. */
export async function ejecutarFlujoGuardar(deps: { persistir: () => Promise<string> }): Promise<{ visitaId: string }> {
  const visitaId = await deps.persistir();
  return { visitaId };
}

export const CTX_ERROR_GUARDAR_VISITA = 'guardar visita';
export const CTX_ERROR_COBRAR_VISITA = 'cobrar visita';
