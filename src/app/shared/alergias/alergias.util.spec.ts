import { normalizeAlergias } from './alergias.util';

describe('normalizeAlergias (spec 034)', () => {
  it('returns empty for null/undefined', () => {
    expect(normalizeAlergias(null)).toEqual([]);
    expect(normalizeAlergias(undefined)).toEqual([]);
  });

  it('normalizes string arrays', () => {
    expect(normalizeAlergias([' Penicilina ', 'shampoo', 'Penicilina'])).toEqual([
      'Penicilina',
      'shampoo'
    ]);
  });

  it('splits legacy texto', () => {
    expect(normalizeAlergias('Penicilina, shampoo común; polvo')).toEqual([
      'Penicilina',
      'shampoo común',
      'polvo'
    ]);
  });

  it('reads paciente-like object', () => {
    expect(
      normalizeAlergias({ alergias: ['A'], alergiasTexto: 'B, C' })
    ).toEqual(['A']);
    expect(normalizeAlergias({ alergiasTexto: 'X; Y' })).toEqual(['X', 'Y']);
  });
});
