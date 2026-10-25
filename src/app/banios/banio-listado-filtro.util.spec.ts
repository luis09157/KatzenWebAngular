import {
  banioFechaIso,
  banioListadoCoincideBusqueda,
  fechaMananaLocal,
  fechaLunesListadoBanios,
  filtrarBaniosListado,
  filtrarBaniosPorFechaIso,
  incluyeLunesEnAgendaBanios,
  metaBaniosListado,
  partirBaniosHoyManana,
} from './banio-listado-filtro.util';

describe('banio-listado-filtro.util (spec 085 B.1)', () => {
  const hoy = new Date(2026, 9, 18, 12, 0, 0); // 18 oct 2026 local
  const filas = [
    {
      fecha_banio_iso: '2026-10-18',
      fecha_banio: '18/10/2026',
      paciente: 'Luna',
      cliente: 'Ana Pérez',
      tipo_servicio: 'baño_básico',
      tipo_servicio_texto: 'Baño básico',
      estado: 'completado',
      peluquero: 'Luis',
    },
    {
      fecha_banio_iso: '2026-10-19',
      fecha_banio: '19/10/2026',
      paciente: 'Max',
      cliente: 'Beto',
      tipo_servicio: 'baño_completo',
      tipo_servicio_texto: 'Baño completo',
      estado: 'programado',
      peluquero: 'Luis',
    },
    {
      fecha_banio_iso: '2026-10-17',
      fecha_banio: '17/10/2026',
      paciente: 'Scooby',
      cliente: 'Carlos',
      tipo_servicio: 'corte_pelo',
      tipo_servicio_texto: 'Corte pelo',
      estado: 'completado',
      peluquero: 'María',
    },
    {
      fecha_banio_iso: '2024-03-31',
      fecha_banio: '31/03/2024',
      paciente: 'Arya',
      cliente: 'Ana Pérez',
      tipo_servicio: 'baño_completo',
      tipo_servicio_texto: 'Baño completo',
      estado: 'programado',
      peluquero: 'Luis',
    },
  ];

  it('banioFechaIso normaliza ISO y datetime', () => {
    expect(banioFechaIso('2026-10-18')).toBe('2026-10-18');
    expect(banioFechaIso('2026-10-18T15:00:00')).toBe('2026-10-18');
    expect(banioFechaIso(undefined, '2026-10-01 09:00:00')).toBe('2026-10-01');
  });

  it('fechaMananaLocal es el día siguiente en calendario local', () => {
    expect(fechaMananaLocal(hoy)).toBe('2026-10-19');
    expect(fechaMananaLocal(new Date(2026, 9, 31, 23, 0, 0))).toBe('2026-11-01');
  });

  it('sin query → solo baños de hoy y mañana (hoy primero)', () => {
    const out = filtrarBaniosListado(filas, { now: hoy });
    expect(out.map((f) => f.paciente)).toEqual(['Luna', 'Max']);
  });

  it('partirBaniosHoyManana separa secciones', () => {
    const partes = partirBaniosHoyManana(filas, { now: hoy });
    expect(partes.hoyIso).toBe('2026-10-18');
    expect(partes.mananaIso).toBe('2026-10-19');
    expect(partes.mostrarLunes).toBeFalse();
    expect(partes.lunes).toEqual([]);
    expect(partes.hoy.map((f) => f.paciente)).toEqual(['Luna']);
    expect(partes.manana.map((f) => f.paciente)).toEqual(['Max']);
  });

  it('viernes y sábado muestran el lunes; el domingo ya va en mañana', () => {
    const viernes = new Date(2026, 9, 16, 12, 0, 0);
    const sabado = new Date(2026, 9, 17, 12, 0, 0);
    const domingo = new Date(2026, 9, 18, 12, 0, 0);
    const jueves = new Date(2026, 9, 15, 12, 0, 0);

    expect(incluyeLunesEnAgendaBanios(viernes)).toBeTrue();
    expect(incluyeLunesEnAgendaBanios(sabado)).toBeTrue();
    expect(incluyeLunesEnAgendaBanios(domingo)).toBeFalse();
    expect(incluyeLunesEnAgendaBanios(jueves)).toBeFalse();
    expect(fechaLunesListadoBanios(viernes)).toBe('2026-10-19');
    expect(fechaLunesListadoBanios(sabado)).toBe('2026-10-19');
    expect(fechaLunesListadoBanios(domingo)).toBe('2026-10-19');

    const delViernes = partirBaniosHoyManana(filas, { now: viernes });
    expect(delViernes.manana.map((f) => f.paciente)).toEqual(['Scooby']);
    expect(delViernes.lunes.map((f) => f.paciente)).toEqual(['Max']);
    expect(filtrarBaniosListado(filas, { now: viernes }).map((f) => f.paciente)).toEqual(['Scooby', 'Max']);

    const delDomingo = partirBaniosHoyManana(filas, { now: domingo });
    expect(delDomingo.manana.map((f) => f.paciente)).toEqual(['Max']);
    expect(delDomingo.lunes).toEqual([]);
  });

  it('filtrarBaniosPorFechaIso filtra por ISO exacta', () => {
    expect(filtrarBaniosPorFechaIso(filas, '2026-10-19').map((f) => f.paciente)).toEqual(['Max']);
    expect(filtrarBaniosPorFechaIso(filas, '')).toEqual([]);
  });

  it('con query → historial por paciente / cliente / tipo / fecha', () => {
    expect(filtrarBaniosListado(filas, { query: 'scooby', now: hoy }).map((f) => f.paciente)).toEqual(['Scooby']);
    expect(filtrarBaniosListado(filas, { query: 'ana', now: hoy }).map((f) => f.paciente)).toEqual(['Luna', 'Arya']);
    expect(filtrarBaniosListado(filas, { query: 'corte', now: hoy }).map((f) => f.paciente)).toEqual(['Scooby']);
    expect(filtrarBaniosListado(filas, { query: '31/03/2024', now: hoy }).map((f) => f.paciente)).toEqual(['Arya']);
    expect(filtrarBaniosListado(filas, { query: '2024-03-31', now: hoy }).map((f) => f.paciente)).toEqual(['Arya']);
  });

  it('banioListadoCoincideBusqueda es case-insensitive', () => {
    expect(banioListadoCoincideBusqueda(filas[0], 'LUNA')).toBe(true);
    expect(banioListadoCoincideBusqueda(filas[0], 'zzz')).toBe(false);
  });

  it('metaBaniosListado copy Hoy+Mañana / Búsqueda', () => {
    expect(metaBaniosListado({ visiblesHoy: 3, visiblesManana: 1, totales: 189, query: '' })).toBe(
      'Hoy · 3 · Mañana · 1'
    );
    expect(metaBaniosListado({ visiblesHoy: 0, visiblesManana: 0, totales: 189, query: '' })).toBe(
      'Hoy · 0 · Mañana · 0'
    );
    expect(metaBaniosListado({ visibles: 5, totales: 189, query: 'ana' })).toBe('Búsqueda · 5 de 189 históricos');
    expect(metaBaniosListado({ visibles: 0, totales: 0 })).toBe('');
  });
});
