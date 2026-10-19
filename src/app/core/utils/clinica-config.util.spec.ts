import {
  CLINICA_NOMBRE_DEFAULT,
  clampIvaPct,
  nombreClinicaVisible,
  normalizeClinicaConfig,
  payloadClinicaParaGuardar,
} from './clinica-config.util';

describe('clinica-config.util (072)', () => {
  it('vacío usa KatzenVet e IVA 0', () => {
    const n = normalizeClinicaConfig(null);
    expect(n.nombre).toBe(CLINICA_NOMBRE_DEFAULT);
    expect(n.ivaDefaultPct).toBe(0);
    expect(n.logoUrl).toBe('');
  });

  it('recorta nombre y acota IVA', () => {
    expect(clampIvaPct(16.4)).toBe(16.4);
    expect(clampIvaPct(-5)).toBe(0);
    expect(clampIvaPct(140)).toBe(100);
    expect(nombreClinicaVisible({ nombre: '  Clínica Sur  ' })).toBe('Clínica Sur');
  });

  it('payload omite opcionales vacíos (sin undefined en el objeto)', () => {
    const p = payloadClinicaParaGuardar(
      { nombre: 'Katzen', logoUrl: '', horario: '', vetDefaultUid: 'v1', vetDefaultNombre: 'Dra. X' },
      'uid-1'
    );
    expect(p.nombre).toBe('Katzen');
    expect('logoUrl' in p).toBe(false);
    expect('horario' in p).toBe(false);
    expect(p.vetDefaultUid).toBe('v1');
    expect(p.vetDefaultNombre).toBe('Dra. X');
    expect(p.updatedBy).toBe('uid-1');
    expect(p.updatedAt).toBeTruthy();
    expect(Object.values(p).some((v) => v === undefined)).toBe(false);
  });

  it('payload sin staffId no incluye updatedBy', () => {
    const p = payloadClinicaParaGuardar({ nombre: 'Katzen' });
    expect('updatedBy' in p).toBe(false);
    expect(Object.values(p).some((v) => v === undefined)).toBe(false);
  });
});
