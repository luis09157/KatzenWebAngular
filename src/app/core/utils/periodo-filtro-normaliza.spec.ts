import { normalizeFechaIso } from './periodo-filtro.util';

describe('normalizeFechaIso con dd/mm/aaaa (2026-10-26)', () => {
  it('convierte dd/mm/aaaa a ISO sin voltear día y mes', () => {
    expect(normalizeFechaIso('23/10/2026')).toBe('2026-10-23');
    expect(normalizeFechaIso('02/10/2026')).toBe('2026-10-02');
    expect(normalizeFechaIso('2/9/2026')).toBe('2026-09-02');
  });

  it('deja igual lo que ya es ISO y rechaza lo imposible', () => {
    expect(normalizeFechaIso('2026-10-23')).toBe('2026-10-23');
    expect(normalizeFechaIso('2026-10-23 13:00:00')).toBe('2026-10-23');
    expect(normalizeFechaIso('40/13/2026')).toBeNull();
  });
});
