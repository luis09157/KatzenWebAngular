import { normalizarTextoBusqueda, textoCoincide } from './text-search.util';

describe('text-search.util', () => {
  it('quita acentos y colapsa espacios', () => {
    expect(normalizarTextoBusqueda('  Niño   Martínez ')).toBe('nino martinez');
  });

  it('coincide por frase o por todas las palabras', () => {
    expect(textoCoincide('Luis Alfonso Niño Martínez', 'nino')).toBeTrue();
    expect(textoCoincide('Luis Alfonso Niño Martínez', 'Luis Alfonso Niño Martínez')).toBeTrue();
    expect(textoCoincide('Luis Alfonso Niño Martínez', 'luis   alfonso')).toBeTrue();
    expect(textoCoincide('Ana García', 'oreon')).toBeFalse();
  });
});
