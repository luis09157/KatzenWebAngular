import {
  buildPensionEstanciaCreatePayload,
  normalizeCostoDiaPension,
  omitUndefinedRtdb,
} from './pension-estancia-payload.util';

describe('pension-estancia-payload.util', () => {
  it('omitUndefinedRtdb quita solo undefined', () => {
    const cleaned = omitUndefinedRtdb({
      a: 1,
      b: undefined,
      c: null,
      d: 0,
      e: '',
    } as Record<string, unknown>);
    expect(cleaned).toEqual({ a: 1, c: null, d: 0, e: '' });
    expect('b' in cleaned).toBe(false);
  });

  it('normalizeCostoDiaPension omite vacío/NaN', () => {
    expect(normalizeCostoDiaPension(null)).toBeUndefined();
    expect(normalizeCostoDiaPension(undefined)).toBeUndefined();
    expect(normalizeCostoDiaPension('')).toBeUndefined();
    expect(normalizeCostoDiaPension('x')).toBeUndefined();
    expect(normalizeCostoDiaPension(90)).toBe(90);
    expect(normalizeCostoDiaPension(-5)).toBe(0);
  });

  it('buildPensionEstanciaCreatePayload no incluye costo_dia si no hay costo', () => {
    const payload = buildPensionEstanciaCreatePayload({
      paciente_id: 'p1',
      cliente_id: 'c1',
      fecha_ingreso: '2026-10-02',
      fecha_salida_prevista: '2026-10-09',
      tamano_mascota: 'pequeno',
      precio_dia: 250,
      precio_total: 1750,
      costo_dia: undefined,
      estado: 'activa',
      notas: 'ejemplo',
      dias: 7,
      now: '2026-10-02T12:00:00.000Z',
      staffId: 'staff1',
    });
    expect(payload['precio_dia']).toBe(250);
    expect(payload['precio_total']).toBe(1750);
    expect('costo_dia' in payload).toBe(false);
    expect('costo_total_estimado' in payload).toBe(false);
    expect(Object.values(payload).some((v) => v === undefined)).toBe(false);
  });

  it('buildPensionEstanciaCreatePayload incluye costo cuando hay número', () => {
    const payload = buildPensionEstanciaCreatePayload({
      paciente_id: 'p1',
      cliente_id: 'c1',
      fecha_ingreso: '2026-10-02',
      precio_dia: 250,
      costo_dia: 90,
      dias: 7,
      now: '2026-10-02T12:00:00.000Z',
      staffId: 'staff1',
    });
    expect(payload['costo_dia']).toBe(90);
    expect(payload['costo_total_estimado']).toBe(630);
  });
});
