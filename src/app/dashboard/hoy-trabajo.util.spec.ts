import { grupoTrabajoHoy, listaTrabajoHoy, resumenTrabajoHoy } from './hoy-trabajo.util';
import type { AgendaEventoDia } from './dashboard-calendario.util';

describe('hoy-trabajo.util (spec 113)', () => {
  const cita = (estado: string): AgendaEventoDia => ({ tipo: 'cita', cita: { estado } as any });
  const banio = (estado: string): AgendaEventoDia => ({ tipo: 'peluqueria', estado });

  it('clasifica citas por estado', () => {
    expect(grupoTrabajoHoy(cita('Pendiente'))).toBe('por_llegar');
    expect(grupoTrabajoHoy(cita('confirmada'))).toBe('por_llegar');
    expect(grupoTrabajoHoy(cita('completada'))).toBe('terminado');
    expect(grupoTrabajoHoy(cita('cancelada'))).toBeNull();
  });

  it('clasifica baños por estado', () => {
    expect(grupoTrabajoHoy(banio('programado'))).toBe('por_llegar');
    expect(grupoTrabajoHoy(banio('en_proceso'))).toBe('en_atencion');
    expect(grupoTrabajoHoy(banio('completado'))).toBe('terminado');
    expect(grupoTrabajoHoy(banio('cancelado'))).toBeNull();
  });

  it('pensión no entra (tiene su panel)', () => {
    expect(grupoTrabajoHoy({ tipo: 'pension', estado: 'activa' })).toBeNull();
  });

  it('arma los grupos y el resumen', () => {
    const t = listaTrabajoHoy([cita('pendiente'), banio('programado'), banio('en_proceso'), banio('completado')]);
    expect(t.porLlegar.length).toBe(2);
    expect(t.enAtencion.length).toBe(1);
    expect(t.terminados.length).toBe(1);
    expect(resumenTrabajoHoy(t)).toBe('2 por llegar · 1 atendiéndose · 1 terminado');
    expect(resumenTrabajoHoy(listaTrabajoHoy([]))).toBe('Sin citas ni baños agendados');
  });
});
