import { debeMostrarPickerAltaRapida, labelDueñoDesdeDialogData } from './alta-rapida-prefill.util';

describe('alta-rapida-prefill.util', () => {
  it('oculta picker cuando Llegó un paciente ya eligió mascota', () => {
    expect(debeMostrarPickerAltaRapida({ paciente_id: 'p1' })).toBe(false);
    expect(debeMostrarPickerAltaRapida({ idPaciente: 'p1' })).toBe(false);
    expect(debeMostrarPickerAltaRapida({})).toBe(true);
    expect(debeMostrarPickerAltaRapida({ hidePatientInfo: true })).toBe(false);
    expect(debeMostrarPickerAltaRapida({ esEdicion: true, paciente_id: '' })).toBe(false);
  });

  it('labelDueñoDesdeDialogData acepta string o objeto Cliente', () => {
    expect(labelDueñoDesdeDialogData({ cliente: 'LUIS NIÑO MARTINEZ' })).toBe('LUIS NIÑO MARTINEZ');
    expect(
      labelDueñoDesdeDialogData({
        cliente: { id: 'c1', nombre: 'Luis', apellidoPaterno: 'Niño', apellidoMaterno: 'Martinez' },
      })
    ).toBe('Luis Niño Martinez');
    expect(labelDueñoDesdeDialogData({ cliente_nombre: 'Dueño fallback' })).toBe('Dueño fallback');
    expect(labelDueñoDesdeDialogData({ cliente: '' })).toBe('');
    expect(labelDueñoDesdeDialogData(null)).toBe('');
  });
});
