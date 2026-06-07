import {
  getPacienteClienteId,
  pacientePerteneceACliente
} from './paciente-cliente.util';

describe('paciente-cliente.util', () => {
  describe('getPacienteClienteId', () => {
    it('prefiere cliente_id sobre idCliente', () => {
      expect(getPacienteClienteId({ cliente_id: 'c1', idCliente: 'c2' })).toBe('c1');
    });

    it('usa idCliente si cliente_id falta', () => {
      expect(getPacienteClienteId({ idCliente: 'c2' })).toBe('c2');
    });

    it('retorna vacío sin datos', () => {
      expect(getPacienteClienteId(null)).toBe('');
    });
  });

  describe('pacientePerteneceACliente', () => {
    it('coincide con cliente_id', () => {
      expect(pacientePerteneceACliente({ cliente_id: 'abc' }, 'abc')).toBeTrue();
    });

    it('coincide con idCliente', () => {
      expect(pacientePerteneceACliente({ idCliente: 'abc' }, 'abc')).toBeTrue();
    });

    it('rechaza cliente distinto', () => {
      expect(pacientePerteneceACliente({ idCliente: 'abc' }, 'xyz')).toBeFalse();
    });
  });
});
