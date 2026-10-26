import { gruposMotivoCita, motivosCitaPlano } from './cita-motivos.util';

describe('cita-motivos.util', () => {
  it('no ofrece Grooming ni Emergencia para citas nuevas', () => {
    const lista = motivosCitaPlano();
    expect(lista).not.toContain('Grooming (Peluquería)');
    expect(lista).not.toContain('Emergencia');
    expect(lista).not.toContain('Cardiología');
  });

  it('incluye las cirugías que hace la clínica', () => {
    const cirugia = gruposMotivoCita().find((g) => g.nombre === 'Cirugía');
    expect(cirugia?.motivos).toEqual([
      'Esterilización/Castración',
      'Enucleación',
      'Otohematoma',
      'Retiro de tumores',
      'Tejido blando (otras cirugías)',
    ]);
  });

  it('una cita vieja conserva su motivo aunque ya no esté en la lista', () => {
    const grupos = gruposMotivoCita('Emergencia');
    expect(grupos[grupos.length - 1]).toEqual({ nombre: 'Motivo anterior', motivos: ['Emergencia'] });
    expect(gruposMotivoCita('Vacunación').some((g) => g.nombre === 'Motivo anterior')).toBeFalse();
  });
});
