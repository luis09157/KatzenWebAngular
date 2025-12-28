import { TestBed } from '@angular/core/testing';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { HistorialesService } from './historiales.service';
import { of } from 'rxjs';

describe('HistorialesService', () => {
  let service: HistorialesService;
  let dbSpy: jasmine.SpyObj<AngularFireDatabase>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AngularFireDatabase', ['list', 'object']);

    TestBed.configureTestingModule({
      providers: [
        HistorialesService,
        { provide: AngularFireDatabase, useValue: spy }
      ]
    });

    service = TestBed.inject(HistorialesService);
    dbSpy = TestBed.inject(AngularFireDatabase) as jasmine.SpyObj<AngularFireDatabase>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Ordenamiento de historiales', () => {
    it('debe ordenar historiales por fecha descendente (más reciente primero)', (done) => {
      const mockHistoriales = [
        {
          payload: {
            key: 'id1',
            val: () => ({
              diagnostico_presuntivo: 'Historial antiguo',
              fecha_registro: '2025-11-15 10:00:00',
              paciente_id: 'pac1',
              activo: true
            })
          }
        },
        {
          payload: {
            key: 'id2',
            val: () => ({
              diagnostico_presuntivo: 'Historial reciente',
              fecha_registro: '2025-12-28 15:30:00',
              paciente_id: 'pac1',
              activo: true
            })
          }
        },
        {
          payload: {
            key: 'id3',
            val: () => ({
              diagnostico_presuntivo: 'Historial medio',
              fecha_registro: '2025-12-20 08:00:00',
              paciente_id: 'pac1',
              activo: true
            })
          }
        }
      ];

      const listSpy = jasmine.createSpyObj('AngularFireList', ['snapshotChanges']);
      listSpy.snapshotChanges.and.returnValue(of(mockHistoriales as any));
      dbSpy.list.and.returnValue(listSpy);

      service.getHistorialesPorPaciente('pac1').subscribe(historiales => {
        expect(historiales.length).toBe(3);
        expect(historiales[0].diagnostico_presuntivo).toBe('Historial reciente');
        expect(historiales[0].fecha_registro).toBe('2025-12-28 15:30:00');
        expect(historiales[1].diagnostico_presuntivo).toBe('Historial medio');
        expect(historiales[2].diagnostico_presuntivo).toBe('Historial antiguo');
        done();
      });
    });

    it('debe manejar historiales sin fecha_registro usando created_at', (done) => {
      const mockHistoriales = [
        {
          payload: {
            key: 'id1',
            val: () => ({
              diagnostico_presuntivo: 'Sin fecha_registro',
              created_at: '2025-12-25 12:00:00',
              paciente_id: 'pac1',
              activo: true
            })
          }
        },
        {
          payload: {
            key: 'id2',
            val: () => ({
              diagnostico_presuntivo: 'Con fecha_registro',
              fecha_registro: '2025-12-26 10:00:00',
              paciente_id: 'pac1',
              activo: true
            })
          }
        }
      ];

      const listSpy = jasmine.createSpyObj('AngularFireList', ['snapshotChanges']);
      listSpy.snapshotChanges.and.returnValue(of(mockHistoriales as any));
      dbSpy.list.and.returnValue(listSpy);

      service.getHistorialesPorPaciente('pac1').subscribe(historiales => {
        expect(historiales.length).toBe(2);
        expect(historiales[0].diagnostico_presuntivo).toBe('Con fecha_registro');
        expect(historiales[1].diagnostico_presuntivo).toBe('Sin fecha_registro');
        done();
      });
    });

    it('debe filtrar historiales inactivos', (done) => {
      const mockHistoriales = [
        {
          payload: {
            key: 'id1',
            val: () => ({
              diagnostico_presuntivo: 'Activo',
              fecha_registro: '2025-12-28 15:30:00',
              paciente_id: 'pac1',
              activo: true
            })
          }
        },
        {
          payload: {
            key: 'id2',
            val: () => ({
              diagnostico_presuntivo: 'Inactivo',
              fecha_registro: '2025-12-27 10:00:00',
              paciente_id: 'pac1',
              activo: false
            })
          }
        }
      ];

      const listSpy = jasmine.createSpyObj('AngularFireList', ['snapshotChanges']);
      listSpy.snapshotChanges.and.returnValue(of(mockHistoriales as any));
      dbSpy.list.and.returnValue(listSpy);

      service.getHistorialesPorPaciente('pac1').subscribe(historiales => {
        expect(historiales.length).toBe(1);
        expect(historiales[0].diagnostico_presuntivo).toBe('Activo');
        done();
      });
    });
  });

  describe('Creación de historiales', () => {
    it('debe crear un historial con la fecha_registro proporcionada', async () => {
      const mockHistorial = {
        diagnostico_presuntivo: 'Test',
        fecha_registro: '2025-12-28 13:50:00',
        paciente_id: 'pac1'
      };

      const mockRef = { key: 'nuevo-id' };
      const listSpy = jasmine.createSpyObj('AngularFireList', ['push']);
      listSpy.push.and.returnValue(Promise.resolve(mockRef));
      dbSpy.list.and.returnValue(listSpy);

      const result = await service.crearHistorial(mockHistorial);

      expect(result.key).toBe('nuevo-id');
      expect(listSpy.push).toHaveBeenCalled();
      const argumento = listSpy.push.calls.mostRecent().args[0];
      expect(argumento.fecha_registro).toBe('2025-12-28 13:50:00');
      expect(argumento.activo).toBe(true);
    });

    it('debe usar la fecha actual si no se proporciona fecha_registro', async () => {
      const mockHistorial = {
        diagnostico_presuntivo: 'Test sin fecha',
        paciente_id: 'pac1'
      };

      const mockRef = { key: 'nuevo-id' };
      const listSpy = jasmine.createSpyObj('AngularFireList', ['push']);
      listSpy.push.and.returnValue(Promise.resolve(mockRef));
      dbSpy.list.and.returnValue(listSpy);

      await service.crearHistorial(mockHistorial);

      const argumento = listSpy.push.calls.mostRecent().args[0];
      expect(argumento.fecha_registro).toBeDefined();
      expect(argumento.created_at).toBeDefined();
    });
  });

  describe('Búsqueda de historiales', () => {
    it('debe buscar en todos los campos relevantes', (done) => {
      const mockHistoriales = [
        {
          payload: {
            key: 'id1',
            val: () => ({
              diagnostico_presuntivo: 'Gastroenteritis',
              manejo_terapeutico: 'Antibióticos',
              fecha_registro: '2025-12-28 15:30:00',
              activo: true
            })
          }
        },
        {
          payload: {
            key: 'id2',
            val: () => ({
              diagnostico_presuntivo: 'Control de rutina',
              manejo_terapeutico: 'Revisión general',
              fecha_registro: '2025-12-27 10:00:00',
              activo: true
            })
          }
        }
      ];

      const listSpy = jasmine.createSpyObj('AngularFireList', ['snapshotChanges']);
      listSpy.snapshotChanges.and.returnValue(of(mockHistoriales as any));
      dbSpy.list.and.returnValue(listSpy);

      service.buscarHistoriales('gastro').subscribe(historiales => {
        expect(historiales.length).toBe(1);
        expect(historiales[0].diagnostico_presuntivo).toBe('Gastroenteritis');
        done();
      });
    });

    it('debe ser case-insensitive en la búsqueda', (done) => {
      const mockHistoriales = [
        {
          payload: {
            key: 'id1',
            val: () => ({
              diagnostico_presuntivo: 'Gastroenteritis',
              fecha_registro: '2025-12-28 15:30:00',
              activo: true
            })
          }
        }
      ];

      const listSpy = jasmine.createSpyObj('AngularFireList', ['snapshotChanges']);
      listSpy.snapshotChanges.and.returnValue(of(mockHistoriales as any));
      dbSpy.list.and.returnValue(listSpy);

      service.buscarHistoriales('GASTRO').subscribe(historiales => {
        expect(historiales.length).toBe(1);
        done();
      });
    });
  });
});

