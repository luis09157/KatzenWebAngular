import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoggerService } from '../core/logger.service';
import { CobrarAlTerminarService } from './cobrar-al-terminar.service';
import { CobroAlTerminarPregunta } from './cobrar-al-terminar.util';
import { VisitaDialogComponent } from './visita-dialog.component';
import { VisitasService } from './visitas.service';

describe('CobrarAlTerminarService (spec 116.3)', () => {
  let service: CobrarAlTerminarService;
  let visitas: jasmine.SpyObj<VisitasService>;
  let dialog: { open: jasmine.Spy };
  let swal: jasmine.Spy;

  const pregunta: CobroAlTerminarPregunta = {
    titulo: 'Consulta guardada',
    linea: {
      cliente_id: 'c1',
      cliente: 'Johana',
      paciente_id: 'p1',
      paciente: 'Kira',
      descripcion: 'Consulta · Kira · Otitis',
      categoria: 'consulta',
      historialId: 'h1',
      fecha: '2026-10-29',
      montoSugerido: 0,
    },
  };

  const res = (r: Partial<SweetAlertResult>) => Promise.resolve(r as SweetAlertResult);

  beforeEach(() => {
    visitas = jasmine.createSpyObj('VisitasService', ['agregarServicioAVisita', 'getVisita']);
    visitas.agregarServicioAVisita.and.resolveTo({ visitaId: 'v1', lineaId: 'l1' });
    visitas.getVisita.and.resolveTo({ id: 'v1' } as never);
    dialog = { open: jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(true) }) };
    TestBed.configureTestingModule({
      providers: [
        CobrarAlTerminarService,
        { provide: VisitasService, useValue: visitas },
        { provide: MatDialog, useValue: dialog },
        { provide: ErrorMessagesService, useValue: { getUserMessage: () => 'error' } },
        { provide: LoggerService, useValue: { error: () => undefined } },
      ],
    });
    service = TestBed.inject(CobrarAlTerminarService);
    swal = spyOn(Swal, 'fire');
  });

  it('«Después» no toca el ticket', async () => {
    swal.and.returnValue(res({ isConfirmed: false, isDismissed: true }));
    expect(await service.ofrecer(pregunta)).toBe('despues');
    expect(visitas.agregarServicioAVisita).not.toHaveBeenCalled();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('«Cobrar ahora» pide el monto, agrega al ticket del día y abre Cobrar', async () => {
    swal.and.returnValues(res({ isConfirmed: true }), res({ isConfirmed: true, value: '350' }));
    expect(await service.ofrecer(pregunta)).toBe('cobrado');
    expect(visitas.agregarServicioAVisita).toHaveBeenCalledWith({
      cliente_id: 'c1',
      cliente: 'Johana',
      paciente_id: 'p1',
      paciente: 'Kira',
      descripcion: 'Consulta · Kira · Otitis',
      monto: 350,
      categoria: 'consulta',
      historialId: 'h1',
      vacunaId: undefined,
      fecha: '2026-10-29',
    });
    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(dialog.open.calls.mostRecent().args[0]).toBe(VisitaDialogComponent);
  });

  it('si cancela el monto, no agrega nada', async () => {
    swal.and.returnValues(res({ isConfirmed: true }), res({ isConfirmed: false }));
    expect(await service.ofrecer(pregunta)).toBe('despues');
    expect(visitas.agregarServicioAVisita).not.toHaveBeenCalled();
  });

  it('sin dueño avisa y no agrega', async () => {
    swal.and.returnValues(res({ isConfirmed: true }), res({ isConfirmed: true }));
    const sinDueno = { ...pregunta, linea: { ...pregunta.linea, cliente_id: '' } };
    expect(await service.ofrecer(sinDueno)).toBe('sin_dueno');
    expect(visitas.agregarServicioAVisita).not.toHaveBeenCalled();
  });

  it('si falla el ticket avisa con error', async () => {
    swal.and.returnValues(res({ isConfirmed: true }), res({ isConfirmed: true, value: '100' }), res({}));
    visitas.agregarServicioAVisita.and.rejectWith(new Error('sin red'));
    expect(await service.ofrecer(pregunta)).toBe('error');
    expect(dialog.open).not.toHaveBeenCalled();
  });
});
