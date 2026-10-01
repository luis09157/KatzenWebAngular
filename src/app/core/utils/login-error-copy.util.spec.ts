import { mensajeErrorLoginPortal, mensajeErrorLoginStaff, mensajeEstadoLoginPortal } from './login-error-copy.util';

describe('login-error-copy.util (076)', () => {
  it('portal: wrong-password / user-not-found / too-many', () => {
    expect(mensajeErrorLoginPortal({ code: 'auth/wrong-password' })).toContain('Contraseña incorrecta');
    const msg = mensajeErrorLoginPortal({ code: 'auth/user-not-found' });
    expect(msg).toContain('No encontramos');
    expect(mensajeErrorLoginPortal({ code: 'auth/too-many-requests' })).toContain('Demasiados intentos');
    expect(mensajeErrorLoginPortal({ code: 'auth/invalid-credential' })).toContain('Contraseña incorrecta');
  });

  it('estado portal', () => {
    expect(mensajeEstadoLoginPortal('staff')).toContain('personal');
    expect(mensajeEstadoLoginPortal('inactive')).toContain('81 3602');
  });

  it('staff copy', () => {
    expect(mensajeErrorLoginStaff({ code: 'auth/wrong-password' })).toContain('Contraseña incorrecta');
    expect(mensajeErrorLoginStaff({ code: 'auth/user-not-found' })).toContain('No encontramos esa cuenta');
    expect(mensajeErrorLoginStaff({ code: 'auth/user-not-found' })).toContain('Soy cliente');
  });
});
