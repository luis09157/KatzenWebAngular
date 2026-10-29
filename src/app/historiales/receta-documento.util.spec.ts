import {
  buildRecetaView,
  fechaRecetaTexto,
  nombreArchivoPdfReceta,
  pesoTexto,
  textoWhatsAppReceta,
  tieneContenidoReceta,
  urlWhatsAppReceta,
} from './receta-documento.util';

describe('receta-documento.util (spec 116.2)', () => {
  const hoy = new Date(2026, 9, 29, 12, 0);
  const historial = {
    fecha_registro: '2026-10-28 18:30:00',
    receta: 'Meloxicam 1.5 mg/ml — 0.5 ml cada 24 h por 5 días',
    manejo_terapeutico: 'Reposo. Collar isabelino.\nRevisión en 7 días.',
    peso: '5.2',
    medico_atendio: 'Dra. Nancy Díaz',
    diagnostico_presuntivo: 'NO DEBE SALIR',
  };
  const paciente = { nombre: 'Oreón', especie: 'Felino', raza: 'Doméstico', sexo: 'Macho', peso: 5, expediente: '245280' };
  const cliente = { nombre: 'Luis Alfonso', apellidoPaterno: 'Niño', apellidoMaterno: 'Martínez', telefono: '81 1234 5678' };

  it('sabe si hay algo que mandar', () => {
    expect(tieneContenidoReceta(historial)).toBeTrue();
    expect(tieneContenidoReceta({ manejo_terapeutico: 'Dieta blanda' })).toBeTrue();
    expect(tieneContenidoReceta({ receta: '  ', manejo_terapeutico: '' })).toBeFalse();
    expect(tieneContenidoReceta(null)).toBeFalse();
  });

  it('fecha de la consulta en texto, sin brincar de día', () => {
    expect(fechaRecetaTexto('2026-10-28 23:59:00', hoy)).toBe('28 de octubre de 2026');
    expect(fechaRecetaTexto('2026-01-01', hoy)).toBe('1 de enero de 2026');
    expect(fechaRecetaTexto('', hoy)).toBe('29 de octubre de 2026');
  });

  it('peso legible', () => {
    expect(pesoTexto('5.2')).toBe('5.2 kg');
    expect(pesoTexto(5)).toBe('5 kg');
    expect(pesoTexto('5 kg')).toBe('5 kg');
    expect(pesoTexto('')).toBe('');
  });

  it('arma la receta con datos de la consulta, mascota y dueño', () => {
    const v = buildRecetaView(historial, paciente, cliente, 'KatzenVet', hoy);
    expect(v.paciente).toBe('Oreón');
    expect(v.pacienteDetalle).toBe('Felino · Doméstico · Macho');
    expect(v.dueno).toBe('Luis Alfonso Niño Martínez');
    expect(v.duenoNombre).toBe('Luis');
    expect(v.peso).toBe('5.2 kg');
    expect(v.fecha).toBe('28 de octubre de 2026');
    expect(v.telefono10).toBe('8112345678');
    expect(v.veterinario).toBe('Dra. Nancy Díaz');
    expect(JSON.stringify(v)).not.toContain('NO DEBE SALIR');
  });

  it('usa el peso de la ficha si la consulta no lo trae y nombres de respaldo', () => {
    const v = buildRecetaView({ receta: 'x', paciente_nombre: 'Kira', cliente: 'Johana' }, null, null, '', hoy);
    expect(v.paciente).toBe('Kira');
    expect(v.dueno).toBe('Johana');
    expect(v.clinica).toBe('KatzenVet');
    expect(v.telefono10).toBeNull();
    expect(buildRecetaView({ receta: 'x' }, { peso: 4 }, null, null, hoy).peso).toBe('4 kg');
  });

  it('mensaje de WhatsApp con la receta escrita, sin diagnóstico', () => {
    const v = buildRecetaView(historial, paciente, cliente, 'KatzenVet', hoy);
    const t = textoWhatsAppReceta(v);
    expect(t).toContain('Hola Luis, te compartimos la receta de Oreón (28 de octubre de 2026).');
    expect(t).toContain('💊 *Receta*\nMeloxicam');
    expect(t).toContain('📋 *Indicaciones*\nReposo. Collar isabelino.\nRevisión en 7 días.');
    expect(t).toContain('Atendió: Dra. Nancy Díaz');
    expect(t).not.toContain('NO DEBE SALIR');
    expect(urlWhatsAppReceta(v)).toContain('https://wa.me/528112345678?text=');
  });

  it('sin indicaciones no pone esa sección; sin teléfono no hay enlace', () => {
    const v = buildRecetaView({ receta: 'Pastilla' }, { nombre: 'Coco' }, { nombre: 'Ale', telefono: '123' }, 'K', hoy);
    expect(textoWhatsAppReceta(v)).not.toContain('Indicaciones');
    expect(urlWhatsAppReceta(v)).toBeNull();
  });

  it('nombre del PDF', () => {
    const v = buildRecetaView(historial, paciente, cliente, 'KatzenVet', hoy);
    expect(nombreArchivoPdfReceta(v, historial.fecha_registro, hoy)).toBe('Receta-Oreon-2026-10-28.pdf');
    expect(nombreArchivoPdfReceta({ ...v, paciente: '' }, null, hoy)).toBe('Receta-Mascota-2026-10-29.pdf');
  });
});
