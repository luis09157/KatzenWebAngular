import { VisitaDiaCitaContext, VisitaDiaFlujoAccion, puedeOfrecerFlujoVisitaDia } from './visita-dia-flujo.models';

describe('visita-dia-flujo.models (spec 041)', () => {
  const base: VisitaDiaCitaContext = {
    id: 'c1',
    cliente_id: 'cli1',
    paciente_id: 'pac1',
    motivo: 'Consulta general'
  };

  it('permite flujo con cliente y paciente sin cobro previo', () => {
    expect(puedeOfrecerFlujoVisitaDia(base)).toBe(true);
  });

  it('bloquea si ya tiene visitaId', () => {
    expect(puedeOfrecerFlujoVisitaDia({ ...base, visitaId: 'vis-1' })).toBe(false);
  });

  it('bloquea sin cliente_id', () => {
    expect(puedeOfrecerFlujoVisitaDia({ ...base, cliente_id: '' })).toBe(false);
  });

  it('tipos de acción definidos', () => {
    const acciones: VisitaDiaFlujoAccion[] = ['historial', 'ticket', 'historial_ticket', 'omitir'];
    expect(acciones.length).toBe(4);
  });
});
