import { mensajeErrorLoginPortal, mensajeErrorLoginStaff, mensajeEstadoLoginPortal } from './portal-login-error.util';

describe('portal-login-error.util', () => {
  it('mapea wrong-password a un mensaje de contraseña', () => {
    expect(mensajeErrorLoginPortal({ code: 'auth/wrong-password' })).toContain('Contraseña incorrecta');
  });

  it('mapea user-not-found sin jerga Firebase', () => {
    const msg = mensajeErrorLoginPortal({ code: 'auth/user-not-found' });
    expect(msg.toLowerCase()).not.toContain('firebase');
    expect(msg.toLowerCase()).not.toContain('auth/');
    expect(msg).toContain('cuenta');
  });

  it('mapea too-many-requests', () => {
    expect(mensajeErrorLoginPortal({ code: 'auth/too-many-requests' })).toContain('Demasiados intentos');
  });

  it('invalid-credential se trata como contraseña', () => {
    expect(mensajeErrorLoginPortal({ code: 'auth/invalid-credential' })).toContain('Contraseña incorrecta');
  });

  it('estados de perfil son humanos', () => {
    expect(mensajeEstadoLoginPortal('inactive')).toContain('81 3602 4090');
    expect(mensajeEstadoLoginPortal('staff')).toContain('personal');
    expect(mensajeEstadoLoginPortal('none')).toContain('perfil');
  });

  it('staff: wrong-password distinto de cuenta no encontrada', () => {
    expect(mensajeErrorLoginStaff({ code: 'auth/wrong-password' })).toContain('Contraseña incorrecta');
    expect(mensajeErrorLoginStaff({ code: 'auth/user-not-found' })).toContain('No encontramos esa cuenta');
    expect(mensajeErrorLoginStaff({ code: 'auth/user-not-found' })).toContain('Soy cliente');
  });
});
