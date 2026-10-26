import { CitasDiaDialogComponent } from './citas-dia-dialog.component';

/** El modal del día muestra citas, peluquería y pensión (072 follow-up 2026-10-25). */
describe('CitasDiaDialogComponent', () => {
  const dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
  const router = jasmine.createSpyObj('Router', ['navigate']);
  router.navigate.and.returnValue(Promise.resolve(true));

  function crear(data: any): CitasDiaDialogComponent {
    return new CitasDiaDialogComponent(dialogRef, router, data);
  }

  it('separa citas de peluquería/pensión y arma el resumen', () => {
    const c = crear({
      fecha: new Date(2026, 9, 18),
      citas: [{ id: 'c1', paciente: 'Sol' }],
      eventos: [
        { tipo: 'cita', id: 'c1', cita: { id: 'c1', paciente: 'Sol' } },
        { tipo: 'peluqueria', id: 'b1', paciente_id: 'p1', cliente_id: 'k1', servicio: 'baño_con_corte', hora: '09:00' },
        { tipo: 'pension', id: 'e1', paciente: 'Mora', desde: '2026-10-18', hasta: '2026-10-20' },
      ],
      pacientesMap: { p1: 'Luna' },
      clientesMap: { k1: 'Ana López' },
    });
    expect(c.citas.length).toBe(1);
    expect(c.otros.map((e) => e.tipo)).toEqual(['peluqueria', 'pension']);
    expect(c.resumen).toBe('1 cita · 1 peluquería · 1 en pensión');
    expect(c.mascota(c.otros[0])).toBe('Luna');
    expect(c.dueno(c.otros[0])).toBe('Ana López');
    expect(c.detalle(c.otros[0])).toBe('Baño con corte · 09:00');
    expect(c.detalle(c.otros[1])).toBe('Del 18/10/2026 al 20/10/2026');
  });

  it('sin eventos (llamada vieja) usa las citas', () => {
    const c = crear({ fecha: new Date(), citas: [{ id: 'c1' }, { id: 'c2' }] });
    expect(c.citas.length).toBe(2);
    expect(c.otros.length).toBe(0);
  });

  it('pensión sin salida lo dice y el botón lleva al módulo', () => {
    const c = crear({ fecha: new Date(), citas: [], eventos: [{ tipo: 'pension', desde: '2026-10-18' }] });
    expect(c.detalle(c.otros[0])).toBe('Desde el 18/10/2026, sin salida registrada');
    c.irAModulo(c.otros[0]);
    expect(dialogRef.close).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/pension']);
  });
});
