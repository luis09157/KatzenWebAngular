import { CLINICA_TELEFONO_DISPLAY_FALLBACK, resolveClinicaTelefono } from './portal-clinica-contacto.util';

describe('portal-clinica-contacto.util (074)', () => {
  it('usa el teléfono de landing si Config viene vacío', () => {
    const v = resolveClinicaTelefono(null);
    expect(v.display).toBe(CLINICA_TELEFONO_DISPLAY_FALLBACK);
    expect(v.telHref).toBe('tel:+528136024090');
  });

  it('normaliza un teléfono de Config si algún día es legible', () => {
    const v = resolveClinicaTelefono('81 3602 4090');
    expect(v.e164).toBe('+528136024090');
    expect(v.telHref).toBe('tel:+528136024090');
  });
});
