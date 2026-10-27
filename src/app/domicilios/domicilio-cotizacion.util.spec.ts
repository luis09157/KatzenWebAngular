import {
  cotizarDomicilio,
  kmDesdeTexto,
  normalizarTarifasDomicilio,
  redondearPrecioDomicilio,
  tarifasDomicilioDefault,
} from './domicilio-cotizacion.util';

describe('domicilio-cotizacion.util', () => {
  const t = { ...tarifasDomicilioDefault(), redondeo: 'centavos' as const };
  const x2 = t.tipos.find((x) => x.id === 'ida_vuelta')!;
  const x4 = t.tipos.find((x) => x.id === 'llevar_traer')!;

  it('da lo mismo que la app con viajes reales (Semana X2 3 km, Semana X4 2.5 km)', () => {
    const a = cotizarDomicilio(3, x2, t);
    expect(a.costoGasolina).toBe(14.7);
    expect(a.precioSugerido).toBe(24.4);
    const b = cotizarDomicilio(2.5, x4, t);
    expect(b.costoGasolina).toBe(24.5);
    expect(b.precioSugerido).toBe(40.66);
    expect(b.gananciaSugerida).toBe(16.16);
  });

  it('redondeo al peso y a $5', () => {
    expect(redondearPrecioDomicilio(24.4, 'peso')).toBe(25);
    expect(redondearPrecioDomicilio(25, 'peso')).toBe(25);
    expect(redondearPrecioDomicilio(40.66, 'cinco')).toBe(45);
    expect(redondearPrecioDomicilio(40, 'cinco')).toBe(40);
  });

  it('sin km no sugiere precio', () => {
    expect(cotizarDomicilio(0, x2, t).precioSugerido).toBe(0);
  });

  it('normaliza lo guardado (mapa de tipos, strings, faltantes)', () => {
    const n = normalizarTarifasDomicilio({
      precioLitro: '26.1',
      tipos: { moto: { nombre: 'Moto', recorridos: '2', margenPct: 50, orden: 2 }, a: { nombre: 'A', orden: 1 } },
    });
    expect(n.precioLitro).toBe(26.1);
    expect(n.kmPorLitro).toBe(10);
    expect(n.redondeo).toBe('peso');
    expect(n.tipos.map((x) => x.id)).toEqual(['a', 'moto']);
    expect(n.tipos[1].margenPct).toBe(50);
    expect(normalizarTarifasDomicilio(null).tipos.length).toBe(5);
  });

  it('lee km escritos de varias formas', () => {
    expect(kmDesdeTexto('2,9 km')).toBe(2.9);
    expect(kmDesdeTexto(0.65)).toBe(0.65);
    expect(kmDesdeTexto('')).toBe(0);
  });
});
