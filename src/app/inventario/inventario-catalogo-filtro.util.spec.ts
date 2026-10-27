import { Producto } from '../shared/inventario.models';
import { categoriasDelCatalogo, coincideCatalogo, esPorPedir } from './inventario-catalogo-filtro.util';

const p = (x: Partial<Producto>): Producto => ({ nombre: '', stock_actual: 0, stock_minimo: 0, ...x }) as Producto;

describe('inventario-catalogo-filtro.util', () => {
  it('por pedir: en o abajo del mínimo; sin mínimo no cuenta', () => {
    expect(esPorPedir(p({ stock_actual: 1, stock_minimo: 2 }))).toBeTrue();
    expect(esPorPedir(p({ stock_actual: 2, stock_minimo: 2 }))).toBeTrue();
    expect(esPorPedir(p({ stock_actual: 3, stock_minimo: 2 }))).toBeFalse();
    expect(esPorPedir(p({ stock_actual: 0, stock_minimo: 0 }))).toBeFalse();
  });

  it('busca sin acentos y por varias palabras', () => {
    const nupec = p({ nombre: 'Nupec Cachorro 2kg', categoria: 'alimento' });
    expect(coincideCatalogo(nupec, { texto: 'nupec cach', categoria: '', porPedir: false })).toBeTrue();
    expect(coincideCatalogo(nupec, { texto: 'alimento', categoria: '', porPedir: false })).toBeTrue();
    expect(coincideCatalogo(nupec, { texto: 'royal', categoria: '', porPedir: false })).toBeFalse();
    const pelu = p({ nombre: 'Shampoo', categoria: 'peluqueria' });
    expect(coincideCatalogo(pelu, { texto: 'peluquería', categoria: '', porPedir: false })).toBeTrue();
  });

  it('filtra por categoría sin importar mayúsculas', () => {
    const x = p({ nombre: 'X', categoria: 'MEDICAMENTO' as Producto['categoria'] });
    expect(coincideCatalogo(x, { texto: '', categoria: 'medicamento', porPedir: false })).toBeTrue();
    expect(coincideCatalogo(x, { texto: '', categoria: 'vacuna', porPedir: false })).toBeFalse();
  });

  it('categorías con etiqueta y total, la más grande primero', () => {
    const cats = categoriasDelCatalogo([p({ categoria: 'vacuna' }), p({ categoria: 'accesorio' }), p({ categoria: 'accesorio' })]);
    expect(cats.map((c) => c.etiqueta)).toEqual(['Accesorio', 'Vacuna']);
    expect(cats[0].total).toBe(2);
  });
});
