import {
  agregarSaldoCliente,
  ajustarCantidadLinea,
  cantidadLinea,
  contarArticulos,
  deriveEstado,
  nombreBaseLinea,
  precioUnitarioLinea,
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

  it('sumLineas ignora líneas devueltas', () => {
    expect(
      sumLineas([
        { id: 'a', descripcion: 'A', monto: 100, categoria: 'otro' },
        { id: 'b', descripcion: 'B', monto: 50, categoria: 'otro', fueDevuelto: true }
      ] as any)
    ).toBe(100);
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

  it('055 POS: ajusta cantidad de producto y quita en 0', () => {
    const linea = {
      id: 'p1',
      descripcion: 'Pipeta × 1',
      monto: 200,
      categoria: 'venta_producto' as const,
      cantidad: 1
    };
    expect(cantidadLinea(linea)).toBe(1);
    expect(precioUnitarioLinea(linea)).toBe(200);
    const dos = ajustarCantidadLinea(linea, 1);
    expect(dos?.cantidad).toBe(2);
    expect(dos?.monto).toBe(400);
    expect(dos?.descripcion).toBe('Pipeta × 2');
    expect(nombreBaseLinea(dos?.descripcion)).toBe('Pipeta');
    expect(ajustarCantidadLinea(linea, -1)).toBeNull();
    expect(contarArticulos([dos!])).toBe(2);
  });

  it('056: al ajustar cantidad escala costo, IVA y ganancia', () => {
    const linea = {
      id: 's1',
      descripcion: 'Consulta',
      monto: 400,
      categoria: 'consulta' as const,
      cantidad: 1,
      costo: 80,
      precio_venta: 400,
      iva: 55.17,
      ganancia: 264.83,
      aplicaIva: true,
      tasaIva: 16
    };
    const dos = ajustarCantidadLinea(linea, 1);
    expect(dos?.cantidad).toBe(2);
    expect(dos?.monto).toBe(800);
    expect(dos?.costo).toBe(160);
    expect(dos?.iva).toBe(110.34);
    expect(dos?.ganancia).toBe(529.66);
  });
});
