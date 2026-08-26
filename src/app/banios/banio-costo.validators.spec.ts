import {
  costoMenorQueVentaValidator,
  esCostoEstrictamenteMenorQueVenta
} from './banio-costo.validators';
import { FormBuilder, Validators } from '@angular/forms';

describe('banio-costo.validators (re-export)', () => {
  it('re-exporta esCostoEstrictamenteMenorQueVenta', () => {
    expect(esCostoEstrictamenteMenorQueVenta(120, 450)).toBe(true);
    expect(esCostoEstrictamenteMenorQueVenta(200, 200)).toBe(false);
  });

  it('re-exporta costoMenorQueVentaValidator', () => {
    const fb = new FormBuilder();
    const form = fb.group({
      precio_total: [200, Validators.required],
      costoEstimado: [200, [costoMenorQueVentaValidator()]]
    });
    form.get('costoEstimado')?.updateValueAndValidity();
    expect(form.get('costoEstimado')?.hasError('costoMayorOIgualVenta')).toBe(true);
  });
});
