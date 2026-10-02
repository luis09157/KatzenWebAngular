import {
  clinicoYaEnLineas,
  descripcionLineaClinico,
  esHistorialPendienteDeTicket,
  esVacunaAplicada,
  esVacunaPendienteDeTicket,
  filtrarHistorialesPendientesTicket,
  filtrarVacunasPendientesTicket,
  historialYaEnLineas,
  vacunaYaEnLineas,
  vincularClinicosHuerfanosEnLineas,
} from './pendientes-clinicos.util';

describe('pendientes-clinicos.util (spec 086)', () => {
  const hoy = '2026-10-02';

  it('vacuna: solo aplicadas sin visitaId', () => {
    expect(
      esVacunaPendienteDeTicket({
        id: 'v1',
        estado: 'aplicada',
        precio: 100,
      })
    ).toBe(true);
    expect(esVacunaAplicada({ aplicada: true })).toBe(true);
    expect(esVacunaPendienteDeTicket({ id: 'v1', estado: 'programada' })).toBe(false);
    expect(esVacunaPendienteDeTicket({ id: 'v1', estado: 'aplicada', visitaId: 'vis' })).toBe(false);
  });

  it('historial: excluye ticket / caja / cobrada', () => {
    expect(esHistorialPendienteDeTicket({ id: 'h1' })).toBe(true);
    expect(esHistorialPendienteDeTicket({ id: 'h1', visitaId: 'v' })).toBe(false);
    expect(esHistorialPendienteDeTicket({ id: 'h1', cobradaEnVisitaId: 'v' })).toBe(false);
  });

  it('filtra vacunas por cliente/fecha/paciente', () => {
    const r = filtrarVacunasPendientesTicket(
      [
        {
          id: 'vac1',
          estado: 'aplicada',
          cliente_id: 'c1',
          paciente_id: 'p1',
          fecha_vacuna: hoy,
          tipo_vacuna: 'rabia',
          precio: 250,
          paciente: 'Oreon',
        },
        {
          id: 'vac2',
          estado: 'aplicada',
          cliente_id: 'c2',
          paciente_id: 'p2',
          fecha_vacuna: hoy,
          precio: 100,
        },
        {
          id: 'vac3',
          estado: 'aplicada',
          cliente_id: 'c1',
          paciente_id: 'p1',
          fecha_vacuna: '2026-09-01',
          precio: 100,
        },
      ],
      { clienteId: 'c1', fecha: hoy, pacienteId: 'p1' }
    );
    expect(r.length).toBe(1);
    expect(r[0].id).toBe('vac1');
    expect(r[0].detalle).toContain('Vacuna');
  });

  it('filtra historiales por cliente/fecha', () => {
    const r = filtrarHistorialesPendientesTicket(
      [
        {
          id: 'h1',
          cliente_id: 'c1',
          paciente_id: 'p1',
          paciente: 'Oreon',
          fecha_registro: hoy,
          diagnostico_presuntivo: 'Otitis',
        },
        {
          id: 'h2',
          cliente_id: 'c1',
          fecha_registro: hoy,
          visitaId: 'ya',
        },
      ],
      { clienteId: 'c1', fecha: hoy }
    );
    expect(r.map((x) => x.id)).toEqual(['h1']);
    expect(r[0].detalle).toContain('Consulta');
  });

  it('yaEnLineas y descripcion', () => {
    expect(vacunaYaEnLineas([{ id: 'l', descripcion: 'x', monto: 1, categoria: 'vacuna', vacunaId: 'v1' }], 'v1')).toBe(
      true
    );
    expect(
      historialYaEnLineas([{ id: 'l', descripcion: 'x', monto: 1, categoria: 'consulta', historialId: 'h1' }], 'h1')
    ).toBe(true);
    expect(
      clinicoYaEnLineas([], {
        id: 'v1',
        tipo: 'vacuna',
        cliente_id: 'c1',
        fecha: hoy,
        montoSugerido: 0,
        titulo: 'Oreon',
      })
    ).toBe(false);
    expect(
      descripcionLineaClinico({
        id: 'v1',
        tipo: 'vacuna',
        cliente_id: 'c1',
        fecha: hoy,
        montoSugerido: 0,
        titulo: 'Oreon',
        detalle: 'Vacuna · rabia',
      })
    ).toContain('rabia');
  });

  it('vincularClinicosHuerfanosEnLineas por precio o único', () => {
    const pendientes = [
      {
        id: 'vac1',
        tipo: 'vacuna' as const,
        cliente_id: 'c1',
        fecha: hoy,
        montoSugerido: 200,
        titulo: 'Oreon',
      },
      {
        id: 'h1',
        tipo: 'historial' as const,
        cliente_id: 'c1',
        fecha: hoy,
        montoSugerido: 350,
        titulo: 'Oreon',
      },
    ];
    const linked = vincularClinicosHuerfanosEnLineas(
      [
        { id: 'l1', descripcion: 'Vacuna', monto: 200, categoria: 'vacuna' },
        { id: 'l2', descripcion: 'Consulta', monto: 350, categoria: 'consulta' },
      ],
      pendientes
    );
    expect(linked[0].vacunaId).toBe('vac1');
    expect(linked[1].historialId).toBe('h1');
  });
});
