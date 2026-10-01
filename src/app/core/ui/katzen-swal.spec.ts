import { KatzenSwal, KATZEN_SWAL_CONFIRM, KATZEN_SWAL_CANCEL, KATZEN_SWAL_DANGER } from './katzen-swal';

describe('katzen-swal (084)', () => {
  it('exporta colores de marca y mixin usable', () => {
    expect(KATZEN_SWAL_CONFIRM).toBe('#0A969B');
    expect(KATZEN_SWAL_CANCEL).toBe('#64748b');
    expect(KATZEN_SWAL_DANGER).toBe('#b91c1c');
    expect(typeof KatzenSwal.fire).toBe('function');
  });
});
