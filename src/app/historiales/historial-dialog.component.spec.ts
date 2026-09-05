import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HistorialDialogComponent } from './historial-dialog.component';
import { HistorialesService } from './historiales.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService } from '../core/loading.service';
import { LoggerService } from '../core/logger.service';
import { CurrentStaffService } from '../core/services/current-staff.service';

describe('HistorialDialogComponent', () => {
  let component: HistorialDialogComponent;
  let fixture: ComponentFixture<HistorialDialogComponent>;
  let historialesServiceSpy: jasmine.SpyObj<HistorialesService>;
  let pacientesServiceSpy: jasmine.SpyObj<PacientesService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<HistorialDialogComponent>>;

  const stubExtras = [
    { provide: ErrorMessagesService, useValue: { getUserMessage: () => 'error' } },
    { provide: LoadingService, useValue: { show: () => undefined, hide: () => undefined } },
    { provide: LoggerService, useValue: { log: () => undefined, error: () => undefined, warn: () => undefined } },
    { provide: CurrentStaffService, useValue: { getStaffId: async () => 'staff', getStaffLabel: async () => 'Staff' } },
  ];

  beforeEach(async () => {
    // Spec 016: al editar, el diálogo lee notas internas del nodo aislado.
    const historialesService = jasmine.createSpyObj('HistorialesService', [
      'crearHistorial',
      'actualizarHistorial',
      'getNotasInternas',
    ]);
    historialesService.getNotasInternas.and.resolveTo('');
    const pacientesService = jasmine.createSpyObj('PacientesService', ['getPaciente', 'registrarHistorialClinico']);
    const dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const storage = jasmine.createSpyObj('AngularFireStorage', ['ref', 'upload']);

    await TestBed.configureTestingModule({
      declarations: [HistorialDialogComponent],
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatCheckboxModule,
      ],
      providers: [
        { provide: HistorialesService, useValue: historialesService },
        { provide: PacientesService, useValue: pacientesService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: AngularFireStorage, useValue: storage },
        ...stubExtras,
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            paciente_id: 'pac123',
            historial: null,
            modoVer: false,
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HistorialDialogComponent);
    component = fixture.componentInstance;
    historialesServiceSpy = TestBed.inject(HistorialesService) as jasmine.SpyObj<HistorialesService>;
    pacientesServiceSpy = TestBed.inject(PacientesService) as jasmine.SpyObj<PacientesService>;
    dialogRefSpy = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<HistorialDialogComponent>>;

    pacientesServiceSpy.getPaciente.and.returnValue(
      of({
        id: 'pac123',
        nombre: 'Firulais',
        especie: 'Perro',
        raza: 'Labrador',
      })
    );
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Inicialización del formulario', () => {
    it('debe inicializar el formulario con valores por defecto', () => {
      fixture.detectChanges();

      expect(component.historialForm).toBeDefined();
      expect(component.historialForm.get('historia_clinica')).toBeDefined();
      expect(component.historialForm.get('diagnostico_presuntivo')).toBeDefined();
      expect(component.historialForm.get('fecha_registro')).toBeDefined();
      expect(component.historialForm.get('hora')).toBeDefined();
      expect(component.historialForm.get('minuto')).toBeDefined();
      expect(component.historialForm.get('medico_atendio_uid')).toBeDefined();
    });

    it('debe establecer la fecha y hora actual por defecto', () => {
      const ahora = new Date();
      fixture.detectChanges();

      const fechaForm = component.historialForm.get('fecha_registro')?.value;
      const horaForm = component.historialForm.get('hora')?.value;
      const minutoForm = component.historialForm.get('minuto')?.value;

      expect(fechaForm).toBeInstanceOf(Date);
      expect(horaForm).toBe(ahora.getHours());
      expect(minutoForm).toBe(ahora.getMinutes());
    });

    it('debe cargar información del paciente', () => {
      fixture.detectChanges();

      expect(pacientesServiceSpy.getPaciente).toHaveBeenCalledWith('pac123');
      expect(component.pacienteInfo).toBeDefined();
      expect(component.pacienteInfo.nombre).toBe('Firulais');
    });

    it('debe exponer campos del staff picker (035)', () => {
      expect(component.staffPickerFields.uidField).toBe('medico_atendio_uid');
      expect(component.staffPickerFields.nombreField).toBe('medico_atendio');
    });
  });

  describe('Validación del formulario', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('debe exigir solo motivo y nota (spec 069)', () => {
      const form = component.historialForm;

      expect(form.get('historia_clinica')?.hasError('required')).toBe(true);
      expect(form.get('notas_internas')?.hasError('required')).toBe(true);
      expect(form.get('diagnostico_presuntivo')?.hasError('required')).toBeFalsy();
      expect(form.get('manejo_terapeutico')?.hasError('required')).toBeFalsy();
      expect(form.get('peso')?.hasError('required')).toBeFalsy();
      expect(form.get('tr')?.hasError('required')).toBeFalsy();
      expect(form.get('hallazgos')?.hasError('required')).toBeFalsy();
      expect(form.get('medico_atendio_uid')?.hasError('required')).toBeFalsy();
    });

    it('debe ser válido con motivo + nota y defaults de fecha', () => {
      const form = component.historialForm;

      form.patchValue({
        historia_clinica: 'Historia de prueba',
        notas_internas: 'Nota de continuidad',
        paciente_id: 'pac123',
      });

      expect(form.valid).toBe(true);
    });
  });

  describe('Manejo de fecha y hora', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('debe generar arrays de horas y minutos correctamente', () => {
      expect(component.horas.length).toBe(24);
      expect(component.horas[0]).toBe(0);
      expect(component.horas[23]).toBe(23);

      expect(component.minutos.length).toBe(60);
      expect(component.minutos[0]).toBe(0);
      expect(component.minutos[59]).toBe(59);
    });

    it('debe formatear la fecha correctamente al guardar', async () => {
      const form = component.historialForm;

      form.patchValue({
        historia_clinica: 'Test',
        notas_internas: 'Nota',
        fecha_registro: new Date(2025, 11, 28),
        hora: 13,
        minuto: 50,
        paciente_id: 'pac123',
      });

      historialesServiceSpy.crearHistorial.and.returnValue(Promise.resolve({ key: 'nuevo-id' }));
      pacientesServiceSpy.registrarHistorialClinico.and.returnValue(Promise.resolve());

      await component.guardarHistorial();

      const argumentoCrear = historialesServiceSpy.crearHistorial.calls.mostRecent().args[0];
      expect(argumentoCrear.fecha_registro).toBe('2025-12-28 13:50:00');
      expect(argumentoCrear.hora).toBeUndefined();
      expect(argumentoCrear.minuto).toBeUndefined();
    });
  });

  describe('Carga de historial existente', () => {
    it('debe cargar fecha y hora correctamente al editar', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        declarations: [HistorialDialogComponent],
        imports: [
          ReactiveFormsModule,
          NoopAnimationsModule,
          MatFormFieldModule,
          MatInputModule,
          MatSelectModule,
          MatDatepickerModule,
          MatNativeDateModule,
          MatCheckboxModule,
        ],
        providers: [
          { provide: HistorialesService, useValue: historialesServiceSpy },
          { provide: PacientesService, useValue: pacientesServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: AngularFireStorage, useValue: jasmine.createSpyObj('AngularFireStorage', ['ref', 'upload']) },
          ...stubExtras,
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              historial: {
                id: 'hist123',
                diagnostico_presuntivo: 'Test',
                fecha_registro: '2025-12-28 13:50:00',
                paciente_id: 'pac123',
                medico_atendio: 'Dr. Juan Pérez',
                medico_atendio_uid: 'uid-doctor-1',
              },
              modoVer: false,
            },
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      }).compileComponents();

      const newFixture = TestBed.createComponent(HistorialDialogComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      const fechaForm = newComponent.historialForm.get('fecha_registro')?.value;
      const horaForm = newComponent.historialForm.get('hora')?.value;
      const minutoForm = newComponent.historialForm.get('minuto')?.value;

      expect(fechaForm).toBeInstanceOf(Date);
      expect(fechaForm.getFullYear()).toBe(2025);
      expect(fechaForm.getMonth()).toBe(11);
      expect(fechaForm.getDate()).toBe(28);
      expect(horaForm).toBe(13);
      expect(minutoForm).toBe(50);
    });
  });

  describe('Guardado de historiales', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('debe prevenir múltiples guardados simultáneos', async () => {
      const form = component.historialForm;
      form.patchValue({
        historia_clinica: 'Test',
        notas_internas: 'Nota',
        paciente_id: 'pac123',
      });

      component.loading = true;

      await component.guardarHistorial();

      expect(historialesServiceSpy.crearHistorial).not.toHaveBeenCalled();
    });

    it('no debe guardar si el formulario es inválido', async () => {
      const form = component.historialForm;
      form.patchValue({
        historia_clinica: '',
        diagnostico_presuntivo: 'Test',
      });

      await component.guardarHistorial();

      expect(historialesServiceSpy.crearHistorial).not.toHaveBeenCalled();
    });
  });
});
