import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HistorialDialogComponent } from './historial-dialog.component';
import { HistorialesService } from './historiales.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

describe('HistorialDialogComponent', () => {
  let component: HistorialDialogComponent;
  let fixture: ComponentFixture<HistorialDialogComponent>;
  let historialesServiceSpy: jasmine.SpyObj<HistorialesService>;
  let pacientesServiceSpy: jasmine.SpyObj<PacientesService>;
  let usuariosServiceSpy: jasmine.SpyObj<UsuariosService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<HistorialDialogComponent>>;

  beforeEach(async () => {
    const historialesService = jasmine.createSpyObj('HistorialesService', ['crearHistorial', 'actualizarHistorial']);
    const pacientesService = jasmine.createSpyObj('PacientesService', ['getPaciente', 'registrarHistorialClinico']);
    const usuariosService = jasmine.createSpyObj('UsuariosService', ['getUsuarios']);
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
        MatNativeDateModule
      ],
      providers: [
        { provide: HistorialesService, useValue: historialesService },
        { provide: PacientesService, useValue: pacientesService },
        { provide: UsuariosService, useValue: usuariosService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: AngularFireStorage, useValue: storage },
        { 
          provide: MAT_DIALOG_DATA, 
          useValue: { 
            paciente_id: 'pac123',
            historial: null,
            modoVer: false
          } 
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HistorialDialogComponent);
    component = fixture.componentInstance;
    historialesServiceSpy = TestBed.inject(HistorialesService) as jasmine.SpyObj<HistorialesService>;
    pacientesServiceSpy = TestBed.inject(PacientesService) as jasmine.SpyObj<PacientesService>;
    usuariosServiceSpy = TestBed.inject(UsuariosService) as jasmine.SpyObj<UsuariosService>;
    dialogRefSpy = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<HistorialDialogComponent>>;

    // Mock datos
    pacientesServiceSpy.getPaciente.and.returnValue(of({
      id: 'pac123',
      nombre: 'Firulais',
      especie: 'Perro',
      raza: 'Labrador'
    }));

    usuariosServiceSpy.getUsuarios.and.returnValue(of([
      { nombre: 'Dr. Juan Pérez', perfil: 'Doctor' },
      { nombre: 'Dra. María López', perfil: 'Veterinario' }
    ]));
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

    it('debe cargar lista de doctores', () => {
      fixture.detectChanges();
      
      expect(usuariosServiceSpy.getUsuarios).toHaveBeenCalled();
      expect(component.doctores.length).toBe(2);
      expect(component.doctores[0].nombre).toBe('Dr. Juan Pérez');
    });
  });

  describe('Validación del formulario', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('debe requerir campos obligatorios', () => {
      const form = component.historialForm;
      
      expect(form.get('historia_clinica')?.hasError('required')).toBe(true);
      expect(form.get('diagnostico_presuntivo')?.hasError('required')).toBe(true);
      expect(form.get('manejo_terapeutico')?.hasError('required')).toBe(true);
      expect(form.get('peso')?.hasError('required')).toBe(true);
      expect(form.get('tr')?.hasError('required')).toBe(true);
      expect(form.get('hallazgos')?.hasError('required')).toBe(true);
      expect(form.get('medico_atendio')?.hasError('required')).toBe(true);
    });

    it('debe ser válido cuando todos los campos requeridos están llenos', () => {
      const form = component.historialForm;
      
      form.patchValue({
        historia_clinica: 'Historia de prueba',
        diagnostico_presuntivo: 'Diagnóstico de prueba',
        manejo_terapeutico: 'Tratamiento de prueba',
        peso: '25',
        tr: 'Normal',
        hallazgos: 'Sin hallazgos',
        medico_atendio: 'Dr. Juan Pérez',
        fecha_registro: new Date(),
        hora: 14,
        minuto: 30,
        paciente_id: 'pac123'
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
        diagnostico_presuntivo: 'Test',
        manejo_terapeutico: 'Test',
        peso: '25',
        tr: 'Normal',
        hallazgos: 'Test',
        medico_atendio: 'Dr. Juan Pérez',
        fecha_registro: new Date(2025, 11, 28), // 28 de diciembre de 2025
        hora: 13,
        minuto: 50,
        paciente_id: 'pac123'
      });

      historialesServiceSpy.crearHistorial.and.returnValue(Promise.resolve({ key: 'nuevo-id' }));
      pacientesServiceSpy.registrarHistorialClinico.and.returnValue(Promise.resolve());

      await component.guardarHistorial();

      const argumentoCrear = historialesServiceSpy.crearHistorial.calls.mostRecent().args[0];
      expect(argumentoCrear.fecha_registro).toBe('2025-12-28 13:50:00');
      expect(argumentoCrear.hora).toBeUndefined(); // Debe eliminarse
      expect(argumentoCrear.minuto).toBeUndefined(); // Debe eliminarse
    });
  });

  describe('Carga de historial existente', () => {
    it('debe cargar fecha y hora correctamente al editar', () => {
      // Recrear componente con datos de historial existente
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [HistorialDialogComponent],
        imports: [
          ReactiveFormsModule,
          NoopAnimationsModule,
          MatFormFieldModule,
          MatInputModule,
          MatSelectModule,
          MatDatepickerModule,
          MatNativeDateModule
        ],
        providers: [
          { provide: HistorialesService, useValue: historialesServiceSpy },
          { provide: PacientesService, useValue: pacientesServiceSpy },
          { provide: UsuariosService, useValue: usuariosServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: AngularFireStorage, useValue: jasmine.createSpyObj('AngularFireStorage', ['ref', 'upload']) },
          { 
            provide: MAT_DIALOG_DATA, 
            useValue: { 
              historial: {
                id: 'hist123',
                diagnostico_presuntivo: 'Test',
                fecha_registro: '2025-12-28 13:50:00',
                paciente_id: 'pac123'
              },
              modoVer: false
            } 
          }
        ]
      }).compileComponents();

      const newFixture = TestBed.createComponent(HistorialDialogComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      const fechaForm = newComponent.historialForm.get('fecha_registro')?.value;
      const horaForm = newComponent.historialForm.get('hora')?.value;
      const minutoForm = newComponent.historialForm.get('minuto')?.value;

      expect(fechaForm).toBeInstanceOf(Date);
      expect(fechaForm.getFullYear()).toBe(2025);
      expect(fechaForm.getMonth()).toBe(11); // Diciembre es mes 11
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
        diagnostico_presuntivo: 'Test',
        manejo_terapeutico: 'Test',
        peso: '25',
        tr: 'Normal',
        hallazgos: 'Test',
        medico_atendio: 'Dr. Juan Pérez',
        paciente_id: 'pac123'
      });

      component.loading = true;
      
      await component.guardarHistorial();
      
      expect(historialesServiceSpy.crearHistorial).not.toHaveBeenCalled();
    });

    it('no debe guardar si el formulario es inválido', async () => {
      const form = component.historialForm;
      form.patchValue({
        historia_clinica: '', // Campo requerido vacío
        diagnostico_presuntivo: 'Test'
      });

      await component.guardarHistorial();

      expect(historialesServiceSpy.crearHistorial).not.toHaveBeenCalled();
    });
  });
});

