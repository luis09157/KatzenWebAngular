import {
  coincidenciaTextoListado,
  fechaHoyListadoLocal,
  fechaMananaLocal,
  filtrarFilasPorFechaIso,
  filtrarListadoAgendaOBusqueda,
  listadoFechaIso,
  metaListadoHoyManana,
  partirListadoHoyManana,
} from './listado-hoy-manana.util';

describe('listado-hoy-manana.util (085 / 061)', () => {
  const hoy = new Date(2026, 9, 18, 12, 0, 0); // 18 oct 2026 local
  type Fila = { id: string; fechas: string[]; nombre: string; activa?: boolean };

  const filas: Fila[] = [
    { id: '1', fechas: ['2026-10-18'], nombre: 'Luna' },
    { id: '2', fechas: ['2026-10-19'], nombre: 'Max' },
    { id: '3', fechas: ['2026-10-17'], nombre: 'Scooby' },
    { id: '4', fechas: ['2024-03-31'], nombre: 'Arya' },
    { id: '5', fechas: ['2026-10-10'], nombre: 'Activa', activa: true },
  ];

  const getFechas = (f: Fila) => f.fechas;

  it('listadoFechaIso normaliza ISO y datetime', () => {
    expect(listadoFechaIso('2026-10-18')).toBe('2026-10-18');
    expect(listadoFechaIso('2026-10-18T15:00:00')).toBe('2026-10-18');
    expect(listadoFechaIso(undefined, '2026-10-01 09:00:00')).toBe('2026-10-01');
  });

  it('fechaHoy/MananaLocal calendario local', () => {
    expect(fechaHoyListadoLocal(hoy)).toBe('2026-10-18');
    expect(fechaMananaLocal(hoy)).toBe('2026-10-19');
    expect(fechaMananaLocal(new Date(2026, 9, 31, 23, 0, 0))).toBe('2026-11-01');
  });

  it('sin query → solo hoy y mañana (hoy primero)', () => {
    const out = filtrarListadoAgendaOBusqueda(filas, {
      now: hoy,
      getFechasIso: getFechas,
      coincideBusqueda: (f, q) => coincidenciaTextoListado([f.nombre], q),
    });
    expect(out.map((f) => f.nombre)).toEqual(['Luna', 'Max']);
  });

  it('extraHoy mete activas en Hoy aunque ingreso sea anterior', () => {
    const partes = partirListadoHoyManana(filas, getFechas, {
      now: hoy,
      extraHoy: (r) => !!(r as Fila).activa,
    });
    expect(partes.hoy.map((f) => f.nombre)).toEqual(['Luna', 'Activa']);
    expect(partes.manana.map((f) => f.nombre)).toEqual(['Max']);
  });

  it('prioridad Hoy si coincide hoy y mañana', () => {
    const dual: Fila[] = [{ id: 'd', fechas: ['2026-10-18', '2026-10-19'], nombre: 'Dual' }];
    const partes = partirListadoHoyManana(dual, getFechas, { now: hoy });
    expect(partes.hoy.map((f) => f.nombre)).toEqual(['Dual']);
    expect(partes.manana).toEqual([]);
  });

  it('filtrarFilasPorFechaIso', () => {
    expect(filtrarFilasPorFechaIso(filas, '2026-10-19', getFechas).map((f) => f.nombre)).toEqual(['Max']);
  });

  it('con query → historial', () => {
    expect(
      filtrarListadoAgendaOBusqueda(filas, {
        query: 'scooby',
        now: hoy,
        getFechasIso: getFechas,
        coincideBusqueda: (f, q) => coincidenciaTextoListado([f.nombre], q),
      }).map((f) => f.nombre)
    ).toEqual(['Scooby']);
  });

  it('metaListadoHoyManana copy', () => {
    expect(metaListadoHoyManana({ visiblesHoy: 3, visiblesManana: 1, totales: 189, query: '' })).toBe(
      'Hoy · 3 · Mañana · 1'
    );
    expect(metaListadoHoyManana({ visibles: 5, totales: 189, query: 'ana' })).toBe('Búsqueda · 5 de 189 históricos');
    expect(metaListadoHoyManana({ visibles: 0, totales: 0 })).toBe('');
  });
});

describe('listadoFechaIso con zona (2026-10-27)', () => {
  it('una cita 18:00 en Monterrey (00:00Z del día siguiente) cae en su día local', () => {
    const local = new Date(2026, 9, 28, 18, 0);
    const iso = local.toISOString();
    expect(listadoFechaIso(iso)).toBe('2026-10-28');
  });

  it('las fechas sin zona no cambian', () => {
    expect(listadoFechaIso('2026-10-28')).toBe('2026-10-28');
    expect(listadoFechaIso('2026-10-28T23:30')).toBe('2026-10-28');
  });
});
