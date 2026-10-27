import {
  agrupar,
  completarColonias,
  filasDesdeBanios,
  filasDesdeCitas,
  filasDesdeGasolinaApp,
  filasDesdeVisitas,
  porMes,
  resumir,
  top,
} from './domicilios-metricas.util';

const dom = { km: 3, tipoNombre: 'Ida y vuelta', costoGasolina: 14.7, precio: 30, colonia: 'Centro' };

describe('domicilios-metricas.util', () => {
  it('lee viajes de la app (fecha d-MM-yyyy) como en la base real', () => {
    const raiz = {
      2025: {
        '04-2025': {
          costo: '24.50',
          cargos: {
            '12-04-2025': {
              x: { categoria: 'Semana X4', costo: '24.5', venta: '40.66', ganancia: '16.16', kilometros: '2.5', fecha: '12-04-2025', nombreCliente: 'Juanita', idCliente: 'c1', nombreDomicilio: 'Viggo', domicilio: 'Héctor Espino #603' },
            },
          },
        },
      },
    };
    const f = filasDesdeGasolinaApp(raiz);
    expect(f.length).toBe(1);
    expect(f[0].fecha).toBe('2025-04-12');
    expect(f[0].precio).toBe(40.66);
    expect(f[0].paciente).toBe('Viggo');
    expect(completarColonias(f, new Map([['c1', 'Huinalá']]))[0].colonia).toBe('Huinalá');
  });

  it('baños y citas con domicilio; ignora cancelados y sin domicilio', () => {
    expect(filasDesdeBanios([{ fecha_banio: '2026-10-27', domicilio: dom, peluquero: 'Ana' }, { estado: 'cancelado', domicilio: dom }, {}]).length).toBe(1);
    const c = filasDesdeCitas([{ fecha: '2026-10-27T15:00:00Z', domicilio: dom, estado: 'pendiente', veterinario: 'Dra.' }]);
    expect(c[0].fecha).toBe('2026-10-27');
    expect(c[0].ganancia).toBe(15.3);
  });

  it('del ticket solo cuenta domicilios sueltos (los de baño/cita ya cuentan)', () => {
    const v = [
      {
        fecha: '2026-10-27',
        lineas: [
          { categoria: 'domicilio', monto: 30, domicilio: dom },
          { categoria: 'domicilio', monto: 30, domicilio: dom, domicilioDe: { tipo: 'banio', id: 'b' } },
          { categoria: 'banio', monto: 300 },
        ],
      },
    ];
    expect(filasDesdeVisitas(v).length).toBe(1);
  });

  it('resume, agrupa por mes y saca el top', () => {
    const filas = filasDesdeBanios([
      { fecha_banio: '2026-10-01', domicilio: dom },
      { fecha_banio: '2026-10-02', domicilio: { ...dom, colonia: 'Norte' } },
      { fecha_banio: '2026-09-02', domicilio: dom },
    ]);
    expect(resumir(filas)).toEqual({ total: 3, km: 9, costo: 44.1, precio: 90, ganancia: 45.9 });
    const meses = porMes(filas, '2026');
    expect(meses.length).toBe(12);
    expect(meses[9].total).toBe(2);
    expect(meses[9].etiqueta).toBe('Oct');
    expect(top(agrupar(filas, (f) => f.colonia))[0].clave).toBe('Centro');
  });
});
