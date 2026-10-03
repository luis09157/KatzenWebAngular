import {
  paquetesPensionOficiales,
  precioDiaPensionEfectivo,
  sugerirTamanoPensionPorPeso,
  tarifaOficialPensionDia,
  TARIFAS_PENSION_OFICIALES_DIA,
} from './pension-tarifas.util';

describe('pension-tarifas.util (089)', () => {
  it('expone tarifas oficiales del día (4 paquetes)', () => {
    expect(TARIFAS_PENSION_OFICIALES_DIA.pequeno).toBe(250);
    expect(TARIFAS_PENSION_OFICIALES_DIA.mediano).toBe(300);
    expect(TARIFAS_PENSION_OFICIALES_DIA.grande).toBe(400);
    expect(TARIFAS_PENSION_OFICIALES_DIA.gigante).toBe(500);
  });

  it('paquetesPensionOficiales lista 4 opciones con precio', () => {
    const packs = paquetesPensionOficiales();
    expect(packs.length).toBe(4);
    expect(packs.map((p) => p.tamano)).toEqual(['pequeno', 'mediano', 'grande', 'gigante']);
    expect(packs[3].precioDia).toBe(500);
  });

  it('tarifaOficialPensionDia resuelve tamaños conocidos', () => {
    expect(tarifaOficialPensionDia('mediano')).toBe(300);
    expect(tarifaOficialPensionDia('gigante')).toBe(500);
    expect(tarifaOficialPensionDia('otro')).toBeNull();
  });

  it('precioDiaPensionEfectivo respeta override > 0 y cae a oficial si 0', () => {
    expect(precioDiaPensionEfectivo('pequeno', 0)).toBe(250);
    expect(precioDiaPensionEfectivo('pequeno', null)).toBe(250);
    expect(precioDiaPensionEfectivo('grande', 450)).toBe(450);
  });

  it('sugerirTamanoPensionPorPeso usa rangos Eleventa', () => {
    expect(sugerirTamanoPensionPorPeso(8)).toBe('pequeno');
    expect(sugerirTamanoPensionPorPeso(12)).toBe('mediano');
    expect(sugerirTamanoPensionPorPeso(20)).toBe('grande');
    expect(sugerirTamanoPensionPorPeso(35)).toBe('gigante');
    expect(sugerirTamanoPensionPorPeso(0)).toBe('');
  });
});
