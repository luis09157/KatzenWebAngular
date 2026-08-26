import {
  calcularNuevoStock,
  esTipoDecremento,
  validarMotivoMovimiento
} from './inventario-stock.util';

describe('inventario-stock.util', () => {
  describe('calcularNuevoStock', () => {
    it('entrada suma stock', () => {
      const r = calcularNuevoStock('entrada', 10, 5);
      expect(r).toEqual({ ok: true, nuevoStock: 15 });
    });

    it('salida con stock suficiente resta', () => {
      const r = calcularNuevoStock('salida', 10, 3);
      expect(r).toEqual({ ok: true, nuevoStock: 7 });
    });

    it('salida con stock insuficiente falla', () => {
      const r = calcularNuevoStock('salida', 2, 5);
      expect(r.ok).toBe(false);
      if (r.ok === false) {
        expect(r.error).toContain('Stock insuficiente');
        expect(r.error).toContain('Disponible: 2');
        expect(r.error).toContain('Solicitado: 5');
      }
    });

    it('merma con stock suficiente resta (SC-001)', () => {
      const r = calcularNuevoStock('merma', 8, 3);
      expect(r).toEqual({ ok: true, nuevoStock: 5 });
    });

    it('merma con stock insuficiente falla igual que salida (SC-001)', () => {
      const r = calcularNuevoStock('merma', 1, 4);
      expect(r.ok).toBe(false);
      if (r.ok === false) {
        expect(r.error).toContain('Stock insuficiente');
      }
    });

    it('merma que vacía stock a cero es válida', () => {
      const r = calcularNuevoStock('merma', 5, 5);
      expect(r).toEqual({ ok: true, nuevoStock: 0 });
    });

    it('ajuste a cero es válido; ajuste negativo no (SC-003)', () => {
      expect(calcularNuevoStock('ajuste', 10, 0)).toEqual({ ok: true, nuevoStock: 0 });
      const neg = calcularNuevoStock('ajuste', 10, -1);
      expect(neg.ok).toBe(false);
    });

    it('stock null se trata como 0', () => {
      const r = calcularNuevoStock('merma', null, 1);
      expect(r.ok).toBe(false);
    });
  });

  describe('validarMotivoMovimiento', () => {
    it('merma sin motivo falla (SC-004/SC-006)', () => {
      expect(validarMotivoMovimiento('merma', '')).toContain('motivo es obligatorio');
      expect(validarMotivoMovimiento('merma', '   ')).toContain('motivo es obligatorio');
      expect(validarMotivoMovimiento('merma', null)).toContain('motivo es obligatorio');
    });

    it('merma con motivo pasa', () => {
      expect(validarMotivoMovimiento('merma', 'Caducado lote X')).toBeNull();
    });

    it('entrada no exige motivo en util', () => {
      expect(validarMotivoMovimiento('entrada', '')).toBeNull();
    });
  });

  describe('esTipoDecremento', () => {
    it('marca salida y merma', () => {
      expect(esTipoDecremento('salida')).toBe(true);
      expect(esTipoDecremento('merma')).toBe(true);
      expect(esTipoDecremento('entrada')).toBe(false);
    });
  });
});
