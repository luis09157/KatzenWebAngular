import {
  TARIFAS_BANIO_FALLBACK,
  TAMANOS_PERRO_ORDEN,
  costoBanioEfectivo,
  emptyDefaultsBanio,
  precioBanioEfectivo,
} from './defaults-banio.models';

describe('defaults-banio.models', () => {
  it('incluye XL en el orden de tamaños', () => {
    expect(TAMANOS_PERRO_ORDEN).toEqual(['pequeno', 'mediano', 'grande', 'xl']);
    expect(emptyDefaultsBanio().xl).toEqual({ costoDefault: 0 });
  });

  it('fallback XL es un escalón sobre grande', () => {
    expect(TARIFAS_BANIO_FALLBACK.xl.precioSugerido).toBeGreaterThan(TARIFAS_BANIO_FALLBACK.grande.precioSugerido);
    expect(precioBanioEfectivo('xl', 0)).toBe(550);
    expect(costoBanioEfectivo('xl', null)).toBe(160);
  });

  it('no pisa precio/costo > 0 guardado en Finanzas', () => {
    expect(precioBanioEfectivo('xl', 600)).toBe(600);
    expect(costoBanioEfectivo('grande', 99)).toBe(99);
  });
});
