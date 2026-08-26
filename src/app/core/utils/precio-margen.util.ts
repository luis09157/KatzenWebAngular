import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { CategoriaProducto } from '../../shared/inventario.models';

/** Tasa general IVA México (preview interno; no es CFDI). */
export const TASA_IVA_GENERAL_MX = 16;

export const MENSAJE_COSTO_MAYOR_O_IGUAL_VENTA =
  'El costo debe ser menor que el precio de venta. Si el costo es igual o mayor a la venta, no hay ganancia.';

export interface SugerenciaIvaProducto {
  iva_aplicable: boolean;
  tasa_iva: number;
  motivo: string;
}

/**
 * Regla global: precio de venta debe ser **estrictamente mayor** que el costo
 * (margen positivo). Si `allowEmptyCosto` y costo vacío → OK (campo opcional).
 */
export function esVentaMayorQueCosto(
  costo: unknown,
  precioVenta: unknown,
  options: { allowEmptyCosto?: boolean; treatZeroAsEmpty?: boolean } = { allowEmptyCosto: true }
): boolean {
  const allowEmpty = options.allowEmptyCosto !== false;
  if (allowEmpty && (costo === null || costo === undefined || costo === '')) {
    return true;
  }
  if (options.treatZeroAsEmpty && Number(costo) === 0) {
    return true;
  }
  const c = Number(costo);
  const v = Number(precioVenta);
  if (Number.isNaN(c) || Number.isNaN(v)) {
    return true;
  }
  return v > c;
}

/** Alias semántico (baños / legacy). */
export function esCostoEstrictamenteMenorQueVenta(
  costo: unknown,
  precioVenta: unknown
): boolean {
  return esVentaMayorQueCosto(costo, precioVenta, { allowEmptyCosto: true });
}

/**
 * Validator en el control de **costo**: lee el control de venta del padre.
 * Error key: `costoMayorOIgualVenta`.
 */
export function costoMenorQueVentaValidator(
  ventaControlName = 'precio_total',
  options: { allowEmptyCosto?: boolean; treatZeroAsEmpty?: boolean } = { allowEmptyCosto: true }
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;
    if (!parent) {
      return null;
    }
    const precioVenta = parent.get(ventaControlName)?.value;
    if (
      esVentaMayorQueCosto(control.value, precioVenta, {
        allowEmptyCosto: options.allowEmptyCosto !== false,
        treatZeroAsEmpty: options.treatZeroAsEmpty === true
      })
    ) {
      return null;
    }
    return { costoMayorOIgualVenta: true };
  };
}

/**
 * Validator en el control de **venta**: lee el control de costo del padre.
 * Útil cuando ambos campos son requeridos (productos).
 */
export function ventaMayorQueCostoValidator(
  costoControlName: string,
  options: { allowEmptyCosto?: boolean } = { allowEmptyCosto: false }
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;
    if (!parent) {
      return null;
    }
    const costo = parent.get(costoControlName)?.value;
    if (
      esVentaMayorQueCosto(costo, control.value, {
        allowEmptyCosto: options.allowEmptyCosto === true
      })
    ) {
      return null;
    }
    return { costoMayorOIgualVenta: true };
  };
}

/** Margen % sobre costo: ((venta − costo) / costo) × 100. */
export function calcularMargenPorcentaje(costo: unknown, venta: unknown): number {
  const c = Number(costo);
  const v = Number(venta);
  if (!c || c <= 0 || Number.isNaN(c) || Number.isNaN(v)) {
    return 0;
  }
  return ((v - c) / c) * 100;
}

/** Venta = costo × (1 + margen%/100). */
export function calcularVentaDesdeMargen(costo: unknown, margenPct: unknown): number | null {
  const c = Number(costo);
  const m = Number(margenPct);
  if (Number.isNaN(c) || c < 0 || Number.isNaN(m)) {
    return null;
  }
  return Math.round(c * (1 + m / 100) * 100) / 100;
}

/**
 * Defaults IVA por categoría (México, control interno — no CFDI).
 * Medicamentos / quirúrgico / diagnóstico → tasa 0 sugerida (staff confirma).
 * Alimento / accesorio / peluquería → 16% sugerido.
 */
export function sugerirIvaPorCategoria(categoria: CategoriaProducto | string | null | undefined): SugerenciaIvaProducto {
  const cat = String(categoria || '').toLowerCase();
  if (cat === 'medicamento' || cat === 'quirurgico' || cat === 'diagnostico') {
    return {
      iva_aplicable: false,
      tasa_iva: 0,
      motivo:
        'En México muchos medicamentos (humanos/veterinarios) van exentos o tasa 0%. El staff debe confirmar.'
    };
  }
  return {
    iva_aplicable: true,
    tasa_iva: TASA_IVA_GENERAL_MX,
    motivo: 'Alimentos, accesorios y similares suelen gravar IVA 16%. Staff confirma.'
  };
}

/** Precio con IVA (preview). Si no aplica o tasa 0 → mismo neto. */
export function precioConIva(
  precioNeto: unknown,
  ivaAplicable: boolean,
  tasaIva: unknown = TASA_IVA_GENERAL_MX
): number {
  const neto = Number(precioNeto) || 0;
  if (!ivaAplicable) {
    return Math.round(neto * 100) / 100;
  }
  const tasa = Number(tasaIva);
  const t = Number.isNaN(tasa) || tasa < 0 ? TASA_IVA_GENERAL_MX : tasa;
  return Math.round(neto * (1 + t / 100) * 100) / 100;
}

export function resolverTasaIva(
  ivaAplicable: boolean,
  tasaIva: unknown
): number {
  if (!ivaAplicable) {
    return 0;
  }
  const t = Number(tasaIva);
  if (Number.isNaN(t) || t < 0) {
    return TASA_IVA_GENERAL_MX;
  }
  return t;
}
