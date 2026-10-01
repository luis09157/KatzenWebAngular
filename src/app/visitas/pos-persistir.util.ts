/**
 * Persistencia de ticket POS + salidas inventario/kits (spec 080).
 * Casi puro: I/O vía deps. Sin cambiar negocio (mostrador, BOM, stock, demo).
 */
import { Producto } from '../shared/inventario.models';
import { productoDescuentaInventarioPos } from '../core/utils/producto-search.util';
import { esIdProductoDemoPos, esProductoDemoPos, lineasSinProductosDemo } from './pos-catalogo-demo.util';
import { MENSAJE_KIT_SIN_BOM, productoEsKit, resolverVentaKit } from './pos-kit-bom.util';
import { CLIENTE_MOSTRADOR_ID, CLIENTE_MOSTRADOR_NOMBRE, esClienteMostrador } from './visita-mostrador.util';
import { Visita, VisitaFormData, VisitaLinea, VISITA_ESTADO_LABELS } from './visitas.models';
import { hoyLocalIsoDate } from './visitas.util';

export interface PersistirFormRaw {
  cliente_id?: string | null;
  cliente?: string | null;
  paciente_id?: string | null;
  paciente?: string | null;
  fecha?: string | null;
  notas?: string | null;
  atendidoPorUid?: string | null;
  atendidoPorNombre?: string | null;
}

export interface PersistirVisitaContexto {
  soloLectura: boolean;
  modoMostrador: boolean;
  visitaId: string | null | undefined;
  lineas: VisitaLinea[];
  productosCatalogo: Producto[];
  form: PersistirFormRaw;
  pagado: number;
}

/** Resumen mínimo del ticket abierto del día (confirmación Swal). */
export interface TicketAbiertoResumen {
  id?: string;
  cliente?: string;
  fecha: string;
  saldo: number;
  pagado?: number;
  estado: string;
  lineas?: VisitaLinea[];
}

export type RegistrarSalidaFn = (
  productoId: string,
  cantidad: number,
  motivo: string,
  pacienteId: string,
  historialId: string,
  ventaId: string,
  observaciones: string,
  visitaId: string
) => Promise<string>;

export interface PersistirVisitaDeps {
  buscarVisitaAbiertaDelDia: (clienteId: string, fecha: string) => Promise<TicketAbiertoResumen | null>;
  confirmarUsarTicketExistente: (existente: TicketAbiertoResumen, clienteNombre: string) => Promise<boolean>;
  actualizarVisita: (id: string, patch: Partial<Visita> & { lineas: VisitaLinea[] }) => Promise<void>;
  crearVisita: (data: VisitaFormData) => Promise<string>;
  vincularOrigenesDesdeLineas: (visitaId: string, lineas: VisitaLinea[]) => Promise<void>;
  registrarSalida: RegistrarSalidaFn;
}

export interface PersistirVisitaResultado {
  visitaId: string;
  lineas: VisitaLinea[];
  esEdicion: true;
  pagado: number;
  estadoLabel?: string;
  adoptadoTicketExistente: boolean;
}

export interface ClientePersistirResuelto {
  esMostrador: boolean;
  clienteId: string;
  clienteNombre: string;
}

/** Resuelve cliente mostrador vs dueño real (mismas reglas que el diálogo). */
export function resolverClientePersistir(
  modoMostrador: boolean,
  clienteIdRaw: string | null | undefined,
  clienteNombreRaw: string | null | undefined
): ClientePersistirResuelto {
  const esMostrador = modoMostrador || esClienteMostrador(clienteIdRaw);
  return {
    esMostrador,
    clienteId: esMostrador ? CLIENTE_MOSTRADOR_ID : String(clienteIdRaw || '').trim(),
    clienteNombre: esMostrador ? CLIENTE_MOSTRADOR_NOMBRE : String(clienteNombreRaw || '').trim(),
  };
}

/**
 * Registra salidas de inventario para líneas `venta_producto` sin movimiento.
 * Kits: N salidas de componentes vía `resolverVentaKit` (no inventa BOM).
 * Demo POS: se omiten.
 */
