import {
  isActiveRecord,
  isVisibleInClientPortal,
  mapMascota
} from './portal-mapper.util';

describe('portal-mapper.util', () => {
  describe('isActiveRecord', () => {
    it('accepts active records', () => {
      expect(isActiveRecord({ activo: true })).toBeTrue();
    });

    it('rejects inactive records', () => {
      expect(isActiveRecord({ activo: false })).toBeFalse();
    });
  });

  describe('isVisibleInClientPortal', () => {
    it('hides oculto_portal records', () => {
      expect(isVisibleInClientPortal({ oculto_portal: true })).toBeFalse();
    });

    it('hides ocultoPortal records', () => {
      expect(isVisibleInClientPortal({ ocultoPortal: true })).toBeFalse();
    });

    it('shows normal records', () => {
      expect(isVisibleInClientPortal({ diagnostico: 'OK' })).toBeTrue();
    });
  });

  describe('mapMascota', () => {
    it('maps idCliente and activo', () => {
      const m = mapMascota('m1', {
        nombre: 'Oreon',
        especie: 'Felino',
        idCliente: 'c1',
        activo: true
      });
      expect(m.id).toBe('m1');
      expect(m.nombre).toBe('Oreon');
      expect(m.idCliente).toBe('c1');
      expect(m.activo).toBeTrue();
    });

    it('defaults activo to true', () => {
      expect(mapMascota('m1', { nombre: 'X' }).activo).toBeTrue();
    });
  });
});
