import {
  buildDescripcionRecordatorioRefuerzo,
  buildTituloRecordatorioRefuerzo,
  calcularProximaDesdeIntervalo,
  dayKeyLocal,
  debeAsegurarRecordatorioRefuerzo,
  encontrarRecordatorioEquivalente,
  parseFechaFlexible,
  resolverFechaRecordatorioRefuerzo
} from './vacuna-recordatorio.util';

describe('vacuna-recordatorio.util (033)', () => {
  it('parseFechaFlexible acepta ISO y Date', () => {
    expect(parseFechaFlexible('2026-09-15')).toBeTruthy();
    expect(parseFechaFlexible(new Date(2026, 8, 15))).toBeTruthy();
    expect(parseFechaFlexible('')).toBeNull();
    expect(parseFechaFlexible(null)).toBeNull();
  });

  it('calcularProximaDesdeIntervalo suma días', () => {
    const prox = calcularProximaDesdeIntervalo('2026-08-01', 365);
    expect(prox).toBeTruthy();
    expect(dayKeyLocal(prox!)).toBe('2027-08-01');
  });

  it('resolverFechaRecordatorioRefuerzo prioriza fechaRecordatorio', () => {
    const r = resolverFechaRecordatorioRefuerzo({
      fechaRecordatorio: '2026-09-10T08:30:00',
      proximaAplicacion: '2026-09-15',
      intervalo: 30,
      fechaAplicacion: '2026-08-15'
    });
    expect(r?.dayKey).toBe('2026-09-10');
    expect(r?.isoLocal).toContain('2026-09-10');
  });

  it('resolverFechaRecordatorioRefuerzo usa proxima a las 09:00', () => {
    const r = resolverFechaRecordatorioRefuerzo({
      proximaAplicacion: '2026-10-01'
    });
    expect(r?.dayKey).toBe('2026-10-01');
    expect(r?.isoLocal).toContain('09:00:00');
  });

  it('debeAsegurarRecordatorioRefuerzo false sin fechas', () => {
    expect(debeAsegurarRecordatorioRefuerzo({ vacuna: 'rabia' })).toBeFalse();
  });

  it('buildTitulo y descripcion en español', () => {
    const input = { vacuna: 'antirrabica', dosis: '1ml', nombreVacunaLabel: 'Antirrábica' };
    const fecha = resolverFechaRecordatorioRefuerzo({ proximaAplicacion: '2026-11-01' })!;
    expect(buildTituloRecordatorioRefuerzo(input)).toBe('Refuerzo vacuna: Antirrábica');
    expect(buildDescripcionRecordatorioRefuerzo(input, fecha)).toContain('refuerzo');
    expect(buildDescripcionRecordatorioRefuerzo(input, fecha)).toContain('1ml');
  });

  it('encontrarRecordatorioEquivalente por vacunaId', () => {
    const found = encontrarRecordatorioEquivalente(
      [
        {
          id: 'r1',
          paciente_id: 'p1',
          tipo: 'vacuna',
          estado: 'pendiente',
          activo: true,
          vacunaId: 'v1',
          fecha_hora_recordatorio: '2026-09-15 09:00:00',
          titulo: 'Refuerzo vacuna: Rabia'
        }
      ],
      { vacunaId: 'v1', pacienteId: 'p1', dayKey: '2026-09-15', titulo: 'Refuerzo vacuna: Rabia' }
    );
    expect(found?.id).toBe('r1');
  });

  it('encontrarRecordatorioEquivalente por paciente+día sin vacunaId', () => {
    const found = encontrarRecordatorioEquivalente(
      [
        {
          id: 'r2',
          paciente_id: 'p1',
          tipo: 'vacuna',
          estado: 'pendiente',
          activo: true,
          fecha_hora_recordatorio: '2026-09-15 09:00:00',
          titulo: 'Refuerzo vacuna: Quíntuple'
        }
      ],
      {
        pacienteId: 'p1',
        dayKey: '2026-09-15',
        titulo: 'Refuerzo vacuna: Quíntuple'
      }
    );
    expect(found?.id).toBe('r2');
  });

  it('ignora completados e inactivos', () => {
    const found = encontrarRecordatorioEquivalente(
      [
        {
          id: 'r3',
          paciente_id: 'p1',
          tipo: 'vacuna',
          estado: 'completado',
          activo: true,
          vacunaId: 'v1',
          fecha_hora_recordatorio: '2026-09-15 09:00:00',
          titulo: 'Refuerzo'
        }
      ],
      { vacunaId: 'v1', pacienteId: 'p1', dayKey: '2026-09-15', titulo: 'Refuerzo' }
    );
    expect(found).toBeNull();
  });
});
