import {
  CLIENTE_MOSTRADOR_ID,
  CLIENTE_MOSTRADOR_NOMBRE,
  esClienteMostrador,
  esVisitaMostrador
} from './visita-mostrador.util';

describe('visita-mostrador.util', () => {
  it('detecta id sentinel', () => {
    expect(esClienteMostrador(CLIENTE_MOSTRADOR_ID)).toBe(true);
    expect(esClienteMostrador('cli-1')).toBe(false);
    expect(esClienteMostrador('')).toBe(false);
  });

  it('detecta visita por flag o id', () => {
    expect(esVisitaMostrador({ esMostrador: true, cliente_id: '' })).toBe(true);
    expect(esVisitaMostrador({ cliente_id: CLIENTE_MOSTRADOR_ID })).toBe(true);
    expect(esVisitaMostrador({ cliente_id: 'c1' })).toBe(false);
  });

  it('nombre canónico', () => {
    expect(CLIENTE_MOSTRADOR_NOMBRE).toContain('Mostrador');
  });
});
