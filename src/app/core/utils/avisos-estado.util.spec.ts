import { estadoAvisosPorPersona, estadoCelular } from './avisos-estado.util';

describe('avisos-estado.util (2026-10-26)', () => {
  const now = new Date('2026-10-26T18:00:00.000Z');

  it('celular activo, viejo (más de 30 días) o apagado', () => {
    expect(estadoCelular({ updatedAt: '2026-10-25T10:00:00.000Z' }, now).estado).toBe('activo');
    expect(estadoCelular({ updatedAt: '2026-08-01T10:00:00.000Z' }, now).estado).toBe('viejo');
    expect(estadoCelular({ updatedAt: '2026-10-25T10:00:00.000Z', activo: false }, now).estado).toBe('apagado');
    expect(estadoCelular({}, now).estado).toBe('viejo');
  });

  it('una fila por persona; primero quien no tiene avisos; ignora celulares del portal', () => {
    const usuarios = [
      { id: 'a', nombre: 'Ana' },
      { id: 'b', nombre: 'Beto' },
      { id: 'c', nombre: 'Caro' },
      { id: 'x', nombre: 'Baja', activo: false },
    ];
    const tokens = {
      a: { t1: { platform: 'admin_web', updatedAt: '2026-10-26T10:00:00.000Z', dispositivo: 'Android · Chrome' } },
      c: {
        t2: { platform: 'admin_web', updatedAt: '2026-07-01T10:00:00.000Z' },
        t3: { platform: 'portal_web', updatedAt: '2026-10-26T10:00:00.000Z' },
      },
    };
    const r = estadoAvisosPorPersona(usuarios, tokens, now);
    expect(r.map((p) => `${p.nombre}:${p.estado}`)).toEqual(['Beto:sin_avisos', 'Caro:revisar', 'Ana:activo']);
    expect(r[2].celulares[0].dispositivo).toBe('Android · Chrome');
    expect(r[1].celulares.length).toBe(1);
  });
});
