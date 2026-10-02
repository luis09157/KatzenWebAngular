import { esBanioEnColaMostradorHoy, esBanioListoParaCobrar } from './banio-cola-mostrador.util';
import { buildPorCobrarHoy } from './por-cobrar-hoy.util';

describe('banio-cola-mostrador.util (spec 085)', () => {
  const hoy = '2026-10-01';

  const base = {
    id: 'b1',
    cliente_id: 'c1',
    fecha_banio: hoy,
    precio_total: 280,
    estado: 'completado' as string,
  };

  it('listo = solo completado', () => {
    expect(esBanioListoParaCobrar({ estado: 'completado' })).toBe(true);
    expect(esBanioListoParaCobrar({ estado: 'programado' })).toBe(false);
    expect(esBanioListoParaCobrar({ estado: 'en_proceso' })).toBe(false);
  });

  it('entra a cola: completado hoy con precio sin ticket', () => {
    expect(esBanioEnColaMostradorHoy(base, hoy)).toBe(true);
  });

  it('no entra: programado (anti-basura agenda)', () => {
    expect(esBanioEnColaMostradorHoy({ ...base, estado: 'programado' }, hoy)).toBe(false);
  });

  it('sale de cola: visitaId / pagado / caja', () => {
    expect(esBanioEnColaMostradorHoy({ ...base, visitaId: 'v1' }, hoy)).toBe(false);
    expect(esBanioEnColaMostradorHoy({ ...base, pagado: true }, hoy)).toBe(false);
    expect(esBanioEnColaMostradorHoy({ ...base, cajaMovimientoId: 'm1' }, hoy)).toBe(false);
  });

  it('no entra: otra fecha (historial fuera de mostrador)', () => {
    expect(esBanioEnColaMostradorHoy({ ...base, fecha_banio: '2026-09-30' }, hoy)).toBe(false);
  });

  it('no entra: sin precio / cancelado / inactivo', () => {
    expect(esBanioEnColaMostradorHoy({ ...base, precio_total: 0 }, hoy)).toBe(false);
    expect(esBanioEnColaMostradorHoy({ ...base, estado: 'cancelado' }, hoy)).toBe(false);
    expect(esBanioEnColaMostradorHoy({ ...base, activo: false }, hoy)).toBe(false);
  });
});

describe('buildPorCobrarHoy + cola baño 085', () => {
  const hoy = '2026-10-01';
  const vacio = {
    hoy,
    visitas: [] as any[],
    citas: [] as any[],
    pensiones: [] as any[],
    vacunas: [] as any[],
    historiales: [] as any[],
  };

  it('incluye completado con nota; excluye programado', () => {
    const items = buildPorCobrarHoy({
      ...vacio,
      banios: [
        {
          id: 'ok',
          cliente_id: 'c1',
          paciente: 'Michi',
          fecha_banio: hoy,
          precio_total: 350,
          estado: 'completado',
          observaciones: 'Irritación; shampoo',
        },
        {
          id: 'prog',
          cliente_id: 'c1',
          fecha_banio: hoy,
          precio_total: 200,
          estado: 'programado',
        },
      ],
    });
    expect(items.filter((i) => i.tipo === 'banio').map((i) => i.id)).toEqual(['ok']);
    expect(items[0].nota).toContain('Irritación');
    expect(items[0].monto).toBe(350);
  });

  it('desaparece al cobrar (visitaId)', () => {
    const items = buildPorCobrarHoy({
      ...vacio,
      banios: [
        {
          id: 'cobrado',
          cliente_id: 'c1',
          fecha_banio: hoy,
          precio_total: 200,
          estado: 'completado',
          visitaId: 'vis-9',
        },
      ],
    });
    expect(items.some((i) => i.tipo === 'banio')).toBe(false);
  });

  it('no lista basura de ayer impaga', () => {
    const items = buildPorCobrarHoy({
      ...vacio,
      banios: [
        {
          id: 'ayer',
          cliente_id: 'c1',
          fecha_banio: '2026-09-30',
          precio_total: 200,
          estado: 'completado',
        },
      ],
    });
    expect(items.some((i) => i.tipo === 'banio')).toBe(false);
  });
});