export async function asegurarSalidasProducto(
  lineas: VisitaLinea[],
  pacienteId: string,
  opts: { productosCatalogo: Producto[]; visitaId: string },
  deps: { registrarSalida: RegistrarSalidaFn }
): Promise<VisitaLinea[]> {
  const out: VisitaLinea[] = [];
  for (const linea of lineas) {
    if (linea.categoria === 'venta_producto' && linea.productoId && !linea.movimientoInventarioId) {
      if (
        esIdProductoDemoPos(linea.productoId) ||
        esProductoDemoPos(opts.productosCatalogo.find((p) => p.id === linea.productoId))
      ) {
        continue;
      }
      const qty = Math.max(1, Number(linea.cantidad) || 1);
      const prod = opts.productosCatalogo.find((p) => p.id === linea.productoId);
      if (!productoDescuentaInventarioPos(prod)) {
        out.push({ ...linea, cantidad: qty });
        continue;
      }
      if (productoEsKit(prod)) {
        const kit = resolverVentaKit(prod!, qty, opts.productosCatalogo, {});
        if (!kit.ok) {
          throw new Error(kit.mensaje || MENSAJE_KIT_SIN_BOM);
        }
        let firstId = '';
        for (const s of kit.salidas) {
          const movId = await deps.registrarSalida(
            s.productoId,
            s.cantidad,
            'venta_directa',
            pacienteId || '',
            '',
            '',
            `Ticket visita · kit ${prod!.nombre} · ${s.nombre} × ${s.cantidad}`,
            opts.visitaId || ''
          );
          if (!firstId) firstId = movId;
        }
        out.push({ ...linea, cantidad: qty, movimientoInventarioId: firstId });
      } else {
        const movId = await deps.registrarSalida(
          linea.productoId,
          qty,
          'venta_directa',
          pacienteId || '',
          '',
          '',
          `Ticket visita · ${linea.descripcion}`,
          opts.visitaId || ''
        );
        out.push({ ...linea, cantidad: qty, movimientoInventarioId: movId });
      }
    } else {
      out.push(linea);
    }
  }
  return out;
}

function patchVisitaDesdeForm(
  cliente: ClientePersistirResuelto,
  form: PersistirFormRaw,
  lineas: VisitaLinea[]
): VisitaFormData & { lineas: VisitaLinea[] } {
  return {
    cliente_id: cliente.clienteId,
    cliente: cliente.clienteNombre,
    paciente_id: cliente.esMostrador ? undefined : form.paciente_id || undefined,
    paciente: cliente.esMostrador ? '' : form.paciente || '',
    fecha: String(form.fecha || ''),
    notas: form.notas || '',
    atendidoPorUid: form.atendidoPorUid || undefined,
    atendidoPorNombre: form.atendidoPorNombre || undefined,
    esMostrador: cliente.esMostrador || undefined,
    lineas,
  };
}

/**
 * Orden canónico de persistir ticket:
 * 1) validar lectura / cliente / fecha
 * 2) opcional: adoptar ticket abierto del día (no mostrador)
 * 3) filtrar demo → salidas inventario/kits
 * 4) actualizar o crear visita (+ vincular orígenes si hay movimientos)
 */
export async function ejecutarPersistirVisita(
  ctx: PersistirVisitaContexto,
  deps: PersistirVisitaDeps
): Promise<PersistirVisitaResultado> {
  if (ctx.soloLectura) {
    throw new Error('El ticket está cerrado o cancelado.');
  }
  const cliente = resolverClientePersistir(ctx.modoMostrador, ctx.form.cliente_id, ctx.form.cliente);
  if (!cliente.esMostrador && !cliente.clienteId) {
    throw new Error('Elige el dueño, o activa venta de mostrador para vender sin cliente.');
  }
  if (!String(ctx.form.fecha || '').trim()) {
    throw new Error('La fecha es obligatoria.');
  }

  let visitaId = ctx.visitaId || '';
  let lineas = [...ctx.lineas];
  let pagado = ctx.pagado;
  let estadoLabel: string | undefined;
  let adoptadoTicketExistente = false;

  if (!visitaId && !cliente.esMostrador) {
    const existente = await deps.buscarVisitaAbiertaDelDia(cliente.clienteId, ctx.form.fecha || hoyLocalIsoDate());
    if (existente?.id) {
      const usar = await deps.confirmarUsarTicketExistente(existente, cliente.clienteNombre);
      if (usar) {
        visitaId = existente.id;
        adoptadoTicketExistente = true;
        lineas = [...(existente.lineas || []), ...lineas];
        pagado = Number(existente.pagado) || 0;
        estadoLabel = VISITA_ESTADO_LABELS[existente.estado as keyof typeof VISITA_ESTADO_LABELS] || existente.estado;
      }
    }
  }

  const persistibles = lineasSinProductosDemo(lineas, ctx.productosCatalogo);
  if (!persistibles.length) {
    throw new Error('El catálogo de muestra no se cobra ni se guarda. Agrega productos reales del inventario.');
  }
  lineas = await asegurarSalidasProducto(
    persistibles,
    String(ctx.form.paciente_id || ''),
    { productosCatalogo: ctx.productosCatalogo, visitaId },
    { registrarSalida: deps.registrarSalida }
  );

  const patch = patchVisitaDesdeForm(cliente, ctx.form, lineas);

  if (visitaId) {
    await deps.actualizarVisita(visitaId, patch);
    return {
      visitaId,
      lineas,
      esEdicion: true,
      pagado,
      estadoLabel,
      adoptadoTicketExistente,
    };
  }

  const id = await deps.crearVisita(patch);
  for (const l of lineas) {
    if (l.movimientoInventarioId) {
      await deps.vincularOrigenesDesdeLineas(id, [l]);
    }
  }
  return {
    visitaId: id,
    lineas,
    esEdicion: true,
    pagado,
    estadoLabel,
    adoptadoTicketExistente: false,
  };
}
