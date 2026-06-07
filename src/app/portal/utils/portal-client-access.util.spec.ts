import {
  isPortalClienteActive,
  mascotaPerteneceACliente
} from './portal-client-access.util';

describe('portal-client-access.util', () => {
  describe('isPortalClienteActive', () => {
    it('returns true when portal is active', () => {
      expect(isPortalClienteActive({
        portalActivo: true,
        activo: true,
        authUid: 'uid-1'
      })).toBeTrue();
    });

    it('returns false when portalActivo is false', () => {
      expect(isPortalClienteActive({
        portalActivo: false,
        activo: true,
        authUid: 'uid-1'
      })).toBeFalse();
    });

    it('returns false when cliente is inactive', () => {
      expect(isPortalClienteActive({
        portalActivo: true,
        activo: false,
        authUid: 'uid-1'
      })).toBeFalse();
    });

    it('returns false when authUid is missing', () => {
      expect(isPortalClienteActive({
        portalActivo: true,
        activo: true
      })).toBeFalse();
    });

    it('returns false for null', () => {
      expect(isPortalClienteActive(null)).toBeFalse();
    });
  });

  describe('mascotaPerteneceACliente', () => {
    it('matches same cliente id', () => {
      expect(mascotaPerteneceACliente({ idCliente: 'abc' }, 'abc')).toBeTrue();
    });

    it('matches cliente_id field', () => {
      expect(mascotaPerteneceACliente({ cliente_id: 'abc' }, 'abc')).toBeTrue();
    });

    it('rejects different cliente id', () => {
      expect(mascotaPerteneceACliente({ idCliente: 'abc' }, 'xyz')).toBeFalse();
    });

    it('rejects missing mascota', () => {
      expect(mascotaPerteneceACliente(null, 'abc')).toBeFalse();
    });
  });
});
