import { debeMostrarPickerAltaRapida } from './alta-rapida-prefill.util';

describe('alta-rapida-prefill.util', () => {
  it('oculta picker cuando Llegó un paciente ya eligió mascota', () => {
    expect(debeMostrarPickerAltaRapida({ paciente_id: 'p1' })).toBe(false);
    expect(debeMostrarPickerAltaRapida({ idPaciente: 'p1' })).toBe(false);
    expect(debeMostrarPickerAltaRapida({})).toBe(true);
    expect(debeMostrarPickerAltaRapida({ hidePatientInfo: true })).toBe(false);
    expect(debeMostrarPickerAltaRapida({ esEdicion: true, paciente_id: '' })).toBe(false);
  });
});
