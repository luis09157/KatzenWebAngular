import { mapBanio, mapCita, mapHistorial, mapVacuna } from './portal-mapper.util';
import { isCitaSolicitudUiVisible, PORTAL_CITA_SOLICITUD_ENABLED } from './portal-cita-solicitud.util';
import { buildCartillaEventos, buildMascotaActivityChips, splitCitasProximasPasadas } from './portal-cartilla.util';
import { isVisibleInClientPortal } from './portal-mapper.util';

describe('portal-cita-solicitud.util (074)', () => {
  it('oculta la solicitud de cita del dueño', () => {
    expect(PORTAL_CITA_SOLICITUD_ENABLED).toBeFalse();
    expect(isCitaSolicitudUiVisible()).toBeFalse();
  });
});

describe('portal-cartilla.util (074)', () => {
  it('incluye baño con fecha y tipo en la cartilla', () => {
    const banio = mapBanio('b1', {
      paciente_id: 'm1',
      fecha_banio: '2026-08-20',
      hora_banio: '11:00',
      tipo_servicio: 'baño_completo',
      estado: 'completado',
      peluquero: 'Ana',
    });
    const eventos = buildCartillaEventos({ banos: [banio as unknown as Record<string, unknown>] });
    expect(eventos.length).toBe(1);
    expect(eventos[0].kind).toBe('banio');
    expect(eventos[0].titulo).toBe('Baño completo');
    expect(eventos[0].fecha).toContain('2026-08-20');
  });

  it('no mete historial oculto_portal si el caller ya filtró', () => {
    const oculto = { oculto_portal: true, diagnostico: 'Secreto' };
    expect(isVisibleInClientPortal(oculto)).toBeFalse();
    const visible = mapHistorial('h1', {
      diagnostico: 'Otitis',
      fecha_registro: '2026-08-10',
      medico_atendio: 'Dra. Test',
    });
    const eventos = buildCartillaEventos({
      historiales: [visible as unknown as Record<string, unknown>],
    });
    expect(eventos.some((e) => e.titulo === 'Otitis')).toBeTrue();
    expect(JSON.stringify(eventos)).not.toContain('Secreto');
  });

  it('ordena cronológicamente (más reciente primero)', () => {
    const vacuna = mapVacuna('v1', {
      vacuna: 'Rabia',
      fechaAplicacion: '2026-07-01',
    });
    const banio = mapBanio('b1', {
      fecha_banio: '2026-08-20',
      tipo_servicio: 'baño_básico',
    });
    const eventos = buildCartillaEventos({
      vacunas: [vacuna as unknown as Record<string, unknown>],
      banos: [banio as unknown as Record<string, unknown>],
    });
    expect(eventos[0].kind).toBe('banio');
    expect(eventos[1].kind).toBe('vacuna');
  });

  it('chips: último baño, próxima vacuna y recordatorio', () => {
    const chips = buildMascotaActivityChips({
      now: new Date('2026-09-01T12:00:00').getTime(),
      banos: [
        mapBanio('b1', {
          fecha_banio: '2026-08-20',
          tipo_servicio: 'baño_completo',
          estado: 'completado',
        }) as unknown as Record<string, unknown>,
      ],
      vacunas: [
        mapVacuna('v1', {
          vacuna: 'Antirrábica',
          fechaAplicacion: '2025-08-26',
          proximaAplicacion: '2026-09-15',
        }) as unknown as Record<string, unknown>,
      ],
      recordatorios: [
        {
          id: 'r1',
          titulo: 'Refuerzo rabia',
          fecha: '2026-09-15',
          estado: 'pendiente',
        },
      ],
    });
    expect(chips.ultimoBanio).toContain('Baño completo');
    expect(chips.proximaVacuna).toContain('Antirrábica');
    expect(chips.recordatorio).toContain('Refuerzo rabia');
  });

  it('separa citas próximas y pasadas; no inventa solicitud', () => {
    const proxima = mapCita('c1', {
      motivo: 'Control',
      fecha_hora: '2026-10-01 10:00',
      estado: 'confirmada',
    });
    const pasada = mapCita('c2', {
      motivo: 'Vacuna',
      fecha_hora: '2026-01-10 09:00',
      estado: 'completada',
    });
    const split = splitCitasProximasPasadas([proxima, pasada], new Date('2026-09-01T12:00:00').getTime());
    expect(split.proximas.map((c) => c.id)).toEqual(['c1']);
    expect(split.pasadas.map((c) => c.id)).toEqual(['c2']);
    expect(isCitaSolicitudUiVisible()).toBeFalse();
  });
});
