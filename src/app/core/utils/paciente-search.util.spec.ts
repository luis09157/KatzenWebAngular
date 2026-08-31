import { MOCK_CLIENTE_LEGACY_NOMBRE, MOCK_MASCOTA, MOCK_MASCOTA_OREON } from '../testing/mock-data';
import { hydratePaciente } from './paciente-hydrate.util';
import { filtrarPacientesPorTexto, getPacienteNombre } from './paciente-search.util';
import { getClienteNombreCompleto } from './cliente-search.util';
import { hydrateCliente } from './cliente-hydrate.util';

describe('paciente-search.util (spec 057)', () => {
  const luis = hydrateCliente(MOCK_CLIENTE_LEGACY_NOMBRE.id, MOCK_CLIENTE_LEGACY_NOMBRE);
  const oreon = hydratePaciente(MOCK_MASCOTA_OREON.id, MOCK_MASCOTA_OREON);
  const luna = hydratePaciente(MOCK_MASCOTA.id, MOCK_MASCOTA);

  it('hidrata Nombre y idCliente del shape móvil', () => {
    expect(getPacienteNombre(oreon)).toBe('Oreon');
    expect(oreon.cliente_id).toBe(MOCK_CLIENTE_LEGACY_NOMBRE.id);
    expect(oreon.activo).toBeUndefined();
  });

  it('busca Oreon por mascota y por dueño (acentos)', () => {
    const lista = [oreon, luna];
    const dueno = (p: typeof oreon) =>
      p.cliente_id === luis.id ? getClienteNombreCompleto(luis) : '';
    expect(filtrarPacientesPorTexto(lista, 'oreon', dueno)[0].id).toBe(oreon.id);
    expect(filtrarPacientesPorTexto(lista, 'nino', dueno)[0].id).toBe(oreon.id);
    expect(filtrarPacientesPorTexto(lista, '', dueno).length).toBe(0);
  });
});
