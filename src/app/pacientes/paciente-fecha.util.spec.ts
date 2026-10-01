import {
  calcularEdadPaciente,
  formatearFechaExpediente,
  formatearFechaLogActividad,
  getPacienteInfoResumen,
  getTiempoTranscurrido,
} from './paciente-fecha.util';

describe('paciente-fecha.util (077)', () => {
  it('formatearFechaExpediente vacío → N/P', () => {
    expect(formatearFechaExpediente(null)).toBe('N/P');
    expect(formatearFechaExpediente('')).toBe('N/P');
    expect(formatearFechaExpediente('no-es-fecha')).toBe('N/P');
  });

  it('formatearFechaExpediente Date válida', () => {
    const d = new Date(2024, 0, 15, 10, 30);
    const out = formatearFechaExpediente(d);
    expect(out).not.toBe('N/P');
    expect(out.length).toBeGreaterThan(5);
  });

  it('formatearFechaLogActividad fallback', () => {
    expect(formatearFechaLogActividad('')).toBe('Fecha no disponible');
    expect(formatearFechaLogActividad(undefined)).toBe('Fecha no disponible');
  });

  it('getTiempoTranscurrido relativo', () => {
    const ahora = new Date('2024-06-15T12:00:00');
    expect(getTiempoTranscurrido('2024-06-15T08:00:00', ahora)).toBe('Hoy');
    expect(getTiempoTranscurrido('2024-06-14T12:00:00', ahora)).toBe('Ayer');
    expect(getTiempoTranscurrido('2024-06-12T12:00:00', ahora)).toBe('Hace 3 días');
    expect(getTiempoTranscurrido('2024-06-01T12:00:00', ahora)).toContain('semana');
    expect(getTiempoTranscurrido(null)).toBe('');
  });

  it('calcularEdadPaciente D/M/YYYY', () => {
    const hoy = new Date(2024, 5, 15); // 15 jun 2024
    expect(calcularEdadPaciente('15/6/2022', hoy)).toContain('año');
    expect(calcularEdadPaciente('15/3/2024', hoy)).toContain('mes');
    expect(calcularEdadPaciente('')).toBe('Edad no registrada');
    expect(calcularEdadPaciente('malo')).toBe('Edad no registrada');
  });

  it('getPacienteInfoResumen', () => {
    expect(getPacienteInfoResumen({ especie: 'Canino', raza: 'Lab', color: 'Negro' })).toBe('Canino, Lab, Negro');
    expect(getPacienteInfoResumen({})).toBe('Información no disponible');
  });
});
