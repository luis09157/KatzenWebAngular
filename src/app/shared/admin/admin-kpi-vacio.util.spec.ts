import { esValorCero, resumenKpiVacio } from './admin-kpi-vacio.util';

describe('admin-kpi-vacio.util', () => {
  it('reconoce ceros en número o texto', () => {
    expect(esValorCero(0)).toBeTrue();
    expect(esValorCero('0')).toBeTrue();
    expect(esValorCero('$0.00')).toBeTrue();
    expect(esValorCero('')).toBeTrue();
    expect(esValorCero(null)).toBeTrue();
    expect(esValorCero(3)).toBeFalse();
    expect(esValorCero('$1,200.00')).toBeFalse();
    expect(esValorCero('—')).toBeFalse();
  });

  it('oculta solo si todas están en cero y ninguna es filtro', () => {
    expect(resumenKpiVacio([{ value: 0 }, { value: '0' }])).toBeTrue();
    expect(resumenKpiVacio([{ value: 0 }, { value: 2 }])).toBeFalse();
    expect(resumenKpiVacio([{ value: 0, clickable: true }, { value: 0 }])).toBeFalse();
    expect(resumenKpiVacio([])).toBeFalse();
  });
});
