import {
  resolverPrefillBanioPorTamano,
  plantillaBanioFallback
} from './banio-prefill.util';
import { emptyDefaultsBanio } from './defaults-banio.models';
import { PlantillaCosto } from './plantilla-costo.models';
import { MOCK_DEFAULTS_BANIO_TAMANO, MOCK_PLANTILLA_COSTO } from '../core/testing/mock-data';

describe('banio-prefill.util', () => {
  const plantillas: PlantillaCosto[] = [
    {
      ...MOCK_PLANTILLA_COSTO,
      id: 'plt-med',
      nombre: 'Baño mediano completo',
      tipoServicio: 'banio',
      costoTotalEstimado: 85,
      precioSugeridoCliente: 350,
      activo: true
    } as PlantillaCosto,
    {
      ...MOCK_PLANTILLA_COSTO,
      id: 'plt-p',
      nombre: 'Baño pequeño',
      tipoServicio: 'banio',
      costoTotalEstimado: 40,
      precioSugeridoCliente: 250,
      activo: true
    } as PlantillaCosto
  ];

  it('usa defaults cuando costo/precio > 0', () => {
    const r = resolverPrefillBanioPorTamano(
      'mediano',
      MOCK_DEFAULTS_BANIO_TAMANO as any,
      []
    );
    expect(r.fuente).toBe('defaults');
    expect(r.costoEstimado).toBe(85);
    expect(r.precioSugerido).toBe(350);
  });

  it('no trata 0 como tarifa (empty defaults → plantilla fallback)', () => {
    const r = resolverPrefillBanioPorTamano('mediano', emptyDefaultsBanio(), plantillas);
    expect(r.fuente).toBe('plantilla');
    expect(r.costoEstimado).toBe(85);
    expect(r.precioSugerido).toBe(350);
    expect(r.plantillaCostoId).toBe('plt-med');
  });

  it('prioriza plantilla ligada en defaults', () => {
    const defaults = {
      ...emptyDefaultsBanio(),
      pequeno: { costoDefault: 0, plantillaCostoId: 'plt-p' }
    };
    const r = resolverPrefillBanioPorTamano('pequeno', defaults, plantillas);
    expect(r.plantillaCostoId).toBe('plt-p');
    expect(r.costoEstimado).toBe(40);
    expect(r.precioSugerido).toBe(250);
  });

  it('fuente ninguno si no hay datos', () => {
    const r = resolverPrefillBanioPorTamano('grande', emptyDefaultsBanio(), []);
    expect(r.fuente).toBe('ninguno');
    expect(r.costoEstimado).toBeNull();
    expect(r.precioSugerido).toBeNull();
  });

  it('plantillaBanioFallback elige por nombre de tamaño', () => {
    const p = plantillaBanioFallback(plantillas, 'pequeno');
    expect(p?.id).toBe('plt-p');
  });
});
