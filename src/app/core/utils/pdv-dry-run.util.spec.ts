import { PDV_SAMPLE_ROWS } from './pdv-sample-rows';
import { conteoVsExportadas, dryRunExtractPdv } from './pdv-dry-run.util';

describe('pdv-dry-run.util', () => {
  it('gate COUNT vs filas exportadas', () => {
    expect(conteoVsExportadas(13, PDV_SAMPLE_ROWS.length)).toBe(true);
    expect(conteoVsExportadas(700, 699)).toBe(false);
  });

  it('detecta duplicados, costo≥neta, kits huérfanos y clasificación', () => {
    const r = dryRunExtractPdv(PDV_SAMPLE_ROWS);
    expect(r.totalFilas).toBe(PDV_SAMPLE_ROWS.length);
    expect(r.porDestino.banho).toBe(1);
    expect(r.porDestino.vacuna).toBe(1);
    expect(r.porDestino.examen).toBe(1);
    expect(r.porDestino.servicio).toBe(1);
    expect(r.porDestino.kit).toBeGreaterThanOrEqual(2);
    expect(r.porDestino.uso_interno).toBe(1);
    expect(r.porDestino.anaquel).toBeGreaterThanOrEqual(4);

    const tipos = r.excepciones.map((e) => e.tipo);
    expect(tipos).toContain('duplicado_codigo');
    expect(tipos).toContain('costo_ge_neta');
    expect(tipos).toContain('kit_huerfano');
    expect(tipos).toContain('iva_vs_exento_sugerido');
    expect(r.excepciones.find((e) => e.codigo === 'DUP001')).toBeTruthy();
    expect(r.excepciones.find((e) => e.codigo === 'BAD001' && e.tipo === 'costo_ge_neta')).toBeTruthy();
    expect(r.excepciones.find((e) => e.codigo === 'PAQ099' && e.tipo === 'kit_huerfano')).toBeTruthy();
  });

  it('stock negativo se reporta', () => {
    const r = dryRunExtractPdv([
      {
        codigo: 'NEG1',
        descripcion: 'Negativo',
        departamento: 'Petshop',
        pfinal: 10,
        pcosto: 1,
        existencia: -3
      }
    ]);
    expect(r.excepciones.some((e) => e.tipo === 'stock_negativo')).toBe(true);
  });
});
