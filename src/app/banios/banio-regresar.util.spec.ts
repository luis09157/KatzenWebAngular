import { puedeRegresarAProgramado } from './banio-regresar.util';

describe('banio-regresar.util', () => {
  it('solo en proceso y sin dinero de por medio', () => {
    expect(puedeRegresarAProgramado({ estado: 'en_proceso' })).toBeTrue();
    expect(puedeRegresarAProgramado({ estado: 'programado' })).toBeFalse();
    expect(puedeRegresarAProgramado({ estado: 'completado' })).toBeFalse();
    expect(puedeRegresarAProgramado({ estado: 'en_proceso', pagado: true })).toBeFalse();
    expect(puedeRegresarAProgramado({ estado: 'en_proceso', visitaId: 'v1' })).toBeFalse();
    expect(puedeRegresarAProgramado({ estado: 'en_proceso', cajaMovimientoId: 'c1' })).toBeFalse();
    expect(puedeRegresarAProgramado(null)).toBeFalse();
  });
});
