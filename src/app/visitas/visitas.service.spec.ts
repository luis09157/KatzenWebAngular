import { TestBed } from '@angular/core/testing';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { of } from 'rxjs';
import { VisitasService } from './visitas.service';
import { CurrentStaffService } from '../core/services/current-staff.service';
import { ClientesService } from '../clientes/clientes.service';
import { CajaService } from '../finanzas/caja.service';
import { InventarioService } from '../inventario/inventario.service';
import { Visita } from './visitas.models';

describe('VisitasService (spec 039/042 integridad cobro)', () => {
  let service: VisitasService;
  let dbSpy: jasmine.SpyObj<AngularFireDatabase>;
  let banioUpdate: jasmine.Spy;
  let citaUpdate: jasmine.Spy;
  let pensionUpdate: jasmine.Spy;
  let vacunaUpdate: jasmine.Spy;
  let historialUpdate: jasmine.Spy;
  let movimientoUpdate: jasmine.Spy;
  let visitaUpdate: jasmine.Spy;

  const lineas = [
    { id: 'l1', descripcion: 'Baño', monto: 300, categoria: 'banio' as const, banioId: 'ban-1' },
    { id: 'l2', descripcion: 'Consulta', monto: 400, categoria: 'consulta' as const, citaId: 'cit-1' },
    { id: 'l3', descripcion: 'Pensión', monto: 200, categoria: 'pension' as const, pensionId: 'pen-1' },
    { id: 'l4', descripcion: 'Vacuna', monto: 180, categoria: 'vacuna' as const, vacunaId: 'vac-1' },
    { id: 'l5', descripcion: 'Historial', monto: 450, categoria: 'consulta' as const, historialId: 'hist-1' },
    {
      id: 'l6',
      descripcion: 'Venta',
      monto: 90,
      categoria: 'venta_producto' as const,
      movimientoInventarioId: 'mov-1'
    }
  ];

  const visitaBase: Visita = {
    id: 'vis-1',
    cliente_id: 'cli-1',
    fecha: '2026-08-26',
    estado: 'abierta',
    lineas,
    total: 1620,
    pagado: 0,
    saldo: 1620,
    cajaMovimientoIds: ['caja-cierre-1'],
    activo: true,
    created_at: '2026-08-26T10:00:00.000Z'
  };

  beforeEach(() => {
    banioUpdate = jasmine.createSpy('banioUpdate').and.returnValue(Promise.resolve());
    citaUpdate = jasmine.createSpy('citaUpdate').and.returnValue(Promise.resolve());
    pensionUpdate = jasmine.createSpy('pensionUpdate').and.returnValue(Promise.resolve());
    vacunaUpdate = jasmine.createSpy('vacunaUpdate').and.returnValue(Promise.resolve());
    historialUpdate = jasmine.createSpy('historialUpdate').and.returnValue(Promise.resolve());
    movimientoUpdate = jasmine.createSpy('movimientoUpdate').and.returnValue(Promise.resolve());
    visitaUpdate = jasmine.createSpy('visitaUpdate').and.returnValue(Promise.resolve());

    dbSpy = jasmine.createSpyObj('AngularFireDatabase', ['list', 'object']);
    dbSpy.object.and.callFake((path: string) => {
      if (path === 'Katzen/Visitas/vis-1') {
        return {
          valueChanges: () => of({ ...visitaBase }),
          update: visitaUpdate
        } as any;
      }
      if (path === 'Katzen/Banios/ban-1') {
        return { update: banioUpdate } as any;
      }
      if (path === 'Katzen/Citas/cit-1') {
        return { update: citaUpdate } as any;
      }
      if (path === 'Katzen/Pension/Estancias/pen-1') {
        return { update: pensionUpdate } as any;
      }
      if (path === 'Katzen/Vacunas/vac-1') {
        return { update: vacunaUpdate } as any;
      }
      if (path === 'Katzen/Historiales_Clinicos/hist-1') {
        return { update: historialUpdate } as any;
      }
      if (path === 'Katzen/Inventario/Movimientos/mov-1') {
        return { update: movimientoUpdate } as any;
      }
      return { update: jasmine.createSpy('genericUpdate').and.returnValue(Promise.resolve()) } as any;
    });

    TestBed.configureTestingModule({
      providers: [
        VisitasService,
        { provide: AngularFireDatabase, useValue: dbSpy },
        {
          provide: CurrentStaffService,
          useValue: { getStaffId: () => Promise.resolve('staff-1') }
        },
        {
          provide: ClientesService,
          useValue: { actualizarCliente: () => Promise.resolve() }
        },
        { provide: CajaService, useValue: {} },
        { provide: InventarioService, useValue: { registrarEntrada: () => Promise.resolve() } }
      ]
    });

    service = TestBed.inject(VisitasService);
    spyOn(service, 'syncSaldoCliente').and.returnValue(Promise.resolve(0));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('propaga cobro a origenes incluyendo Historiales_Clinicos y movimiento inventario', async () => {
    await service.actualizarVisita('vis-1', { pagado: 1620 });

    expect(visitaUpdate).toHaveBeenCalled();
    expect(banioUpdate).toHaveBeenCalledWith(jasmine.objectContaining({ pagado: true }));
    expect(citaUpdate).toHaveBeenCalledWith(
      jasmine.objectContaining({ cobrada: true, cobradaEnVisitaId: 'vis-1' })
    );
    expect(pensionUpdate).toHaveBeenCalledWith(
      jasmine.objectContaining({ cobradaEnVisitaId: 'vis-1' })
    );
    expect(vacunaUpdate).toHaveBeenCalledWith(
      jasmine.objectContaining({ cobradaEnVisitaId: 'vis-1' })
    );
    expect(historialUpdate).toHaveBeenCalledWith(
      jasmine.objectContaining({ cobradaEnVisitaId: 'vis-1', cobrada: true })
    );
    expect(movimientoUpdate).toHaveBeenCalledWith(
      jasmine.objectContaining({ cajaMovimientoId: 'caja-cierre-1' })
    );
    expect(dbSpy.object).toHaveBeenCalledWith('Katzen/Historiales_Clinicos/hist-1');
    expect(dbSpy.object).not.toHaveBeenCalledWith('Katzen/Historiales/hist-1');
  });

  it('no propaga cobro en pago parcial (estado parcial)', async () => {
    await service.actualizarVisita('vis-1', { pagado: 400 });

    expect(banioUpdate).not.toHaveBeenCalled();
    expect(citaUpdate).not.toHaveBeenCalled();
    expect(pensionUpdate).not.toHaveBeenCalled();
    expect(historialUpdate).not.toHaveBeenCalled();
    expect(movimientoUpdate).not.toHaveBeenCalled();
  });
});
