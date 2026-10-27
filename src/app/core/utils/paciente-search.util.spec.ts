import { MOCK_CLIENTE_LEGACY_NOMBRE, MOCK_MASCOTA, MOCK_MASCOTA_OREON } from '../testing/mock-data';
import { hydratePaciente } from './paciente-hydrate.util';
import {
  displayPacienteAutocompleteValue,
  filtrarPacientesPickerDual,
  filtrarPacientesPorTexto,
  getPacienteBusquedaExpedienteLabel,
  getPacienteDisplayLabel,
  getPacienteNombre,
  getPacientePickerOptionLabel,
  getPacientePickerRazaEdadLabel,
  ordenarPacientesPorNombre,
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

  it('etiqueta de peluquería muestra raza y edad, sin el dueño', () => {
    const label = getPacientePickerRazaEdadLabel(oreon);
    expect(label).toContain('Oreon');
    expect(label).toContain('Doméstico');
    expect(label).toContain('Edad no registrada');
    expect(label).not.toContain('Niño');
  });

  it('búsqueda de expediente agrega el dueño al texto de raza y edad', () => {
    const dueno = getClienteNombreCompleto(luis);
    const label = getPacienteBusquedaExpedienteLabel(oreon, dueno);
    expect(label).toBe(`${getPacientePickerRazaEdadLabel(oreon)} · ${dueno}`);
    expect(label).toContain('Oreon');
    expect(label).toContain('Felino');
    expect(label).toContain('Doméstico');
    expect(label).not.toContain('undefined');
  });

  it('sin raza, sin edad o sin dueño no escribe undefined', () => {
    const incompleto = hydratePaciente('sin-datos', {
      ...MOCK_MASCOTA_OREON,
      raza: '',
      edad: '',
      especie: '',
    });
    const conDueno = getPacienteBusquedaExpedienteLabel(incompleto, 'Enrique Oría Venegas');
    expect(conDueno).toContain('Oreon');
    expect(conDueno).toContain('Sin especie');
    expect(conDueno).toContain('Sin raza');
    expect(conDueno).toContain('Edad no registrada');
    expect(conDueno).toContain('Enrique Oría Venegas');
    expect(conDueno).not.toContain('undefined');
    expect(getPacienteBusquedaExpedienteLabel(oreon, '   ')).toBe(getPacientePickerRazaEdadLabel(oreon));
  });

  it('displayWith autocomplete: objeto Paciente o string de tipado', () => {
    expect(displayPacienteAutocompleteValue(oreon)).toBe(getPacienteDisplayLabel(oreon));
    expect(displayPacienteAutocompleteValue('Firulais — Perro')).toBe('Firulais — Perro');
    expect(displayPacienteAutocompleteValue(null)).toBe('');
  });

  it('ordena primero por nombre de la mascota (no por raza o dueño)', () => {
    const lista = [
      { id: '1', nombre: 'Tommy', raza: 'Jack Russell' },
      { id: '2', nombre: 'Jack' },
      { id: '3', nombre: 'Blackjack' },
      { id: '4', nombre: 'Jackie' },
    ] as never[];
    expect(ordenarPacientesPorNombre(lista, 'jack').map((p: { id: string }) => p.id)).toEqual(['2', '4', '3', '1']);
    expect(ordenarPacientesPorNombre(lista, '').length).toBe(4);
  });
});
