import { precioAnteriorBanio } from './banio-precio-anterior.util';

describe('precioAnteriorBanio (2026-10-26)', () => {
  const banios = [
    { id: 'a', tipo_servicio: 'baño', precio_total: 300, fecha_banio: '2026-10-19' },
    { id: 'b', tipo_servicio: 'baño_con_corte', precio_total: 450, fecha_banio: '2026-10-24' },
    { id: 'c', tipo_servicio: 'baño', precio_total: 0, fecha_banio: '2026-10-25' },
    { id: 'd', tipo_servicio: 'baño', precio_total: 999, fecha_banio: '2026-10-26', estado: 'cancelado' },
    { id: 'e', tipo_servicio: 'baño', precio_total: 280, fecha_banio: '2026-09-01' },
  ];

  it('prefiere el último del mismo servicio con precio', () => {
    expect(precioAnteriorBanio(banios, { tipoServicio: 'baño' })).toEqual({
      precio: 300,
      fechaIso: '2026-10-19',
      tipoServicio: 'baño',
      mismoServicio: true,
    });
  });

  it('si no hay del mismo servicio, el último con precio', () => {
    const r = precioAnteriorBanio(banios, { tipoServicio: 'corte_uñas' });
    expect(r?.precio).toBe(450);
    expect(r?.mismoServicio).toBeFalse();
  });

  it('sin baños con precio → null; excluye el que se está editando', () => {
    expect(precioAnteriorBanio([{ precio_total: 0 }])).toBeNull();
    expect(precioAnteriorBanio(banios, { tipoServicio: 'baño_con_corte', excluirId: 'b' })?.precio).toBe(300);
  });
});
