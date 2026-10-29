import {
  debeOfrecerCobroConsulta,
  debeOfrecerCobroVacuna,
  lineaCobroConsulta,
  lineaCobroVacuna,
} from './cobrar-al-terminar.util';

describe('cobrar-al-terminar.util (spec 116.3)', () => {
  it('consulta: solo nueva, sin cita y sin ticket', () => {
    expect(debeOfrecerCobroConsulta({ esNueva: true })).toBeTrue();
    expect(debeOfrecerCobroConsulta({ esNueva: false })).toBeFalse();
    expect(debeOfrecerCobroConsulta({ esNueva: true, citaId: 'c1' })).toBeFalse();
    expect(debeOfrecerCobroConsulta({ esNueva: true, yaEnTicket: 'v1' })).toBeFalse();
    expect(debeOfrecerCobroConsulta({ esNueva: true, citaId: '' })).toBeTrue();
  });

  it('vacuna: solo nueva y aplicada', () => {
    expect(debeOfrecerCobroVacuna({ esNueva: true, vacuna: { aplicada: true } })).toBeTrue();
    expect(debeOfrecerCobroVacuna({ esNueva: true, vacuna: { estado: 'Aplicada' } })).toBeTrue();
    expect(debeOfrecerCobroVacuna({ esNueva: true, vacuna: { aplicada: false } })).toBeFalse();
    expect(debeOfrecerCobroVacuna({ esNueva: true, vacuna: { estado: 'pendiente' } })).toBeFalse();
    expect(debeOfrecerCobroVacuna({ esNueva: false, vacuna: { aplicada: true } })).toBeFalse();
    expect(debeOfrecerCobroVacuna({ esNueva: true, vacuna: { aplicada: true, visitaId: 'v1' } })).toBeFalse();
    expect(debeOfrecerCobroVacuna({ esNueva: true, vacuna: null })).toBeFalse();
  });

  it('línea de consulta igual que «Enviar a cobrar»', () => {
    const l = lineaCobroConsulta({
      id: 'h1',
      paciente_id: 'p1',
      paciente_nombre: 'Kira',
      cliente_id: 'c1',
      cliente: 'Johana',
      diagnostico_presuntivo: 'Otitis',
      fecha_registro: '2026-10-29 19:30:00',
    });
    expect(l).toEqual({
      cliente_id: 'c1',
      cliente: 'Johana',
      paciente_id: 'p1',
      paciente: 'Kira',
      descripcion: 'Consulta · Kira · Otitis',
      categoria: 'consulta',
      historialId: 'h1',
      fecha: '2026-10-29',
      montoSugerido: 0,
    });
  });

  it('consulta sin diagnóstico ni dueño en el registro usa los extras', () => {
    const l = lineaCobroConsulta({ id: 'h2', paciente_id: 'p2' }, { clienteId: 'c9', paciente: 'Coco' });
    expect(l.cliente_id).toBe('c9');
    expect(l.descripcion).toBe('Consulta · Coco · consulta');
    expect(l.fecha).toBeUndefined();
  });

  it('línea de vacuna con día local aunque se guarde en UTC', () => {
    // 29 oct 20:00 en Monterrey = 30 oct 02:00Z
    const fechaAplicacion = new Date(2026, 9, 29, 20, 0).toISOString();
    const l = lineaCobroVacuna(
      { id: 'v1', idPaciente: 'p1', idCliente: 'c1', paciente: 'Oreon', nombreVacunaLabel: 'Triple felina', fechaAplicacion, precio: 450 },
      {}
    );
    expect(l.fecha).toBe('2026-10-29');
    expect(l.descripcion).toBe('Vacuna · Triple felina · Oreon');
    expect(l.categoria).toBe('vacuna');
    expect(l.vacunaId).toBe('v1');
    expect(l.cliente_id).toBe('c1');
    expect(l.paciente_id).toBe('p1');
    expect(l.montoSugerido).toBe(450);
  });

  it('vacuna sin precio sugiere 0 y toma nombres de respaldo', () => {
    const l = lineaCobroVacuna({ id: 'v2', vacuna: 'rabia' }, { clienteId: 'c2', paciente: 'Max' });
    expect(l.montoSugerido).toBe(0);
    expect(l.descripcion).toBe('Vacuna · rabia · Max');
    expect(l.cliente_id).toBe('c2');
  });
});
