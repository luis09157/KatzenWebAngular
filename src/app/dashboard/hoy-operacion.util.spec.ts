import { esEstanciaPensionHoy, esRecordatorioHoyOVencido, fechaRecordatorioIso } from './hoy-operacion.util';

describe('hoy-operacion.util (072)', () => {
  it('toma fecha de recordatorio y filtra vencidos/hoy pendientes', () => {
    expect(fechaRecordatorioIso({ fecha_hora_recordatorio: '2026-09-04T09:00' })).toBe('2026-09-04');
    expect(
      esRecordatorioHoyOVencido({ fecha_recordatorio: '2026-09-03', estado: 'pendiente' }, '2026-09-04')
    ).toBeTrue();
    expect(
      esRecordatorioHoyOVencido({ fecha_recordatorio: '2026-09-05', estado: 'pendiente' }, '2026-09-04')
    ).toBeFalse();
    expect(
      esRecordatorioHoyOVencido({ fecha_recordatorio: '2026-09-04', estado: 'completado' }, '2026-09-04')
    ).toBeFalse();
  });

  it('pensión hoy = estancia activa', () => {
    expect(esEstanciaPensionHoy({ estado: 'activa', activo: true })).toBeTrue();
    expect(esEstanciaPensionHoy({ estado: 'reservada' })).toBeFalse();
    expect(esEstanciaPensionHoy({ estado: 'activa', activo: false })).toBeFalse();
  });
});
