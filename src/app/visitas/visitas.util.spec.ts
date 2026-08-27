import {
  agregarSaldoCliente,
  deriveEstado,
  recalcularVisita,
  sumLineas
} from './visitas.util';
import { Visita } from './visitas.models';

describe('visitas.util', () => {
  it('suma líneas y recalcula saldo parcial', () => {
    const calc = recalcularVisita({
      lineas: [
        { id: '1', descripcion: 'Consulta', monto: 400, categoria: 'consulta' },
        { id: '2', descripcion: 'Vacuna', monto: 200, categoria: 'vacuna' }
      ],
      pagado: 300
    });
    expect(calc.total).toBe(600);
    expect(calc.pagado).toBe(300);
    expect(calc.saldo).toBe(300);
    expect(calc.estado).toBe('parcial');
  });

  it('sumLineas maneja vacío', () => {
    expect(sumLineas([])).toBe(0);
    expect(sumLineas(null)).toBe(0);
  });

  it('deriveEstado cerrada cuando saldo 0', () => {
    expect(deriveEstado(500, 500)).toBe('cerrada');
    expect(deriveEstado(0, 0)).toBe('abierta');
  });

  it('agrega saldo cliente solo de deudas', () => {
    const visitas = [
      { saldo: 100, estado: 'parcial', activo: true },
      { saldo: 50, estado: 'abierta', activo: true },
      { saldo: 0, estado: 'cerrada', activo: true },
      { saldo: 80, estado: 'cancelada', activo: true }
    ] as Visita[];
    expect(agregarSaldoCliente(visitas)).toBe(150);
  });
});
