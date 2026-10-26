import {
  buildBaniosMapByDate,
  buildCalendarioMesDays,
  buildCitasMapByDate,
  citaFechaIsoKey,
  estanciaCubreDia,
  eventosAgendaDelDia,
  isoKeyFromLocalDate,
  labelDiaSeleccionado,
  resumenAgendaDia,
} from './dashboard-calendario.util';

describe('dashboard-calendario.util (072)', () => {
  it('citaFechaIsoKey toma fecha o fecha_hora', () => {
    expect(citaFechaIsoKey({ fecha: '2026-10-18' })).toBe('2026-10-18');
    expect(citaFechaIsoKey({ fecha_hora: '2026-10-19T15:00:00' })).toBe('2026-10-19');
    expect(citaFechaIsoKey({})).toBeNull();
  });

  it('buildCitasMapByDate agrupa activas y ordena por hora', () => {
    const map = buildCitasMapByDate([
      { fecha: '2026-10-18', hora: '11:00', activo: true },
      { fecha: '2026-10-18', hora: '09:00', activo: true },
      { fecha: '2026-10-18', hora: '10:00', activo: false },
      { fecha: '2026-10-19', hora: '08:00' },
    ]);
    expect(map['2026-10-18'].map((c) => c.hora)).toEqual(['09:00', '11:00']);
    expect(map['2026-10-19'].length).toBe(1);
  });

  it('buildCalendarioMesDays marca hoy y citas', () => {
    const anchor = new Date(2026, 9, 1); // octubre 2026
    const today = new Date(2026, 9, 18);
    const map = buildCitasMapByDate([{ fecha: '2026-10-18', hora: '10:00' }]);
    const days = buildCalendarioMesDays(anchor, map, today);
    const cell = days.find((d) => d.isoKey === '2026-10-18');
    expect(cell?.isToday).toBe(true);
    expect(cell?.hasCitas).toBe(true);
    expect(cell?.citas.length).toBe(1);
    expect(cell?.eventos.length).toBe(1);
    expect(cell?.eventos[0].tipo).toBe('cita');
    expect(days.every((d) => d.isCurrentMonth || !d.isoKey)).toBe(true);
  });

  it('isoKeyFromLocalDate y labelDiaSeleccionado', () => {
    expect(isoKeyFromLocalDate(new Date(2026, 9, 18))).toBe('2026-10-18');
    expect(labelDiaSeleccionado('2026-10-18', '2026-10-18')).toBe('Agenda de hoy');
    expect(labelDiaSeleccionado(null, '2026-10-18')).toBe('Selecciona un día');
    expect(labelDiaSeleccionado('2026-10-20', '2026-10-18')).toContain('20');
  });

  it('buildBaniosMapByDate usa fecha_banio y omite inactivos o cancelados', () => {
    const map = buildBaniosMapByDate([
      { fecha_banio: '2026-10-25', hora_banio: '11:00', paciente: 'Luna' },
      { fecha_banio: '2026-10-25T09:30:00', hora_banio: '09:30', activo: true },
      { fecha_banio: '2026-10-25', estado: 'cancelado' },
      { fecha_banio: '2026-10-26', activo: false },
      { hora_banio: '08:00' },
    ]);
    expect(map['2026-10-25'].map((b) => b.hora_banio)).toEqual(['09:30', '11:00']);
    expect(map['2026-10-26']).toBeUndefined();
  });

  it('estanciaCubreDia respeta el rango y no sale de él', () => {
    const estancia = {
      id: 'e1',
      estado: 'finalizada',
      fecha_ingreso: '2026-10-18',
      fecha_salida_prevista: '2026-10-20',
    };
    expect(estanciaCubreDia(estancia, '2026-10-17')).toBe(false);
    expect(estanciaCubreDia(estancia, '2026-10-18')).toBe(true);
    expect(estanciaCubreDia(estancia, '2026-10-20')).toBe(true);
    expect(estanciaCubreDia(estancia, '2026-10-21')).toBe(false);
    expect(estanciaCubreDia({ ...estancia, activo: false }, '2026-10-18')).toBe(false);
    expect(estanciaCubreDia({ ...estancia, estado: 'cancelada' }, '2026-10-19')).toBe(false);
    expect(
      estanciaCubreDia({ id: 'abierta', estado: 'activa', fecha_ingreso: '2026-10-01' }, '2026-11-02')
    ).toBe(true);
  });

  it('el día cuenta citas, peluquería y pensión sin duplicar la estancia', () => {
    const anchor = new Date(2026, 9, 1);
    const citasMap = buildCitasMapByDate([{ id: 'c1', fecha: '2026-10-18', hora: '15:00', paciente: 'Sol' }]);
    const baniosMap = buildBaniosMapByDate([
      { id: 'b1', fecha_banio: '2026-10-18', hora_banio: '09:00', paciente: 'Luna' },
    ]);
    const estancias = [
      {
        id: 'e1',
        estado: 'activa',
        fecha_ingreso: '2026-10-18',
        fecha_salida_prevista: '2026-10-18',
        paciente: 'Mora',
      },
      {
        id: 'e1',
        estado: 'activa',
        fecha_ingreso: '2026-10-18',
        fecha_salida_prevista: '2026-10-18',
        paciente: 'Mora',
      },
    ];
    const days = buildCalendarioMesDays(anchor, citasMap, new Date(2026, 9, 1), { baniosMap, estancias });
    const cell = days.find((d) => d.isoKey === '2026-10-18');
    const fuera = days.find((d) => d.isoKey === '2026-10-19');
    expect(cell?.eventos.map((e) => e.tipo)).toEqual(['peluqueria', 'cita', 'pension']);
    expect(cell?.hasCitas).toBe(true);
    expect(cell?.eventos.filter((e) => e.tipo === 'pension').length).toBe(1);
    expect(fuera?.eventos.length).toBe(0);
    expect(fuera?.hasCitas).toBe(false);
    const solo = eventosAgendaDelDia('2026-10-18', [], [], estancias);
    expect(solo.length).toBe(1);
  });

  it('el evento trae servicio, estado y rango para el modal del día', () => {
    const [banio] = eventosAgendaDelDia('2026-10-18', [], [
      { id: 'b1', fecha_banio: '2026-10-18', hora_banio: '09:00', tipo_servicio: 'baño_con_corte', estado: 'pendiente' },
    ], []);
    expect(banio.servicio).toBe('baño_con_corte');
    expect(banio.estado).toBe('pendiente');

    const [conSalida] = eventosAgendaDelDia('2026-10-19', [], [], [
      { id: 'e1', estado: 'activa', fecha_ingreso: '2026-10-18', fecha_salida_prevista: '2026-10-20' },
    ]);
    expect(conSalida.desde).toBe('2026-10-18');
    expect(conSalida.hasta).toBe('2026-10-20');

    const [sinSalida] = eventosAgendaDelDia('2026-11-02', [], [], [
      { id: 'e2', estado: 'activa', fecha_ingreso: '2026-10-18' },
    ]);
    expect(sinSalida.desde).toBe('2026-10-18');
    expect(sinSalida.hasta).toBeUndefined();
  });

  it('resumenAgendaDia cuenta por tipo', () => {
    expect(resumenAgendaDia([])).toBe('Nada en agenda este día');
    expect(
      resumenAgendaDia([{ tipo: 'cita' }, { tipo: 'cita' }, { tipo: 'peluqueria' }, { tipo: 'pension' }])
    ).toBe('2 citas · 1 peluquería · 1 en pensión');
    expect(resumenAgendaDia([{ tipo: 'cita' }])).toBe('1 cita');
  });
});
