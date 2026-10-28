import { campoMarcaAviso, hora12, listaNombres, paraAvisarHoy } from './para-avisar.util';

describe('para-avisar.util (spec 111)', () => {
  const hoy = '2026-10-27';
  const pacientes = [
    { id: 'coco', nombre: 'Coco', idCliente: 'ale' },
    { id: 'nacho', nombre: 'Nacho', idCliente: 'ale' },
    { id: 'kira', nombre: 'Kira', idCliente: 'joh' },
    { id: 'firu', nombre: 'Firulais', idCliente: 'joh' },
    { id: 'muerto', nombre: 'Max', idCliente: 'joh', estado: 'Fallecido' },
    { id: 'gato', nombre: 'Michi', idCliente: 'sin' },
  ];
  const clientes = [
    { id: 'ale', nombre: 'Alejandra', apellidoPaterno: 'Berlanga', telefono: '81 1981 7087' },
    { id: 'joh', nombre: 'Johana Marisol', apellidoPaterno: 'Hernández', telefono: '8112345678' },
    { id: 'sin', nombre: 'Pedro', telefono: '123' },
  ];

  it('junta los baños de mañana de la misma dueña en un solo aviso', () => {
    const banios = [
      { id: 'b1', paciente_id: 'coco', estado: 'programado', fecha_banio: '2026-10-28', hora_banio: '17:30' },
      { id: 'b2', paciente_id: 'nacho', estado: 'programado', fecha_banio: '2026-10-28', hora_banio: '17:32' },
    ];
    const lista = paraAvisarHoy({ banios, pacientes, clientes }, hoy);
    expect(lista.length).toBe(1);
    expect(lista[0].tipo).toBe('banio_manana');
    expect(lista[0].mascotas).toEqual(['Coco', 'Nacho']);
    expect(lista[0].refs.map((r) => r.id)).toEqual(['b1', 'b2']);
    expect(lista[0].mensaje).toContain('Hola Alejandra');
    expect(lista[0].mensaje).toContain('Coco y Nacho');
    expect(lista[0].mensaje).toContain('5:30 p.m.');
    expect(lista[0].whatsappUrl).toContain('https://wa.me/528119817087?text=');
  });

  it('«ya toca baño» a las 4 semanas, sin otro baño agendado', () => {
    const banios = [
      { id: 'v1', paciente_id: 'kira', estado: 'completado', fecha_banio: '2026-09-01' },
      { id: 'v2', paciente_id: 'kira', estado: 'completado', fecha_banio: '2026-09-29' },
    ];
    const lista = paraAvisarHoy({ banios, pacientes, clientes }, hoy);
    expect(lista.length).toBe(1);
    expect(lista[0].tipo).toBe('banio_proximo');
    expect(lista[0].refs).toEqual([{ origen: 'banio', id: 'v2' }]);
    expect(lista[0].fecha).toBe('2026-10-27');
    expect(lista[0].mensaje).toContain('Ya le toca baño a Kira');
  });

  it('no avisa baño si ya tiene otro agendado, si ya se avisó, si es muy viejo o si falleció', () => {
    const base = { estado: 'completado', fecha_banio: '2026-09-29' };
    expect(
      paraAvisarHoy(
        {
          banios: [
            { id: 'a', paciente_id: 'kira', ...base },
            { id: 'b', paciente_id: 'kira', estado: 'programado', fecha_banio: '2026-11-02' },
          ],
          pacientes,
          clientes,
        },
        hoy
      )
    ).toEqual([]);
    expect(
      paraAvisarHoy({ banios: [{ id: 'a', paciente_id: 'kira', ...base, avisoProximoEnviadoEn: 1 }], pacientes, clientes }, hoy)
    ).toEqual([]);
    expect(
      paraAvisarHoy({ banios: [{ id: 'a', paciente_id: 'kira', estado: 'completado', fecha_banio: '2024-07-31' }], pacientes, clientes }, hoy)
    ).toEqual([]);
    expect(paraAvisarHoy({ banios: [{ id: 'a', paciente_id: 'muerto', ...base }], pacientes, clientes }, hoy)).toEqual([]);
  });

  it('la semana de baño se puede cambiar', () => {
    const banios = [{ id: 'a', paciente_id: 'kira', estado: 'completado', fecha_banio: '2026-10-13' }];
    expect(paraAvisarHoy({ banios, pacientes, clientes }, hoy).length).toBe(0);
    expect(paraAvisarHoy({ banios, pacientes, clientes }, hoy, { semanasBanio: 2 }).length).toBe(1);
  });

  it('cita de mañana con su hora local, aunque se guardó en UTC', () => {
    const local = new Date(2026, 9, 28, 18, 0);
    const citas = [
      { id: 'c1', paciente_id: 'kira', estado: 'Pendiente', fecha: local.toISOString(), motivo: 'Vacunación' },
      { id: 'c2', paciente_id: 'kira', estado: 'cancelada', fecha: local.toISOString() },
      { id: 'c3', paciente_id: 'kira', estado: 'pendiente', fecha: local.toISOString(), activo: false },
    ];
    const lista = paraAvisarHoy({ citas, pacientes, clientes }, hoy);
    expect(lista.length).toBe(1);
    expect(lista[0].tipo).toBe('cita_manana');
    expect(lista[0].hora).toBe('18:00');
    expect(lista[0].mensaje).toContain('a las 6:00 p.m. (Vacunación)');
    expect(lista[0].mensaje).toContain('Hola Johana');
  });

  it('vacuna desde 7 días antes; otros recordatorios desde 1 día antes', () => {
    const recordatorios = [
      { id: 'r1', paciente_id: 'kira', estado: 'pendiente', tipo: 'vacuna', fecha_hora_recordatorio: '2026-11-03T09:00', titulo: 'Triple' },
      { id: 'r2', paciente_id: 'kira', estado: 'pendiente', tipo: 'vacuna', fecha_hora_recordatorio: '2026-11-04T09:00' },
      { id: 'r3', paciente_id: 'firu', estado: 'pendiente', tipo: 'consulta', fecha_recordatorio: '2026-10-29' },
      { id: 'r4', paciente_id: 'firu', estado: 'pendiente', tipo: 'consulta', fecha_recordatorio: '2026-10-28' },
      { id: 'r5', paciente_id: 'firu', estado: 'pendiente', tipo: 'vacuna', fecha_recordatorio: '2026-10-30', whatsappEnviadoEn: 5 },
    ];
    const ids = paraAvisarHoy({ recordatorios, pacientes, clientes }, hoy)
      .flatMap((a) => a.refs.map((r) => r.id))
      .sort();
    expect(ids).toEqual(['r1', 'r4']);
  });

  it('sin teléfono completo no arma WhatsApp pero sí sale en la lista', () => {
    const banios = [{ id: 'g', paciente_id: 'gato', estado: 'programado', fecha_banio: '2026-10-28' }];
    const [a] = paraAvisarHoy({ banios, pacientes, clientes }, hoy);
    expect(a.telefono10).toBeNull();
    expect(a.whatsappUrl).toBe('');
  });

  it('textos de apoyo', () => {
    expect(listaNombres(['Coco', 'Nacho', 'Tina'])).toBe('Coco, Nacho y Tina');
    expect(listaNombres([])).toBe('tu mascota');
    expect(hora12('09:05')).toBe('9:05 a.m.');
    expect(hora12('12:00')).toBe('12:00 p.m.');
    expect(hora12('')).toBe('');
  });

  it('marca el campo correcto según el aviso', () => {
    expect(campoMarcaAviso('recordatorio', 'recordatorio', 'enviado')).toBe('whatsappEnviadoEn');
    expect(campoMarcaAviso('banio_proximo', 'banio', 'enviado')).toBe('avisoProximoEnviadoEn');
    expect(campoMarcaAviso('banio_manana', 'banio', 'descartado')).toBe('avisoDescartadoEn');
    expect(campoMarcaAviso('cita_manana', 'cita', 'enviado')).toBe('avisoEnviadoEn');
  });
});
