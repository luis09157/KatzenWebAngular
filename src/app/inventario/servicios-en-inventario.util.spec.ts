import { detectarServiciosEnInventario } from './servicios-en-inventario.util';

describe('detectarServiciosEnInventario (2026-10-26)', () => {
  const productos = {
    p1: { nombre: 'Consulta', categoria: 'accesorio', stock_actual: 0, precio_venta: 232 },
    p2: { nombre: 'Castración Chica (-10kg)', categoria: 'accesorio', stock_actual: 0, precio_venta: 926.84 },
    p3: { nombre: 'Baño Chico Pelo Corto', categoria: 'peluqueria', stock_actual: 0, precio_venta: 232 },
    p4: { nombre: 'Pension Perro Chico O Gato (0-10kg)', categoria: 'accesorio', stock_actual: 0 },
    p5: { nombre: 'Espuma Essentials Baño En Seco 300g', categoria: 'peluqueria', stock_actual: 0 },
    p6: { nombre: '1-Baño', categoria: 'peluqueria', stock_actual: 0 },
    p7: { nombre: 'Radiografía Chica 2T', categoria: 'accesorio', stock_actual: 0, precio_compra: 400 },
    p8: { nombre: 'Bravecto 3M 20-40', categoria: 'medicamento', stock_actual: 0 },
    p9: { nombre: 'Corte De Uñas', categoria: 'peluqueria', stock_actual: 0 },
    p10: { nombre: 'Servicio De Cremación', categoria: 'accesorio', stock_actual: 0 },
    p11: { nombre: 'Desparasitacion Perro Chico O Gato (0-10 Kg)', categoria: 'vacuna', stock_actual: 0 },
    p12: { nombre: 'Biometría Hemática (Sola)', categoria: 'diagnostico', stock_actual: 3 },
  };
  const servicios = [{ nombre: 'Consulta General' }, { nombre: 'Corte De Uñas' }];
  const r = detectarServiciosEnInventario(productos, servicios);
  const por = (n: string) => r.find((c) => c.nombre === n);

  it('no toma productos de verdad ni cosas con stock', () => {
    expect(por('Bravecto 3M 20-40')).toBeUndefined();
    expect(por('Biometría Hemática (Sola)')).toBeUndefined();
  });

  it('propone el destino correcto', () => {
    expect(por('Consulta')?.destino).toBe('catalogo_existente');
    expect(por('Consulta')?.servicioExistente).toBe('Consulta General');
    expect(por('Corte De Uñas')?.destino).toBe('catalogo_existente');
    expect(por('Castración Chica (-10kg)')).toEqual(jasmine.objectContaining({ destino: 'catalogo_nuevo', tipoServicio: 'procedimiento', precioVenta: 926.84 }));
    expect(por('Radiografía Chica 2T')).toEqual(jasmine.objectContaining({ tipoServicio: 'diagnostico', precioCosto: 400 }));
    expect(por('Servicio De Cremación')?.tipoServicio).toBe('otro');
    expect(por('Desparasitacion Perro Chico O Gato (0-10 Kg)')?.tipoServicio).toBe('procedimiento');
    expect(por('Baño Chico Pelo Corto')?.destino).toBe('peluqueria');
    expect(por('Pension Perro Chico O Gato (0-10kg)')?.destino).toBe('pension');
  });

  it('deja sin marcar lo que parece producto o hay que revisar', () => {
    expect(por('Espuma Essentials Baño En Seco 300g')?.sugeridoMover).toBeFalse();
    expect(por('1-Baño')?.sugeridoMover).toBeFalse();
    expect(por('Castración Chica (-10kg)')?.sugeridoMover).toBeTrue();
  });
});
