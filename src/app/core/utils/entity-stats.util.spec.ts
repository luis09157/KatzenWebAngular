import {
  calcularClienteEstadisticas,
  calcularClientesConPacientes,
  calcularPacienteEstadisticas
} from './entity-stats.util';

describe('entity-stats.util', () => {
  it('cuenta todos los clientes activos en sucursal', () => {
    const stats = calcularClienteEstadisticas([
      { id: '1', activo: true, correo: 'a@b.com', expediente: 'E1', sucursalId: 'principal' },
      { id: '2', activo: true, correo: '', expediente: '', sucursalId: 'principal' },
      { id: '3', activo: false, correo: 'x@y.com', expediente: 'E3' }
    ], 'principal');

    expect(stats.total).toBe(2);
    expect(stats.conCorreo).toBe(1);
    expect(stats.conExpediente).toBe(1);
  });

  it('cuenta pacientes y dueños únicos', () => {
    const stats = calcularPacienteEstadisticas([
      { id: 'p1', activo: true, especie: 'CANINO', idCliente: 'c1' },
      { id: 'p2', activo: true, especie: 'FELINO', cliente_id: 'c1' },
      { id: 'p3', activo: true, especie: 'Perro', idCliente: 'c2' }
    ], 'principal');

    expect(stats.total).toBe(3);
    expect(stats.duenosUnicos).toBe(2);
    expect(stats.perros).toBe(2);
    expect(stats.gatos).toBe(1);
  });

  it('calcula clientes con pacientes usando todos los registros', () => {
    const pacienteStats = calcularPacienteEstadisticas([
      { id: 'p1', activo: true, idCliente: 'c1' }
    ], 'principal');

    const count = calcularClientesConPacientes(
      [
        { id: 'c1', activo: true },
        { id: 'c2', activo: true }
      ],
      pacienteStats.clienteIdsConPaciente,
      'principal'
    );

    expect(count).toBe(1);
  });
});
