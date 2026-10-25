import { resolveAccessFromSources } from './auth-profile.service';
import { rtdbUnavailableError, isRtdbUnavailableError } from '../utils/rtdb-read-timeout.util';

describe('resolveAccessFromSources', () => {
  const sinClaims = { staffAccess: false, clientAccess: false };

  it('sin socket y sin claims avisa que el servidor no respondió', () => {
    expect(() => resolveAccessFromSources(null, sinClaims, true)).toThrow();
    try {
      resolveAccessFromSources(null, sinClaims, true);
    } catch (error) {
      expect(isRtdbUnavailableError(error)).toBeTrue();
    }
  });

  it('sin socket pero con claim staff deja entrar', () => {
    const access = resolveAccessFromSources(
      null,
      { staffAccess: true, clientAccess: false, staffRole: 'doctor' },
      true
    );
    expect(access.staffAccess).toBeTrue();
    expect(access.staffRole).toBe('doctor');
  });

  it('perfil staff leído no lanza', () => {
    const access = resolveAccessFromSources(
      { role: 'staff', activo: true, staffRole: 'recepcionista' },
      sinClaims,
      false
    );
    expect(access.staffAccess).toBeTrue();
    expect(access.staffRole).toBe('recepcionista');
  });

  it('perfil inactivo no usa el error de timeout', () => {
    const access = resolveAccessFromSources(
      { role: 'staff', activo: false },
      { staffAccess: true, clientAccess: false },
      true
    );
    expect(access.staffAccess).toBeFalse();
    expect(access.clientAccess).toBeFalse();
  });
});

describe('rtdbUnavailableError', () => {
  it('expone el código que lee el copy de login', () => {
    expect(rtdbUnavailableError().code).toBe('rtdb-unavailable');
  });
});
