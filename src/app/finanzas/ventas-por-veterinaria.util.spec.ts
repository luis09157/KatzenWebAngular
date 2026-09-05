import { agruparVentasPorVeterinaria, resumenCxcClientes } from './ventas-por-veterinaria.util';

describe('ventas-por-veterinaria.util (spec 071)', () => {
  it('agrupa tickets del día por atendidoPorNombre', () => {
    const rows = agruparVentasPorVeterinaria(
      [
        {
          fecha: '2026-09-04',
          estado: 'cerrada',
          activo: true,
          atendidoPorNombre: 'Dra. Ana',
          total: 500,
          pagado: 500,
        },
        {
          fecha: '2026-09-04',
          estado: 'parcial',
          activo: true,
          atendidoPorNombre: 'Dra. Ana',
          total: 300,
          pagado: 100,
        },
        { fecha: '2026-09-04', estado: 'cerrada', activo: true, atendidoPorNombre: '', total: 80, pagado: 80 },
        {
          fecha: '2026-09-03',
          estado: 'cerrada',
          activo: true,
          atendidoPorNombre: 'Dra. Ana',
          total: 999,
          pagado: 999,
        },
        {
          fecha: '2026-09-04',
          estado: 'cancelada',
          activo: true,
          atendidoPorNombre: 'Dra. Ana',
          total: 10,
          pagado: 10,
        },
      ],
      '2026-09-04'
    );
    expect(rows.length).toBe(2);
    expect(rows[0].nombre).toBe('Dra. Ana');
    expect(rows[0].tickets).toBe(2);
    expect(rows[0].pagado).toBe(600);
    expect(rows[1].nombre).toBe('Sin asignar');
    expect(rows[1].tickets).toBe(1);
  });

  it('resume CxC sin duplicar clientes en cero', () => {
    const r = resumenCxcClientes([{ saldoPendiente: 150.5 }, { saldoPendiente: 0 }, { saldoPendiente: 49.5 }, {}]);
    expect(r.deudores).toBe(2);
    expect(r.total).toBe(200);
  });
});
