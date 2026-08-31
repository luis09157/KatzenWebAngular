import { FormBuilder, Validators } from '@angular/forms';
import {
  calcularMargenPorcentaje,
  calcularVentaDesdeMargen,
  costoMenorQueVentaValidator,
  desglosarPrecioIvaIncluido,
  esVentaMayorQueCosto,
  precioConIva,
  snapshotEconomiaLinea,
  sugerirIvaPorCategoria,
  ventaMayorQueCostoValidator
} from './precio-margen.util';

describe('precio-margen.util', () => {
  describe('esVentaMayorQueCosto', () => {
    it('acepta costo vacío si allowEmptyCosto', () => {
      expect(esVentaMayorQueCosto(null, 200)).toBe(true);
      expect(esVentaMayorQueCosto('', 200)).toBe(true);
    });

    it('acepta venta > costo', () => {
      expect(esVentaMayorQueCosto(120, 450)).toBe(true);
      expect(esVentaMayorQueCosto(0, 100)).toBe(true);
    });

    it('con treatZeroAsEmpty trata costo 0 como opcional', () => {
      expect(esVentaMayorQueCosto(0, 230, { treatZeroAsEmpty: true })).toBe(true);
      expect(esVentaMayorQueCosto(0, 0, { treatZeroAsEmpty: true })).toBe(true);
      expect(esVentaMayorQueCosto(150, 200, { treatZeroAsEmpty: true })).toBe(true);
    });

    it('rechaza venta = costo y venta < costo', () => {
      expect(esVentaMayorQueCosto(200, 200)).toBe(false);
      expect(esVentaMayorQueCosto(0, 0)).toBe(false);
      expect(esVentaMayorQueCosto(250, 200)).toBe(false);
    });

    it('con allowEmptyCosto false trata null como inválido vs venta', () => {
      // Number(null) === 0 → venta 200 > 0 OK
      expect(esVentaMayorQueCosto(null, 200, { allowEmptyCosto: false })).toBe(true);
      expect(esVentaMayorQueCosto(100, 100, { allowEmptyCosto: false })).toBe(false);
    });
  });

  describe('margen %', () => {
    it('calcula margen desde costo y venta', () => {
      expect(calcularMargenPorcentaje(100, 200)).toBe(100);
      expect(calcularMargenPorcentaje(50, 80)).toBe(60);
    });

    it('calcula venta desde margen', () => {
      expect(calcularVentaDesdeMargen(100, 100)).toBe(200);
      expect(calcularVentaDesdeMargen(50, 60)).toBe(80);
    });
  });

  describe('validators FormGroup', () => {
    const fb = new FormBuilder();

    it('producto: bloquea costo = venta', () => {
      const form = fb.group({
        precio_compra: [200, Validators.required],
        precio_venta: [200, [Validators.required, ventaMayorQueCostoValidator('precio_compra')]]
      });
      form.get('precio_venta')?.updateValueAndValidity();
      expect(form.get('precio_venta')?.hasError('costoMayorOIgualVenta')).toBe(true);
    });

    it('baño: bloquea costo ≥ venta; vacío OK', () => {
      const form = fb.group({
        precio_total: [200],
        costoEstimado: [null as number | null, [costoMenorQueVentaValidator('precio_total')]]
      });
      form.get('costoEstimado')?.updateValueAndValidity();
      expect(form.get('costoEstimado')?.valid).toBe(true);
      form.patchValue({ costoEstimado: 200 });
      form.get('costoEstimado')?.updateValueAndValidity();
      expect(form.get('costoEstimado')?.hasError('costoMayorOIgualVenta')).toBe(true);
      form.patchValue({ costoEstimado: 150 });
      form.get('costoEstimado')?.updateValueAndValidity();
      expect(form.get('costoEstimado')?.valid).toBe(true);
    });

    it('baño: costo 0 opcional con treatZeroAsEmpty', () => {
      const form = fb.group({
        precio_total: [230],
        costoEstimado: [0, [costoMenorQueVentaValidator('precio_total', { treatZeroAsEmpty: true })]]
      });
      form.get('costoEstimado')?.updateValueAndValidity();
      expect(form.get('costoEstimado')?.valid).toBe(true);
    });
  });

  describe('IVA categoría', () => {
    it('medicamento → sin IVA / tasa 0', () => {
      const s = sugerirIvaPorCategoria('medicamento');
      expect(s.iva_aplicable).toBe(false);
      expect(s.tasa_iva).toBe(0);
    });

    it('vacuna → sin IVA / tasa 0 (igual que medicamento)', () => {
      const s = sugerirIvaPorCategoria('vacuna');
      expect(s.iva_aplicable).toBe(false);
      expect(s.tasa_iva).toBe(0);
    });

    it('accesorio → IVA 16', () => {
      const s = sugerirIvaPorCategoria('accesorio');
      expect(s.iva_aplicable).toBe(true);
      expect(s.tasa_iva).toBe(16);
    });

    it('precio con IVA preview (neto → público)', () => {
      expect(precioConIva(100, true, 16)).toBe(116);
      expect(precioConIva(100, false, 16)).toBe(100);
    });
  });

  describe('IVA incluido en precio al público', () => {
    it('desglosa venta neta, IVA y ganancia', () => {
      const d = desglosarPrecioIvaIncluido({
        precioVenta: 400,
        costo: 100,
        aplicaIva: true,
        tasaIva: 16
      });
      expect(d.ventaPublica).toBe(400);
      expect(d.ventaNeta).toBe(344.83);
      expect(d.ivaTrasladado).toBe(55.17);
      expect(d.ganancia).toBe(244.83);
      expect(d.gananciaBruta).toBe(300);
    });

    it('sin IVA: ganancia = venta − costo', () => {
      const d = desglosarPrecioIvaIncluido({
        precioVenta: 80,
        costo: 50,
        aplicaIva: false
      });
      expect(d.ventaNeta).toBe(80);
      expect(d.ivaTrasladado).toBe(0);
      expect(d.ganancia).toBe(30);
    });

    it('snapshot de línea escala con cantidad', () => {
      const s = snapshotEconomiaLinea({
        precioVenta: 100,
        costo: 40,
        aplicaIva: true,
        tasaIva: 16,
        cantidad: 2
      });
      expect(s.precio_venta).toBe(100);
      expect(s.costo).toBe(80);
      expect(s.iva).toBe(27.59);
      expect(s.ganancia).toBe(92.41);
      expect(s.aplicaIva).toBe(true);
      expect(s.tasaIva).toBe(16);
    });
  });
});
