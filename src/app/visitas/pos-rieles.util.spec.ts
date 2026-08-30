import {
  esProductoClinico,
  esProductoPetshop,
  filtrarProductosPorRiel,
  mensajeRielBloqueado,
  puedeUsarRiel,
  rielRequiereDuenoYMascota
} from './pos-rieles.util';
import { Producto } from '../shared/inventario.models';

function prod(parcial: Partial<Producto> & Pick<Producto, 'categoria'>): Producto {
  return {
    codigo_barras: 'X',
    nombre: 'P',
    descripcion: '',
    subcategoria: '',
    marca: '',
    presentacion: '',
    unidad_medida: 'unidad',
    stock_actual: 2,
    stock_minimo: 0,
    stock_maximo: 10,
    punto_reorden: 0,
    ubicacion_almacen: '',
    requiere_refrigeracion: false,
    fecha_caducidad_alerta_dias: 0,
    precio_compra: 1,
    precio_venta: 10,
    margen_ganancia: 0,
    activo: true,
    ...parcial
  } as Producto;
}

describe('pos-rieles.util', () => {
  it('petshop no exige dueño; consulta y peluquería sí', () => {
    expect(rielRequiereDuenoYMascota('petshop')).toBe(false);
    expect(rielRequiereDuenoYMascota('consulta')).toBe(true);
    expect(rielRequiereDuenoYMascota('peluqueria')).toBe(true);
  });

  it('mostrador solo puede petshop', () => {
    const ctx = { modoMostrador: true, clienteId: '__mostrador__', pacienteId: '' };
    expect(puedeUsarRiel('petshop', ctx)).toBe(true);
    expect(puedeUsarRiel('consulta', ctx)).toBe(false);
    expect(puedeUsarRiel('peluqueria', ctx)).toBe(false);
    expect(mensajeRielBloqueado('consulta', ctx)).toContain('dueño y mascota');
  });

  it('consulta/peluquería piden dueño y mascota reales', () => {
    expect(
      puedeUsarRiel('consulta', { modoMostrador: false, clienteId: 'c1', pacienteId: '' })
    ).toBe(false);
    expect(
      puedeUsarRiel('peluqueria', { modoMostrador: false, clienteId: 'c1', pacienteId: 'p1' })
    ).toBe(true);
  });

  it('separa catálogo clínico vs petshop', () => {
    const alimento = prod({ id: 'a', categoria: 'alimento', nombre: 'Croqueta' });
    const med = prod({ id: 'm', categoria: 'medicamento', nombre: 'Amoxi' });
    expect(esProductoPetshop(alimento)).toBe(true);
    expect(esProductoClinico(med)).toBe(true);
    expect(filtrarProductosPorRiel([alimento, med], 'petshop').map((p) => p.id)).toEqual(['a']);
    expect(filtrarProductosPorRiel([alimento, med], 'consulta').map((p) => p.id)).toEqual(['m']);
    expect(filtrarProductosPorRiel([alimento, med], 'peluqueria')).toEqual([]);
  });

  it('demo peluquería va al riel peluquería; shampoo real sigue en petshop', () => {
    const shampoo = prod({ id: 'sh', categoria: 'peluqueria', nombre: 'Shampoo' });
    const demoBanio = prod({
      id: 'demo-pos-peluqueria-1',
      categoria: 'peluqueria',
      nombre: 'Baño muestra',
      soloDemo: true,
      origen: 'pos_preview',
      rielPos: 'peluqueria'
    });
    expect(filtrarProductosPorRiel([shampoo, demoBanio], 'petshop').map((p) => p.id)).toEqual(['sh']);
    expect(filtrarProductosPorRiel([shampoo, demoBanio], 'peluqueria').map((p) => p.id)).toEqual([
      'demo-pos-peluqueria-1'
    ]);
  });
});
