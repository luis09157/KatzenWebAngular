import { Cliente } from '../../core/models';
import { consultaPareceTelefono, filtrarClientesTelefonoPrimero, soloDigitos } from './cliente-picker-search.util';

describe('cliente-picker-search (spec 065, teléfono primero)', () => {
  const clientes: Cliente[] = [
    { id: 'a', nombre: 'Ana', apellidoPaterno: 'López', telefono: '5512345678' },
    { id: 'b', nombre: 'Bruno', apellidoPaterno: 'Díaz', telefono: '55 9876 5432' },
    { id: 'c', nombre: 'Carla 123', apellidoPaterno: 'Ruiz', telefono: '' },
    { id: 'd', nombre: 'Inactivo', telefono: '5512340000', activo: false },
  ];

  it('detecta consultas numéricas con ≥3 dígitos', () => {
    expect(consultaPareceTelefono('12')).toBeFalse();
    expect(consultaPareceTelefono('123')).toBeTrue();
    expect(consultaPareceTelefono('55 12-34')).toBeTrue();
    expect(consultaPareceTelefono('(55) 1234')).toBeTrue();
    expect(consultaPareceTelefono('ana 123')).toBeFalse();
    expect(consultaPareceTelefono('')).toBeFalse();
    expect(soloDigitos('+52 (55) 12-34')).toBe('52551234');
  });

  it('prioriza coincidencia por teléfono ignorando espacios y guiones', () => {
    const r = filtrarClientesTelefonoPrimero(clientes, '55 98-76');
    expect(r.map((c) => c.id)).toEqual(['b']);
    const r2 = filtrarClientesTelefonoPrimero(clientes, '1234');
    expect(r2[0].id).toBe('a');
  });

  it('con dígitos, agrega después coincidencias por nombre sin duplicar', () => {
    const r = filtrarClientesTelefonoPrimero(clientes, '123');
    expect(r.map((c) => c.id)).toEqual(['a', 'c']);
  });

  it('excluye inactivos y usa búsqueda por nombre cuando no es teléfono', () => {
    expect(filtrarClientesTelefonoPrimero(clientes, '5512340000')).toEqual([]);
    const r = filtrarClientesTelefonoPrimero(clientes, 'lopez');
    expect(r.map((c) => c.id)).toEqual(['a']);
    expect(filtrarClientesTelefonoPrimero(clientes, '').length).toBe(3);
    expect(filtrarClientesTelefonoPrimero(null, 'x')).toEqual([]);
  });
});
