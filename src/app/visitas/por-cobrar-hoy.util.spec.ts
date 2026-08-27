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
          activo: true
        }
      ],
      banios: [],
      citas: [],
      pensiones: [],
      vacunas: [],
      historiales: []
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
          visitaId: 'vis-1'
        }
      ],
      citas: [],
      pensiones: [],
      vacunas: [],
      historiales: []
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
          precio: 450
        }
      ],
      pensiones: [],
      vacunas: [],
      historiales: []
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
          precio: 180
        }
      ],
      historiales: [],
      pacientesClienteMap: { p1: { cliente_id: 'c1', nombre: 'Firulais' } }
    });
    expect(items.some((i) => i.tipo === 'vacuna' && i.monto === 180)).toBe(true);
  });

  it('incluye historial de hoy sin ticket', () => {
    const items = buildPorCobrarHoy({
      hoy,
      visitas: [],
      banios: [],
      citas: [],
      pensiones: [],
      vacunas: [],
      historiales: [
        {
          id: 'h1',
          cliente_id: 'c1',
          paciente_id: 'p1',
          fecha_registro: `${hoy} 09:00:00`,
          diagnostico_presuntivo: 'Otitis'
        }
      ]
    });
    expect(items.some((i) => i.tipo === 'historial')).toBe(true);
  });
});
