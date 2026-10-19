import { MOCK_CLIENTE_LEGACY_NOMBRE, MOCK_MASCOTA, MOCK_MASCOTA_OREON } from '../testing/mock-data';
import { hydratePaciente } from './paciente-hydrate.util';
import {
  displayPacienteAutocompleteValue,
  filtrarPacientesPickerDual,
  filtrarPacientesPorTexto,
  getPacienteDisplayLabel,
  getPacienteNombre,
  getPacientePickerOptionLabel,
} from './paciente-search.util';
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
    const dueno = (p: typeof oreon) => (p.cliente_id === luis.id ? getClienteNombreCompleto(luis) : '');
    expect(filtrarPacientesPorTexto(lista, 'oreon', dueno)[0].id).toBe(oreon.id);
    expect(filtrarPacientesPorTexto(lista, 'nino', dueno)[0].id).toBe(oreon.id);
    expect(filtrarPacientesPorTexto(lista, '', dueno).length).toBe(0);
  });
});

describe('paciente-search.util picker dual (spec 085)', () => {
  const luis = hydrateCliente(MOCK_CLIENTE_LEGACY_NOMBRE.id, MOCK_CLIENTE_LEGACY_NOMBRE);
  const oreon = hydratePaciente(MOCK_MASCOTA_OREON.id, MOCK_MASCOTA_OREON);
  const luna = hydratePaciente(MOCK_MASCOTA.id, MOCK_MASCOTA);
  const nombreDueno = (p: typeof oreon) =>
    p.cliente_id === luis.id || p.idCliente === luis.id ? getClienteNombreCompleto(luis) : '';

  it('sin dueño: busca por nombre de mascota; vacío no lista todo', () => {
    const lista = [oreon, luna];
    expect(filtrarPacientesPickerDual(lista, null, '', nombreDueno).length).toBe(0);
    expect(filtrarPacientesPickerDual(lista, null, 'oreon', nombreDueno)[0].id).toBe(oreon.id);
  });

  it('con dueño: solo mascotas de ese cliente', () => {
    const lista = [oreon, luna];
    const delLuis = filtrarPacientesPickerDual(lista, luis.id, '', nombreDueno);
    expect(delLuis.every((p) => p.cliente_id === luis.id || p.idCliente === luis.id)).toBe(true);
    expect(delLuis.some((p) => p.id === oreon.id)).toBe(true);
  });

  it('etiqueta opción incluye dueño cuando se pasa', () => {
    const label = getPacientePickerOptionLabel(oreon, getClienteNombreCompleto(luis));
    expect(label).toContain('Oreon');
    expect(label).toContain(getClienteNombreCompleto(luis));
  });

  it('displayWith autocomplete: objeto Paciente o string de tipado', () => {
    expect(displayPacienteAutocompleteValue(oreon)).toBe(getPacienteDisplayLabel(oreon));
    expect(displayPacienteAutocompleteValue('Firulais — Perro')).toBe('Firulais — Perro');
    expect(displayPacienteAutocompleteValue(null)).toBe('');
  });
});
