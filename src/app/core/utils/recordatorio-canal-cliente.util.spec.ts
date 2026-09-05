import { evaluarCanalRecordatorioCliente } from './recordatorio-canal-cliente.util';

describe('recordatorio-canal-cliente.util (072)', () => {
  it('sin datos: no recibirá y lista los tres faltantes', () => {
    const v = evaluarCanalRecordatorioCliente({});
    expect(v.recibira).toBeFalse();
    expect(v.faltantes).toEqual(['correo', 'activar portal', 'permitir avisos']);
    expect(v.mensaje).toContain('no recibirá');
    expect(v.mensaje).not.toMatch(/FCM|claims|Firebase/i);
  });

  it('correo solo: sí recibirá y pide portal y avisos', () => {
    const v = evaluarCanalRecordatorioCliente({ correo: 'ana@clinica.mx' });
    expect(v.recibira).toBeTrue();
    expect(v.faltantes).toEqual(['activar portal', 'permitir avisos']);
    expect(v.mensaje).toContain('sí recibirá');
  });

  it('portal activo + avisos + correo: completo', () => {
    const v = evaluarCanalRecordatorioCliente({
      correo: 'ana@clinica.mx',
      portalActivo: true,
      authUid: 'uid-1',
      tieneAvisosPush: true,
    });
    expect(v.recibira).toBeTrue();
    expect(v.faltantes.length).toBe(0);
    expect(v.mensaje).toBe('Este dueño sí recibirá recordatorios.');
  });

  it('portalActivo sin cuenta no cuenta como portal', () => {
    const v = evaluarCanalRecordatorioCliente({ portalActivo: true, correo: '' });
    expect(v.faltantes).toContain('activar portal');
    expect(v.recibira).toBeFalse();
  });
});
