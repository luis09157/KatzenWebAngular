import {
  bloquearCobroDirectoEnCaja,
  debeExcluirRefuerzoIngresoServicio,
  vinculadoATicketVisita,
  yaCobradoEnCaja
} from './cobro-integridad.util';

describe('cobro-integridad.util', () => {
  it('detecta cobro en caja', () => {
    expect(yaCobradoEnCaja({ cajaMovimientoId: 'mov-1' })).toBe(true);
    expect(yaCobradoEnCaja({ visitaId: 'vis-1' })).toBe(false);
  });

  it('bloquea cobro directo si está en visita', () => {
    expect(bloquearCobroDirectoEnCaja({ visitaId: 'vis-1' })).toBe(true);
    expect(bloquearCobroDirectoEnCaja({ cajaMovimientoId: 'mov-1' })).toBe(true);
    expect(bloquearCobroDirectoEnCaja({ cobrada: true })).toBe(true);
    expect(bloquearCobroDirectoEnCaja({})).toBe(false);
  });

  it('excluye refuerzo si tiene visitaId aunque no tenga caja', () => {
    expect(debeExcluirRefuerzoIngresoServicio({ visitaId: 'vis-1' })).toBe(true);
    expect(debeExcluirRefuerzoIngresoServicio({ cajaMovimientoId: 'm' })).toBe(true);
    expect(debeExcluirRefuerzoIngresoServicio({ pagado: true })).toBe(false);
  });

  it('vinculadoATicketVisita', () => {
    expect(vinculadoATicketVisita({ visitaId: 'x' })).toBe(true);
    expect(vinculadoATicketVisita(null)).toBe(false);
  });
});
