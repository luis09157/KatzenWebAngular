/**
 * Lógica pura de stock / mermas (decisión de negocio #12).
 * Probable con mocks locales — sin Firebase.
 */

import { TipoMovimiento } from '../shared/inventario.models';

export interface CalculoStockOk {
  ok: true;
  nuevoStock: number;
}

export interface CalculoStockError {
  ok: false;
  error: string;
}

export type CalculoStockResult = CalculoStockOk | CalculoStockError;

/** Tipos que restan unidades del stock actual. */
const TIPOS_DECREMENTO: ReadonlySet<TipoMovimiento> = new Set([
  'salida',
  'merma',
  'transferencia'
]);

/**
 * Calcula el nuevo stock tras un movimiento.
 * Bloquea stock negativo en salida, merma y transferencia (igual criterio).
 * Ajuste: `cantidad` es el stock físico objetivo (≥ 0).
 */
export function calcularNuevoStock(
  tipo: TipoMovimiento,
  stockActual: number | null | undefined,
  cantidad: number
): CalculoStockResult {
  const cantidadAnterior = Number(stockActual ?? 0);
  if (!Number.isFinite(cantidadAnterior)) {
    return { ok: false, error: 'Stock actual inválido' };
  }
  if (!Number.isFinite(cantidad) || cantidad < 0) {
    return { ok: false, error: 'La cantidad debe ser un número mayor o igual a cero' };
  }

  let nuevoStock = cantidadAnterior;

  switch (tipo) {
    case 'entrada':
    case 'devolucion':
      nuevoStock = cantidadAnterior + cantidad;
      break;
    case 'salida':
    case 'merma':
    case 'transferencia':
      if (cantidadAnterior < cantidad) {
        return {
          ok: false,
          error: `Stock insuficiente. Disponible: ${cantidadAnterior}, Solicitado: ${cantidad}`
        };
      }
      nuevoStock = cantidadAnterior - cantidad;
      break;
    case 'ajuste':
      nuevoStock = cantidad;
      break;
    default:
      return { ok: false, error: `Tipo de movimiento no soportado: ${tipo}` };
  }

  if (nuevoStock < 0) {
    return {
      ok: false,
      error: 'La operación dejaría el stock en negativo. No se permite stock negativo.'
    };
  }

  return { ok: true, nuevoStock };
}

/**
 * Motivo obligatorio para merma (y recomendado para salida/ajuste).
 * Devuelve mensaje de error o null si es válido.
 */
export function validarMotivoMovimiento(
  tipo: TipoMovimiento,
  motivo: string | null | undefined
): string | null {
  const trimmed = (motivo ?? '').trim();
  if (tipo === 'merma' && !trimmed) {
    return 'El motivo es obligatorio para registrar la merma';
  }
  if ((tipo === 'salida' || tipo === 'ajuste') && !trimmed) {
    return 'El motivo es obligatorio para esta operación';
  }
  return null;
}

export function esTipoDecremento(tipo: TipoMovimiento): boolean {
  return TIPOS_DECREMENTO.has(tipo);
}
