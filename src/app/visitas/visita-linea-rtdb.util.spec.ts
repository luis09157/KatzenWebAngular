import { sanitizeVisitaLineaForRtdb, sanitizeVisitaLineasForRtdb } from './visita-linea-rtdb.util';
import { VisitaLinea } from './visitas.models';

describe('visita-linea-rtdb.util (spec 091)', () => {
  it('omite citaId/banioId/pensionId undefined o null', () => {
    const linea = {
      id: 'l1',
      descripcion: 'Pensión · Oreon',
      monto: 3000,
      categoria: 'pension' as const,
      pensionId: 'pen-1',
      citaId: undefined,
      banioId: null,
      vacunaId: undefined,
      productoId: undefined,
      cantidad: 1,
      aplicaIva: false,
    } as unknown as VisitaLinea;

    const clean = sanitizeVisitaLineaForRtdb(linea);
    expect(clean.pensionId).toBe('pen-1');
    expect(clean.cantidad).toBe(1);
    expect(clean.aplicaIva).toBe(false);
    expect('citaId' in clean).toBe(false);
    expect('banioId' in clean).toBe(false);
    expect('vacunaId' in clean).toBe(false);
    expect('productoId' in clean).toBe(false);
    expect(Object.values(clean as unknown as Record<string, unknown>).some((v) => v === undefined)).toBe(false);
  });

  it('sanitiza arreglo de líneas (pensión sin citaId)', () => {
    const lineas = sanitizeVisitaLineasForRtdb([
      {
        id: 'l0',
        descripcion: 'Pensión',
        monto: 3000,
        categoria: 'pension',
        pensionId: 'P2z',
        citaId: undefined,
      } as VisitaLinea,
    ]);
    expect(lineas).toHaveSize(1);
    expect(lineas[0].pensionId).toBe('P2z');
    expect('citaId' in lineas[0]).toBe(false);
  });

  it('arreglo vacío / null → []', () => {
    expect(sanitizeVisitaLineasForRtdb(null)).toEqual([]);
    expect(sanitizeVisitaLineasForRtdb(undefined)).toEqual([]);
  });
});
