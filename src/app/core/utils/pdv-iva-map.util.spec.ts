import {
  FACTOR_IVA_PDV,
  mapearPreciosPdvAKatzen,
  precioEleventaSinIva,
  reporteImpactoIvaCliente,
  roundMoney2
} from './pdv-iva-map.util';

describe('pdv-iva-map.util', () => {
  it('100 → 116 (caso canónico Luis)', () => {
    const m = mapearPreciosPdvAKatzen({ pfinal: 100, pcosto: 50 });
    expect(m.precio_venta).toBe(116);
    expect(m.precio_neto).toBe(100);
    expect(m.iva_trasladado).toBe(16);
    expect(m.precio_compra).toBe(50);
    expect(m.ganancia).toBe(50);
    expect(m.precio_eleventa_sin_iva).toBe(100);
    expect(m.delta_precio_cliente).toBe(16);
    expect(m.iva_aplicable).toBe(true);
    expect(m.tasa_iva).toBe(16);
  });

  it('usa PVENTA si PFINAL falta', () => {
    const m = mapearPreciosPdvAKatzen({ pventa: 100, pcosto: 40 });
    expect(m.precio_venta).toBe(116);
    expect(m.precio_eleventa_sin_iva).toBe(100);
  });

  it('prefiere PFINAL sobre PVENTA', () => {
    const m = mapearPreciosPdvAKatzen({ pfinal: 200, pventa: 100 });
    expect(m.precio_eleventa_sin_iva).toBe(200);
    expect(m.precio_venta).toBe(232);
  });

  it('redondea a 2 decimales (33.33 * 1.16)', () => {
    const m = mapearPreciosPdvAKatzen({ pfinal: 33.33, pcosto: 10 });
    expect(m.precio_venta).toBe(38.66);
    expect(roundMoney2(33.33 * FACTOR_IVA_PDV)).toBe(38.66);
    expect(m.precio_neto).toBe(roundMoney2(38.66 / FACTOR_IVA_PDV));
    expect(m.ganancia).toBe(roundMoney2((m.precio_neto || 0) - 10));
  });

  it('cero: 0 → 0 sin inventar IVA', () => {
    const m = mapearPreciosPdvAKatzen({ pfinal: 0, pcosto: 0 });
    expect(m.precio_venta).toBe(0);
    expect(m.precio_neto).toBe(0);
    expect(m.iva_trasladado).toBe(0);
    expect(m.ganancia).toBe(0);
    expect(m.precio_compra).toBe(0);
  });

  it('null / vacío no inventa precio', () => {
    expect(mapearPreciosPdvAKatzen({ pfinal: null, pventa: null }).precio_venta).toBeNull();
    expect(mapearPreciosPdvAKatzen({}).precio_venta).toBeNull();
    expect(mapearPreciosPdvAKatzen({ pfinal: '', pventa: undefined }).precio_venta).toBeNull();
    expect(precioEleventaSinIva({})).toBeNull();
  });

  it('costo null no inventa ganancia; no multiplica IVA al costo', () => {
    const m = mapearPreciosPdvAKatzen({ pfinal: 100, pcosto: null });
    expect(m.precio_compra).toBeNull();
    expect(m.ganancia).toBeNull();
    expect(m.precio_venta).toBe(116);
  });

  it('aplicarIva16 false deja el público = PFINAL (exento a revisar)', () => {
    const m = mapearPreciosPdvAKatzen({ pfinal: 100, pcosto: 80, aplicarIva16: false });
    expect(m.precio_venta).toBe(100);
    expect(m.precio_neto).toBe(100);
    expect(m.iva_aplicable).toBe(false);
    expect(m.tasa_iva).toBe(0);
    expect(m.ganancia).toBe(20);
  });

  it('reporte impacto: eleventa vs web con IVA', () => {
    const r = reporteImpactoIvaCliente([
      { codigo: 'X', descripcion: 'Demo', pfinal: 100 },
      { codigo: 'Y', descripcion: 'Cero', pfinal: 0 }
    ]);
    expect(r[0].precio_eleventa).toBe(100);
    expect(r[0].precio_web_con_iva).toBe(116);
    expect(r[0].delta).toBe(16);
    expect(r[0].delta_pct).toBe(16);
    expect(r[1].precio_web_con_iva).toBe(0);
    expect(r[1].delta_pct).toBeNull();
  });
});
