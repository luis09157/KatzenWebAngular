import {
  filaTarifaPara,
  hayTarifasPeluqueria,
  normalizarTarifasPeluqueria,
  precioTarifaPeluqueria,
} from './tarifas-peluqueria.util';

describe('tarifas-peluqueria.util (2026-10-26)', () => {
  const tarifas = normalizarTarifasPeluqueria({
    filas: {
      pequeno: { corto: 200, largo: 250, conCorte: 280 },
      xl: { corto: '350', largo: 0 },
      gato: { corto: 200, largo: 300, conCorte: 999 },
    },
  });

  it('limpia: solo números > 0 y el gato no tiene «con corte»', () => {
    expect(tarifas.filas.xl).toEqual({ corto: 350 });
    expect(tarifas.filas.gato).toEqual({ corto: 200, largo: 300 });
    expect(hayTarifasPeluqueria(tarifas)).toBeTrue();
    expect(hayTarifasPeluqueria(normalizarTarifasPeluqueria(null))).toBeFalse();
  });

  it('gato por especie; perro por tamaño', () => {
    expect(filaTarifaPara('grande', 'FELINO')).toBe('gato');
    expect(filaTarifaPara('chico', 'CANINO')).toBe('pequeno');
    expect(filaTarifaPara('gigante', 'CANINO')).toBe('xl');
    expect(filaTarifaPara('', 'CANINO')).toBeNull();
  });

  it('precio según servicio y pelo', () => {
    expect(precioTarifaPeluqueria(tarifas, { fila: 'pequeno', tipoServicio: 'baño', pelo: 'corto' })).toBe(200);
    expect(precioTarifaPeluqueria(tarifas, { fila: 'pequeno', tipoServicio: 'baño', pelo: 'largo' })).toBe(250);
    expect(precioTarifaPeluqueria(tarifas, { fila: 'pequeno', tipoServicio: 'baño_con_corte', pelo: null })).toBe(280);
    expect(precioTarifaPeluqueria(tarifas, { fila: 'xl', tipoServicio: 'baño', pelo: 'largo' })).toBeNull();
    expect(precioTarifaPeluqueria(tarifas, { fila: 'pequeno', tipoServicio: 'corte_uñas', pelo: 'corto' })).toBeNull();
  });
});
