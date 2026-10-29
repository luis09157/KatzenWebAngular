import { diaLocalDeControl, fechaHoraLocalDeCita, fechaHoraTextoLocal, instanteLocalCita } from './cita-fecha.util';

describe('cita-fecha.util (2026-10-29)', () => {
  const cita = (y: number, mo: number, d: number, h: number, mi = 0) => {
    const local = new Date(y, mo - 1, d, h, mi);
    return { fecha: local.toISOString(), fecha_hora: local.toISOString().slice(0, 16), hora: `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}` };
  };

  it('a cualquier hora, la cita se abre en su día local', () => {
    for (const h of [0, 6, 11, 17, 18, 20, 23]) {
      expect(fechaHoraLocalDeCita(cita(2026, 10, 28, h)).fecha).toBe('2026-10-28');
    }
    expect(fechaHoraLocalDeCita(cita(2026, 10, 28, 18, 30)).hora).toBe('18:30');
  });

  it('abrir y guardar sin cambios deja la cita en el mismo instante', () => {
    for (const h of [8, 11, 18, 22]) {
      const c = cita(2026, 10, 28, h);
      const { fecha, hora } = fechaHoraLocalDeCita(c);
      expect(instanteLocalCita(fecha, hora)!.toISOString()).toBe(c.fecha);
      expect(instanteLocalCita(diaLocalDeControl(fecha), hora)!.toISOString()).toBe(c.fecha);
    }
  });

  it('textos sin zona se toman tal cual (locales)', () => {
    expect(fechaHoraLocalDeCita({ fecha_hora: '2026-10-28T18:00' })).toEqual({ fecha: '2026-10-28', hora: '18:00' });
    expect(fechaHoraLocalDeCita({ fecha: '2026-10-28', hora: '09:15' })).toEqual({ fecha: '2026-10-28', hora: '09:15' });
  });

  it('fecha_hora se guarda en hora de reloj local', () => {
    expect(fechaHoraTextoLocal(new Date(2026, 9, 28, 23, 5))).toBe('2026-10-28T23:05');
  });

  it('el día del calendario (Date) y el texto dan el mismo día', () => {
    expect(diaLocalDeControl(new Date(2026, 9, 28, 0, 0))!.getDate()).toBe(28);
    expect(diaLocalDeControl('2026-10-28')!.getDate()).toBe(28);
    expect(diaLocalDeControl('x')).toBeNull();
  });
});
