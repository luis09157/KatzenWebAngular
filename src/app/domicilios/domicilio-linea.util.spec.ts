import { DomicilioDatos } from './domicilio.models';
import { descripcionLineaDomicilio, domicilioDeOrigen, domicilioYaEnLineas, lineaDomicilio } from './domicilio-linea.util';

const dom: DomicilioDatos = {
  km: 3,
  tipoId: 'ida_vuelta',
  tipoNombre: 'Ida y vuelta',
  recorridos: 2,
  precioLitro: 24.5,
  kmPorLitro: 10,
  margenPct: 66,
  costoGasolina: 14.7,
  precioSugerido: 25,
  precio: 30,
  ganancia: 15.3,
  cotizadoEn: '2026-10-27T10:00:00Z',
};

describe('domicilio-linea.util', () => {
  it('arma la línea con costo de gasolina y ganancia', () => {
    const l = lineaDomicilio('l1', dom, { paciente: 'Jack', origen: { tipo: 'banio', id: 'b1' } });
    expect(l.categoria).toBe('domicilio');
    expect(l.monto).toBe(30);
    expect(l.costo).toBe(14.7);
    expect(l.ganancia).toBe(15.3);
    expect(l.descripcion).toBe('Domicilio · Ida y vuelta · 3 km · Jack');
    expect(l.domicilioDe).toEqual({ tipo: 'banio', id: 'b1' });
    expect(l.banioId).toBeUndefined();
  });

  it('detecta si ya está en el ticket', () => {
    const l = lineaDomicilio('l1', dom, { origen: { tipo: 'cita', id: 'c1' } });
    expect(domicilioYaEnLineas([l], { tipo: 'cita', id: 'c1' })).toBeTrue();
    expect(domicilioYaEnLineas([l], { tipo: 'banio', id: 'c1' })).toBeFalse();
  });

  it('ignora domicilio incompleto', () => {
    expect(domicilioDeOrigen({ ...dom, km: 0 })).toBeNull();
    expect(domicilioDeOrigen(null)).toBeNull();
    expect(descripcionLineaDomicilio(dom)).toBe('Domicilio · Ida y vuelta · 3 km');
  });
});
