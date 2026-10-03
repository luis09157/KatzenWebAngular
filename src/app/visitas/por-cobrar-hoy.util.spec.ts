import { buildPorCobrarHoy, totalPorCobrarHoy } from './por-cobrar-hoy.util';

describe('por-cobrar-hoy.util (spec 040)', () => {
  const hoy = '2026-08-26';

  it('incluye ticket abierto hoy con saldo', () => {
    const items = buildPorCobrarHoy({
      hoy,
      visitas: [
        {
          id: 'v1',
          cliente_id: 'c1',
          cliente: 'Ana',
          fecha: hoy,
          saldo: 300,
          estado: 'parcial',
          activo: true,
        },
      ],
      banios: [],
      citas: [],
      pensiones: [],
      vacunas: [],
      historiales: [],
    });
    expect(items.some((i) => i.tipo === 'visita' && i.accion === 'abrir_ticket')).toBe(true);
  });

  it('excluye baño ya en visitaId', () => {
    const items = buildPorCobrarHoy({
      hoy,
      visitas: [],
      banios: [
        {
          id: 'b1',
          cliente_id: 'c1',
          fecha_banio: hoy,
          precio_total: 200,
          estado: 'completado',
          visitaId: 'vis-1',
        },
      ],
      citas: [],
      pensiones: [],
      vacunas: [],
      historiales: [],
    });
    expect(items.length).toBe(0);
  });

  it('incluye cita completada hoy sin ticket', () => {
    const items = buildPorCobrarHoy({
      hoy,
      visitas: [],
      banios: [],
      citas: [
        {
          id: 'cit1',
          cliente_id: 'c1',
          fecha_hora: `${hoy}T10:00:00`,
          estado: 'completada',
          precio: 450,
        },
      ],
      pensiones: [],
      vacunas: [],
      historiales: [],
    });
    expect(items.some((i) => i.tipo === 'cita')).toBe(true);
    expect(totalPorCobrarHoy(items)).toBe(450);
  });

  it('incluye vacuna aplicada hoy vía mapa paciente→cliente', () => {
    const items = buildPorCobrarHoy({
      hoy,
      visitas: [],
      banios: [],
      citas: [],
      pensiones: [],
      vacunas: [
        {
          id: 'vac1',
          paciente_id: 'p1',
          fecha_vacuna: hoy,
          tipo_vacuna: 'antirrabica',
          estado: 'aplicada',
          precio: 180,
        },
      ],
      historiales: [],
      pacientesClienteMap: { p1: { cliente_id: 'c1', nombre: 'Firulais' } },
    });
    expect(items.some((i) => i.tipo === 'vacuna' && i.monto === 180)).toBe(true);
  });

  it('085: programado NO ensucia cola; completado con nota SÍ', () => {
    const items = buildPorCobrarHoy({
      hoy,
      visitas: [],
      banios: [
        {
          id: 'b-prog',
          cliente_id: 'c1',
          fecha_banio: hoy,
          precio_total: 350,
          estado: 'programado',
          observaciones: 'Irritación',
        },
        {
          id: 'b-ok',
          cliente_id: 'c1',
          paciente: 'Michi',
          fecha_banio: hoy,
          precio_total: 350,
          estado: 'completado',
          observaciones: 'Irritación en panza; sugerir shampoo',
        },
      ],
      citas: [],
      pensiones: [],
      vacunas: [],
      historiales: [],
    });
    expect(items.some((i) => i.id === 'b-prog')).toBe(false);
    const banio = items.find((i) => i.id === 'b-ok');
    expect(banio).toBeTruthy();
    expect(banio!.monto).toBe(350);
    expect(banio!.nota).toContain('Irritación');
  });

  it('excluye baño sin precio', () => {
    const items = buildPorCobrarHoy({
      hoy,
      visitas: [],
      banios: [
        {
          id: 'b0',
          cliente_id: 'c1',
          fecha_banio: hoy,
          precio_total: 0,
          estado: 'completado',
        },
      ],
      citas: [],
      pensiones: [],
      vacunas: [],
      historiales: [],
    });
    expect(items.some((i) => i.tipo === 'banio')).toBe(false);
  });

  it('089 F2: pensión activa hoy describe paquete (no baño/corte)', () => {
    const items = buildPorCobrarHoy({
      hoy,
      visitas: [],
      banios: [],
      citas: [],
      pensiones: [
        {
          id: 'pen1',
          cliente_id: 'c1',
          paciente: 'Oreon',
          fecha_ingreso: hoy,
          precio_total: 600,
          precio_dia: 300,
          tamano_mascota: 'mediano',
          estado: 'activa',
          activo: true,
        },
      ],
      vacunas: [],
      historiales: [],
    });
    const pen = items.find((i) => i.tipo === 'pension');
    expect(pen).toBeTruthy();
    expect(pen!.descripcion).toContain('Mediano');
    expect(pen!.descripcion.toLowerCase()).not.toContain('corte');
    expect(pen!.monto).toBe(600);
  });
});
