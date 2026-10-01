import {
  esPasoWizardValido,
  labelPasoWizard,
  POS_WIZARD_LABELS,
  resolverDestinoPaso,
  resolverPasoInicial,
} from './pos-wizard.util';

describe('pos-wizard.util (076)', () => {
  it('valida pasos 1–3', () => {
    expect(esPasoWizardValido(1)).toBe(true);
    expect(esPasoWizardValido(3)).toBe(true);
    expect(esPasoWizardValido(0)).toBe(false);
    expect(esPasoWizardValido(4)).toBe(false);
  });

  it('labels fijos del wizard', () => {
    expect(POS_WIZARD_LABELS[1]).toContain('Cliente');
    expect(labelPasoWizard(2)).toBe('Caja');
    expect(labelPasoWizard(99)).toBe('');
  });

  it('paso inicial: alta → 2; edición → 2; solo lectura → 3', () => {
    expect(resolverPasoInicial({ esEdicion: false, soloLectura: false })).toBe(2);
    expect(resolverPasoInicial({ esEdicion: true, soloLectura: false })).toBe(2);
    expect(resolverPasoInicial({ esEdicion: true, soloLectura: true })).toBe(3);
  });

  it('no avanza sin dueño/mostrador; marca touched', () => {
    expect(resolverDestinoPaso(2, false)).toEqual({ paso: 1, marcarTouched: true });
    expect(resolverDestinoPaso(3, false)).toEqual({ paso: 1, marcarTouched: true });
  });

  it('avanza si hay dueño o mostrador', () => {
    expect(resolverDestinoPaso(2, true)).toEqual({ paso: 2, marcarTouched: false });
    expect(resolverDestinoPaso(3, true)).toEqual({ paso: 3, marcarTouched: false });
  });

  it('fuera de rango → null', () => {
    expect(resolverDestinoPaso(0, true)).toBeNull();
    expect(resolverDestinoPaso(4, true)).toBeNull();
  });
});
