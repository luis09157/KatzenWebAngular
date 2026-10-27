import { pendientesDeDiasPasados } from './cierre-dia.util';

describe('cierre-dia.util', () => {
  const hoy = '2026-10-27';

  it('junta baños, citas y tickets abiertos de días anteriores, el más viejo primero', () => {
    const r = pendientesDeDiasPasados(
      {
        banios: [
          { id: 'b1', estado: 'programado', fecha_banio: '2026-10-20', paciente: 'Jack' },
          { id: 'b2', estado: 'completado', fecha_banio: '2026-10-20' },
          { id: 'b3', estado: 'en_proceso', fecha_banio: '2026-10-27' },
          { id: 'b4', estado: 'programado', fecha_banio: '2026-10-01', activo: false },
        ],
        citas: [
          { id: 'c1', estado: 'Confirmada', fecha_hora: '2026-06-12T16:00', paciente: 'Oreon' },
          { id: 'c2', estado: 'cancelada', fecha: '2026-06-12' },
        ],
        tickets: [
          { id: 't1', estado: 'abierta', fecha: '2026-10-18', cliente: 'Raquel', saldo: 450 },
          { id: 't2', estado: 'cerrada', fecha: '2026-10-18' },
          { id: 't3', estado: 'abierta', fecha: '2026-10-27' },
        ],
      },
      hoy
    );
    expect(r.map((x) => x.id)).toEqual(['c1', 't1', 'b1']);
    expect(r[1].detalle).toBe('Saldo $450.00');
  });

  it('acepta fechas dd/mm/aaaa', () => {
    const r = pendientesDeDiasPasados({ banios: [{ id: 'b', estado: 'programado', fecha_banio: '05/10/2026' }] }, hoy);
    expect(r.length).toBe(1);
    expect(r[0].fecha).toBe('2026-10-05');
  });
});
