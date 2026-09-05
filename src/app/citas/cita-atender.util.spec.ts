import { TOOLTIP_ATENDER_SIN_PACIENTE, pacienteIdDeCita, puedeAtenderCita } from './cita-atender.util';

describe('cita-atender.util', () => {
  it('lee paciente_id', () => {
    expect(pacienteIdDeCita({ paciente_id: 'm1' })).toBe('m1');
    expect(puedeAtenderCita({ paciente_id: 'm1' })).toBeTrue();
  });

  it('acepta idPaciente legacy', () => {
    expect(pacienteIdDeCita({ idPaciente: 'legacy' })).toBe('legacy');
  });

  it('vacío o ausente no atiende', () => {
    expect(pacienteIdDeCita(null)).toBe('');
    expect(pacienteIdDeCita({ paciente_id: '  ' })).toBe('');
    expect(puedeAtenderCita({})).toBeFalse();
    expect(TOOLTIP_ATENDER_SIN_PACIENTE).toContain('mascota');
  });
});
