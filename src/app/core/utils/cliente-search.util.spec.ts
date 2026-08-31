import { MOCK_CLIENTE, MOCK_CLIENTE_LEGACY_NOMBRE, MOCK_CLIENTE_LUIS } from '../testing/mock-data';
import { filtrarClientes, getClienteNombreCompleto } from './cliente-search.util';
import { hydrateCliente } from './cliente-hydrate.util';

describe('cliente-search.util (spec 057)', () => {
  const lista = [
    MOCK_CLIENTE,
    MOCK_CLIENTE_LUIS,
    hydrateCliente(MOCK_CLIENTE_LEGACY_NOMBRE.id, MOCK_CLIENTE_LEGACY_NOMBRE)
  ];

  it('arma el nombre completo web', () => {
    expect(getClienteNombreCompleto(MOCK_CLIENTE_LUIS)).toContain('Luis');
    expect(getClienteNombreCompleto(MOCK_CLIENTE_LUIS)).toContain('Niño');
  });

  it('hidrata Nombre PascalCase de la app móvil', () => {
    const h = hydrateCliente('legacy-cliente-luis-key', MOCK_CLIENTE_LEGACY_NOMBRE);
    expect(h.nombre).toBe('Luis Alfonso Niño Martínez');
    expect(h.id).toBe('legacy-cliente-luis-key');
  });

  it('encuentra a Luis Alfonso Niño Martínez sin acentos y con el nombre completo', () => {
    expect(filtrarClientes(lista, 'Luis Alfonso Niño Martínez').some(c => c.id === 'legacy-cliente-luis-key')).toBeTrue();
    expect(filtrarClientes(lista, 'nino martinez').some(c => c.id === 'legacy-cliente-luis-key')).toBeTrue();
    expect(filtrarClientes(lista, 'alfonso').some(c => c.id === 'legacy-cliente-luis-key')).toBeTrue();
  });

  it('no exige activo === true (legacy sin campo)', () => {
    const sinActivo = hydrateCliente('x', { Nombre: 'Ana Demo' });
    expect(sinActivo.activo).toBeUndefined();
    expect(filtrarClientes([sinActivo], 'ana demo').length).toBe(1);
  });
});
