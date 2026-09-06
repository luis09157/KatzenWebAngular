import { accessFromAuthClaims } from './auth-claims-access.util';

describe('accessFromAuthClaims', () => {
  it('detecta dual por dualAccess + clienteId', () => {
    const access = accessFromAuthClaims({
      dualAccess: true,
      clienteId: 'cli-1',
      role: 'staff',
    });
    expect(access.staffAccess).toBeTrue();
    expect(access.clientAccess).toBeTrue();
    expect(access.clienteId).toBe('cli-1');
  });

  it('detecta dual por role dual', () => {
    const access = accessFromAuthClaims({ role: 'dual', clienteId: 'cli-2' });
    expect(access.staffAccess).toBeTrue();
    expect(access.clientAccess).toBeTrue();
  });

  it('solo client', () => {
    const access = accessFromAuthClaims({ role: 'client', clienteId: 'cli-3' });
    expect(access.staffAccess).toBeFalse();
    expect(access.clientAccess).toBeTrue();
  });

  it('sin claims no da acceso', () => {
    expect(accessFromAuthClaims(null).staffAccess).toBeFalse();
    expect(accessFromAuthClaims({}).clientAccess).toBeFalse();
  });
});
