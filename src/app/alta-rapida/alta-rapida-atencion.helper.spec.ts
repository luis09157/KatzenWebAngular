import { dataAtencionDesdeContexto, rutaExpedientePaciente } from './alta-rapida-atencion.helper';

describe('alta-rapida-atencion.helper', () => {
  it('arma ids duales para los diálogos clínicos', () => {
    const data = dataAtencionDesdeContexto({
      cliente_id: 'c1',
      cliente: 'Ana',
      paciente_id: 'p1',
      paciente: 'Luna',
    });
    expect(data.cliente_id).toBe('c1');
    expect(data.idCliente).toBe('c1');
    expect(data.paciente_id).toBe('p1');
    expect(data.idPaciente).toBe('p1');
    expect(data.paciente).toBe('Luna');
  });

  it('navega al expediente con query id', () => {
    const nav = rutaExpedientePaciente('abc');
    expect(nav.commands).toEqual(['/admin/paciente']);
    expect(nav.extras.queryParams.id).toBe('abc');
  });
});
