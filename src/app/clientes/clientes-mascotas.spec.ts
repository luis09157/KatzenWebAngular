import { agruparMascotasPorCliente } from './clientes.component';

describe('agruparMascotasPorCliente (tarjeta de Clientes en celular)', () => {
  it('agrupa por cliente_id o idCliente, ordena y omite inactivas', () => {
    const map = agruparMascotasPorCliente([
      { cliente_id: 'c1', nombre: 'Oreon' },
      { idCliente: 'c1', nombre: 'Luna' },
      { cliente_id: 'c2', nombre: 'Jack' },
      { cliente_id: 'c1', nombre: 'Viejo', activo: false },
      { nombre: 'Sin dueño' },
    ]);
    expect(map['c1']).toEqual(['Luna', 'Oreon']);
    expect(map['c2']).toEqual(['Jack']);
    expect(Object.keys(map).length).toBe(2);
  });
});
