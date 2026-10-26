import { PacientesComponent } from './pacientes.component';

/** Spec 096 — «+ Agregar» del expediente: cada opción abre su pestaña y su formulario. */
describe('PacientesComponent · agregarDesdeMenu', () => {
  function fake(): any {
    const self: any = Object.create(PacientesComponent.prototype);
    self.expedienteTabs = { selectedIndex: 0 };
    for (const fn of [
      'agregarHistorialClinico',
      'agregarRecordatorio',
      'agregarVacuna',
      'agregarConsentimiento',
      'agregarDesparasitacion',
      'agregarCitaDesdeExpediente',
      'agregarPensionDesdeExpediente',
      'agregarVisitaDesdeExpediente',
    ]) {
      self[fn] = jasmine.createSpy(fn);
    }
    return self;
  }

  it('historial, recordatorio, vacuna y consentimiento cambian a su pestaña', () => {
    const casos: Array<[string, string, number]> = [
      ['historial', 'agregarHistorialClinico', 0],
      ['recordatorio', 'agregarRecordatorio', 1],
      ['vacuna', 'agregarVacuna', 2],
      ['consentimiento', 'agregarConsentimiento', 3],
    ];
    for (const [tipo, fn, tab] of casos) {
      const c = fake();
      c.agregarDesdeMenu(tipo);
      expect(c[fn]).toHaveBeenCalled();
      expect(c.expedienteTabs.selectedIndex).toBe(tab);
    }
  });

  it('cita, pensión, cuenta y desparasitación llaman a su acción sin cambiar pestaña', () => {
    const casos: Array<[string, string]> = [
      ['cita', 'agregarCitaDesdeExpediente'],
      ['pension', 'agregarPensionDesdeExpediente'],
      ['cuenta', 'agregarVisitaDesdeExpediente'],
      ['desparasitacion', 'agregarDesparasitacion'],
    ];
    for (const [tipo, fn] of casos) {
      const c = fake();
      c.agregarDesdeMenu(tipo);
      expect(c[fn]).toHaveBeenCalled();
      expect(c.expedienteTabs.selectedIndex).toBe(0);
    }
  });

  it('baño: si la pestaña no está cargada, la abre y luego abre el formulario', (done) => {
    const c = fake();
    c.pacienteSeleccionado = { id: 'p1' };
    const agregarBanio = jasmine.createSpy('agregarBanio');
    c.agregarDesdeMenu('banio');
    expect(c.expedienteTabs.selectedIndex).toBe(4);
    // Simula que Angular ya pintó la pestaña Baños.
    c.baniosPacienteCmp = { agregarBanio };
    setTimeout(() => {
      expect(agregarBanio).toHaveBeenCalledTimes(1);
      done();
    }, 120);
  });
});
