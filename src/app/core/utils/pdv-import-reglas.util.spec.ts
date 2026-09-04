import { PDV_SAMPLE_ROWS } from './pdv-sample-rows';
import {
  assertPathsImportPdv,
  enriquecerFilaExtractPdv,
  mapearExtractoImportPdv,
  mapearFilaImportPdv,
  pathRtdbPermitidoPdv,
  stockImportadoPdv
} from './pdv-import-reglas.util';
import { clasificarSkuPdv } from './pdv-sku-clasificacion.util';

describe('pdv-import-reglas.util', () => {
  it('deny-list bloquea nodos de la app móvil', () => {
    expect(pathRtdbPermitidoPdv('Katzen/Inventario/Productos')).toBe(true);
    expect(pathRtdbPermitidoPdv('Katzen/ServiciosClinica')).toBe(true);
    expect(pathRtdbPermitidoPdv('Katzen/Producto/abc')).toBe(false);
    expect(pathRtdbPermitidoPdv('Katzen/Productos')).toBe(false);
    expect(() => assertPathsImportPdv(['Katzen/Producto/x'])).toThrowError(/Deny-list/);
  });

  it('stock: negativo → 0; baño/servicio/examen → 0 aunque el PDV tenga piezas', () => {
    expect(stockImportadoPdv(-3, 'anaquel')).toEqual({
      stock: 0,
      stockOrigen: -3,
      clampNegativo: true,
      forzarCero: false
    });
    expect(stockImportadoPdv(12, 'banho').stock).toBe(0);
    expect(stockImportadoPdv(4, 'uso_interno').stock).toBe(4);
  });

  it('enriquece DEPT 13 → UsoInterno', () => {
    const e = enriquecerFilaExtractPdv({
      codigo: '10256',
      descripcion: 'MI Solución HT 250ml',
      dept: 13,
      pventa: 35.91,
      pcosto: 35.91,
      existencia: 4
    });
    expect(e.departamento).toBe('UsoInterno');
    expect(clasificarSkuPdv(e).destino).toBe('uso_interno');
  });

  it('UI* / MI* y cirugía no van a anaquel', () => {
    expect(
      clasificarSkuPdv({
        codigo: 'ABANICOS',
        descripcion: 'UI Abánico De Techo',
        departamento: 'Equipo'
      }).destino
    ).toBe('uso_interno');
    expect(
      clasificarSkuPdv({
        codigo: 'CG01',
        descripcion: 'Cirugía Menor (Hasta 10 Puntos)',
        departamento: 'Consultorio'
      }).destino
    ).toBe('servicio');
    expect(
      clasificarSkuPdv({
        codigo: 'BHS',
        descripcion: 'Biometría Hemática (Sola)',
        departamento: 'Consultorio'
      }).destino
    ).toBe('examen');
  });

  it('PVENTA 100 → público 116; uso interno no visible en POS', () => {
    const vac = mapearFilaImportPdv({
      codigo: 'V003',
      descripcion: 'Vacuna Bordetella',
      departamento: 'Consultorio',
      pventa: 100,
      pcosto: 80,
      existencia: 12
    });
    expect(vac.producto.precio_venta).toBe(116);
    expect(vac.producto.iva_aplicable).toBe(true);
    expect(vac.visiblePos).toBe(true);

    const uso = mapearFilaImportPdv({
      codigo: 'USO001',
      descripcion: 'MI Gasas',
      departamento: 'UsoInterno',
      pventa: 15,
      pcosto: 15,
      existencia: 40
    });
    expect(uso.destino).toBe('uso_interno');
    expect(uso.visiblePos).toBe(false);
    expect(uso.producto.activo).toBe(false);
    expect(uso.stock).toBe(40);
  });

  it('BACO con stock -1 importa 0 y queda para enlazar baño', () => {
    const b = mapearFilaImportPdv({
      codigo: 'BACO001',
      descripcion: 'Baño Chico Pelo Corto',
      departamento: 'Grooming',
      pventa: 200,
      pcosto: 40,
      existencia: -1
    });
    expect(b.destino).toBe('banho');
    expect(b.stock).toBe(0);
    expect(b.clasificacion.enlazarBanio).toBe(true);
    expect(b.producto.precio_venta).toBe(232);
  });

  it('samples: N = exportadas y deny-list de paths', () => {
    const r = mapearExtractoImportPdv(PDV_SAMPLE_ROWS);
    expect(r.n).toBe(PDV_SAMPLE_ROWS.length);
    expect(r.porDestino.banho).toBe(1);
    expect(r.porDestino.uso_interno).toBe(1);
    expect(r.reportes.exclusionesPos.some((x) => x.codigo === 'USO001')).toBe(true);
    expect(() => assertPathsImportPdv(r.paths)).not.toThrow();
  });
});
