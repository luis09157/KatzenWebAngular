import { getColorActividadExpediente, getIconoActividadExpediente } from './paciente-timeline.util';

describe('paciente-timeline.util (077)', () => {
  it('iconos conocidos y default', () => {
    expect(getIconoActividadExpediente('historial_clinico')).toBe('medical_services');
    expect(getIconoActividadExpediente('vacuna')).toBe('vaccines');
    expect(getIconoActividadExpediente('cita')).toBe('event');
    expect(getIconoActividadExpediente('desconocido')).toBe('info');
  });

  it('colores conocidos y default', () => {
    expect(getColorActividadExpediente('historial_clinico')).toBe('#7b2c5c');
    expect(getColorActividadExpediente('vacuna')).toBe('#4caf50');
    expect(getColorActividadExpediente('cita')).toBe('#2196f3');
    expect(getColorActividadExpediente('x')).toBe('#888');
  });
});
