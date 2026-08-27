import {
  banioYaEnLineas,
  descripcionLineaBanio,
  esBanioPendienteDeTicket,
  filtrarBaniosPendientesTicket
} from './pendientes-visita.util';
import { Banio } from '../shared/banio.model';

function mockBanio(over: Partial<Banio> = {}): Banio {
  return {
    id: 'b1',
    paciente_id: 'p1',
    paciente: 'Luna',
    cliente_id: 'c1',
    cliente: 'Ana',
    fecha_banio: '2026-08-27',
    hora_banio: '10:00',
    tipo_servicio: 'baño_completo',
    estado: 'completado',
    prioridad: 'media',
    peluquero_id: 'u1',
    precio_base: 250,
    precio_total: 250,
    pagado: false,
    duracion_estimada: 60,
    activo: true,
    created_at: '2026-08-27T00:00:00.000Z',
    updated_at: '2026-08-27T00:00:00.000Z',
    created_by: 'test',
    ...over
  };
}

describe('pendientes-visita.util', () => {
  it('excluye baño ya en visita, caja o pagado', () => {
    expect(esBanioPendienteDeTicket(mockBanio())).toBe(true);
    expect(esBanioPendienteDeTicket(mockBanio({ visitaId: 'v1' }))).toBe(false);
    expect(esBanioPendienteDeTicket(mockBanio({ cajaMovimientoId: 'm1' }))).toBe(false);
    expect(esBanioPendienteDeTicket(mockBanio({ pagado: true }))).toBe(false);
    expect(esBanioPendienteDeTicket(mockBanio({ estado: 'cancelado' }))).toBe(false);
  });

  it('filtra por cliente y fecha', () => {
    const lista = [
      mockBanio(),
      mockBanio({ id: 'b2', cliente_id: 'c2' }),
      mockBanio({ id: 'b3', fecha_banio: '2026-08-26' })
    ];
    const r = filtrarBaniosPendientesTicket(lista, { clienteId: 'c1', fecha: '2026-08-27' });
    expect(r.length).toBe(1);
    expect(r[0].id).toBe('b1');
  });

  it('opcionalmente filtra por paciente', () => {
    const lista = [
      mockBanio(),
      mockBanio({ id: 'b2', paciente_id: 'p2', paciente: 'Max' })
    ];
    const r = filtrarBaniosPendientesTicket(lista, {
      clienteId: 'c1',
      fecha: '2026-08-27',
      pacienteId: 'p2'
    });
    expect(r.map(x => x.id)).toEqual(['b2']);
  });

  it('descripcionLineaBanio y banioYaEnLineas', () => {
    expect(descripcionLineaBanio({
      id: 'b1',
      cliente_id: 'c1',
      paciente: 'Luna',
      tipo_servicio: 'baño_completo',
      precio_total: 250,
      categoria: 'banio'
    })).toContain('Luna');
    expect(banioYaEnLineas([{ id: 'l1', descripcion: 'x', monto: 1, categoria: 'banio', banioId: 'b1' }], 'b1')).toBe(true);
    expect(banioYaEnLineas([], 'b1')).toBe(false);
  });
});
