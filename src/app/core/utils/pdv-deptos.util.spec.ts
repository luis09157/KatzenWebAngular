import { nombreDepartamentoPdv } from './pdv-deptos.util';

describe('pdv-deptos.util', () => {
  it('resuelve IDs del FDB y respeta override', () => {
    expect(nombreDepartamentoPdv(13)).toBe('UsoInterno');
    expect(nombreDepartamentoPdv(5)).toBe('Petshop');
    expect(nombreDepartamentoPdv(8)).toBe('Paquetes');
    expect(nombreDepartamentoPdv(12, 'Farmacia custom')).toBe('Farmacia custom');
    expect(nombreDepartamentoPdv(null)).toBe('');
  });
});
