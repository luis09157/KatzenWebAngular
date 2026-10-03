import {
  esPensionPendienteDeTicket,
  filtrarPensionesPendientesTicket,
  pensionYaEnLineas,
} from './pendientes-pension.util';
import { PensionEstancia } from '../pension/pension.models';

function estancia(parcial: Partial<PensionEstancia> & Pick<PensionEstancia, 'id' | 'cliente_id'>): PensionEstancia {
  return {
    paciente_id: 'p1',
    paciente: 'Firulais',
    fecha_ingreso: '2026-10-01',
    precio_dia: 300,
    precio_total: 900,
    tamano_mascota: 'mediano',
    estado: 'activa',
    activo: true,
    created_at: '2026-10-01T10:00:00.000Z',
    ...parcial,
  };
}

describe('pendientes-pension.util (091)', () => {
  it('esPensionPendienteDeTicket excluye cobradas / reservadas / canceladas', () => {
    expect(esPensionPendienteDeTicket(estancia({ id: 'a', cliente_id: 'c1' }))).toBe(true);
    expect(esPensionPendienteDeTicket(estancia({ id: 'a', cliente_id: 'c1', estado: 'reservada' }))).toBe(false);
    expect(esPensionPendienteDeTicket(estancia({ id: 'a', cliente_id: 'c1', visitaId: 'v1' }))).toBe(false);
    expect(esPensionPendienteDeTicket(estancia({ id: 'a', cliente_id: 'c1', cajaMovimientoId: 'm1' }))).toBe(false);
  });

  it('filtra por cliente; no exige fecha de hoy; usa descripcionCobroPension', () => {
    const rows = filtrarPensionesPendientesTicket(
      [
        estancia({ id: 'e1', cliente_id: 'c1', fecha_ingreso: '2026-09-20' }),
        estancia({ id: 'e2', cliente_id: 'c2' }),
        estancia({ id: 'e3', cliente_id: 'c1', cobradaEnVisitaId: 'v9' }),
      ],
      { clienteId: 'c1' }
    );
    expect(rows.map((r) => r.id)).toEqual(['e1']);
    expect(rows[0].descripcion).toContain('Pensión');
    expect(rows[0].descripcion).toContain('Mediano');
    expect(rows[0].descripcion).toContain('Firulais');
  });

  it('mostrador / sin cliente → vacío', () => {
    expect(
      filtrarPensionesPendientesTicket([estancia({ id: 'e1', cliente_id: 'c1' })], {
        clienteId: '__mostrador__',
      })
    ).toEqual([]);
  });

  it('pensionYaEnLineas detecta pensionId', () => {
    expect(
      pensionYaEnLineas([{ id: 'l1', descripcion: 'x', monto: 1, categoria: 'pension', pensionId: 'e1' }], 'e1')
    ).toBe(true);
    expect(pensionYaEnLineas([{ id: 'l1', descripcion: 'x', monto: 1, categoria: 'pension' }], 'e1')).toBe(false);
  });
});
