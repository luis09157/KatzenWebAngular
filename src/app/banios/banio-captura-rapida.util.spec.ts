import { fechaHoyLocal, horaAhoraLocal, prefillCapturaRapidaBanio } from './banio-captura-rapida.util';

describe('banio-captura-rapida.util (spec 085 Fase A)', () => {
  const fixed = new Date(2026, 9, 1, 15, 7, 0); // 1 oct 2026 15:07 local

  it('fechaHoyLocal y horaAhoraLocal', () => {
    expect(fechaHoyLocal(fixed)).toBe('2026-10-01');
    expect(horaAhoraLocal(fixed)).toBe('15:07');
  });

  it('prefill captura rápida programado', () => {
    const p = prefillCapturaRapidaBanio({ now: fixed });
    expect(p.fecha_banio).toBe('2026-10-01');
    expect(p.hora_banio).toBe('15:07');
    expect(p.estado).toBe('programado');
    expect(p.duracion_estimada).toBe(60);
    expect(p.pagado).toBe(false);
  });

  it('prefill iniciarYa → en_proceso', () => {
    const p = prefillCapturaRapidaBanio({ now: fixed, iniciarYa: true });
    expect(p.estado).toBe('en_proceso');
  });
});
