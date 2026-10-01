/**
 * Wizard POS (3 pasos) — estado/labels/navegación pura (spec 065 / 076).
 * Extraído de `visita-dialog` sin cambiar semántica.
 */

/** Paso 1 = dueño/mascota · 2 = caja/catálogo · 3 = cobro */
export type PosWizardPaso = 1 | 2 | 3;

export const POS_WIZARD_PASO_MIN = 1 as const;
export const POS_WIZARD_PASO_MAX = 3 as const;

export const POS_WIZARD_LABELS: Record<PosWizardPaso, string> = {
  1: 'Cliente / mascota',
  2: 'Caja',
  3: 'Cobrar',
};

export function esPasoWizardValido(paso: number): paso is PosWizardPaso {
  return paso === 1 || paso === 2 || paso === 3;
}

/** Paso inicial al abrir el diálogo (edición / solo lectura / alta). */
export function resolverPasoInicial(opts: { esEdicion: boolean; soloLectura: boolean }): PosWizardPaso {
  if (opts.esEdicion) {
    return opts.soloLectura ? 3 : 2;
  }
  return 2;
}

/**
 * Resuelve a qué paso ir. Si se intenta pasar de 1 sin dueño/mostrador → se queda en 1.
 * Pasos fuera de rango → null (no cambiar).
 */
export function resolverDestinoPaso(
  paso: number,
  tieneDuenoOMostrador: boolean
): { paso: PosWizardPaso; marcarTouched: boolean } | null {
  if (!esPasoWizardValido(paso)) return null;
  if (paso > 1 && !tieneDuenoOMostrador) {
    return { paso: 1, marcarTouched: true };
  }
  return { paso, marcarTouched: false };
}

export function labelPasoWizard(paso: number): string {
  if (!esPasoWizardValido(paso)) return '';
  return POS_WIZARD_LABELS[paso];
}
