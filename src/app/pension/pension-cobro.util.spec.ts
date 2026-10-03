import { conceptoCajaPension, descripcionCobroPension } from './pension-cobro.util';

describe('pension-cobro.util (089 Fase 2)', () => {
  it('descripcionCobroPension incluye paquete y evita ambigüedad con baño', () => {
    const d = descripcionCobroPension({
      paciente: 'Oreon',
      tamano_mascota: 'mediano',
      precio_dia: 300,
    });
    expect(d).toContain('Pensión');
    expect(d).toContain('Mediano');
    expect(d).toContain('10.1–15 kg');
    expect(d).toContain('Oreon');
    expect(d.toLowerCase()).not.toContain('baño');
    expect(d.toLowerCase()).not.toContain('corte');
  });

  it('conceptoCajaPension es compacto con paquete', () => {
    const c = conceptoCajaPension({
      paciente: 'Luna',
      cliente: 'Ana',
      tamano_mascota: 'gigante',
    });
    expect(c).toBe('Pensión · Gigante · Luna · Ana');
  });

  it('fallback sin tamaño', () => {
    expect(descripcionCobroPension({ paciente: 'Firulais' })).toContain('hospedaje');
  });
});
