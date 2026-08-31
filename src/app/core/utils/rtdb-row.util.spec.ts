import { mapRtdbRow, collectRelatedIds, registroPerteneceAPaciente } from './rtdb-row.util';

describe('rtdb-row.util', () => {
  it('la key RTDB gana sobre un id interno distinto', () => {
    const row = mapRtdbRow('push-key-1', { id: 'uuid-movil', nombre: 'Oreon' });
    expect(row.id).toBe('push-key-1');
    expect((row as { idLegacy?: string }).idLegacy).toBe('uuid-movil');
    expect((row as { nombre?: string }).nombre).toBe('Oreon');
  });

  it('no inventa idLegacy si id coincide con la key', () => {
    const row = mapRtdbRow('abc', { id: 'abc', nombre: 'Luna' });
    expect(row.id).toBe('abc');
    expect((row as { idLegacy?: string }).idLegacy).toBeUndefined();
  });

  it('collectRelatedIds incluye key e idLegacy', () => {
    const row = mapRtdbRow('k1', { id: 'legacy-1', idPaciente: 'k1' });
    expect(collectRelatedIds(row as Record<string, unknown>, ['idPaciente'])).toEqual(['k1', 'legacy-1']);
  });

  it('registroPerteneceAPaciente acepta paciente_id o idPaciente', () => {
    expect(registroPerteneceAPaciente({ paciente_id: 'p1' }, 'p1')).toBeTrue();
    expect(registroPerteneceAPaciente({ idPaciente: 'p1' }, ['p1', 'p2'])).toBeTrue();
    expect(registroPerteneceAPaciente({ paciente_id: 'x' }, 'p1')).toBeFalse();
  });
});
