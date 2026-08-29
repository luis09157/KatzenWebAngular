import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ClientesService } from '../clientes/clientes.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoggerService } from '../core/logger.service';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { staffRoleIsVeterinarioOperativo } from '../core/config/staff-role.config';
import {
  CITA_DURACION_DEFAULT_MIN,
  CITA_DURACION_MINIMA_MIN
} from './cita-agenda.util';
import {
  ClientePacientePickerFields
} from '../shared/admin/cliente-paciente-picker.models';
import { StaffPickerFields } from '../shared/admin/staff-picker.models';
import {
  mensajeHintClientePaciente
} from '../shared/components/flow-hint/flow-hint.util';

@Component({
  selector: 'app-cita-dialog',
  templateUrl: './cita-dialog.component.html',
  styleUrls: ['./cita-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'DD/MM/YYYY',
        },
        display: {
          dateInput: 'DD/MM/YYYY',
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
  ]
})
export class CitaDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  citaForm: FormGroup;
  modoVer = false;
  clientes: any[] = [];
  pacientes: any[] = [];
  motivos: string[] = [
    'Consulta General',
    'Vacunación',
    'Desparasitación',
    'Esterilización/Castración',
    'Cirugía',
    'Emergencia',
    'Control Post-operatorio',
    'Revisión de Heridas',
    'Tratamiento Dental',
    'Análisis de Sangre',
    'Radiografía',
    'Ecografía',
    'Dermatología',
    'Oftalmología',
    'Cardiología',
    'Neurología',
    'Oncología',
    'Fisioterapia',
    'Rehabilitación',
    'Control de Peso',
    'Nutrición',
    'Comportamiento',
    'Grooming (Peluquería)',
    'Otro'
  ];
  /** Campos del picker alineados al FormGroup de citas (nombreCliente legacy). */
  readonly pickerFields: ClientePacientePickerFields = {
    clienteId: 'cliente_id',
    pacienteId: 'paciente_id',
    clienteNombre: 'nombreCliente',
    pacienteNombre: 'paciente'
  };
  readonly staffPickerFields: StaffPickerFields = {
    uidField: 'veterinario_id',
    nombreField: 'veterinario'
  };
  /** doctor | administrador pueden fechas pasadas */
  puedeAgendarFechaPasada = false;
  readonly duracionDefault = CITA_DURACION_DEFAULT_MIN;

  /** Spec 048 — dueño → mascota → agenda. */
  get hintCita(): string {
    if (this.modoVer) return '';
    const base = mensajeHintClientePaciente(this.citaForm, {
      clienteId: 'cliente_id',
      pacienteId: 'paciente_id'
    });
    if (base) return base;
    const fecha = this.citaForm.get('fecha')?.value;
    const hora = this.citaForm.get('hora')?.value;
    if (!fecha || !hora) {
      return 'Paso 3: indica fecha, hora y veterinario para la cita.';
    }
    return '';
  }

  constructor(
    public dialogRef: MatDialogRef<CitaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private clientesService: ClientesService,
    private pacientesService: PacientesService,
    private dateAdapter: DateAdapter<any>,
    private logger: LoggerService,
    private authProfile: AuthProfileService
  ) {
    this.modoVer = data.modoVer;

    let fecha = '';
    let hora = '';

    const procesarFecha = (fechaString: string) => {
      try {
        if (fechaString.includes('T')) {
          const fechaPart = fechaString.split('T')[0];
          const horaPart = fechaString.split('T')[1];
          const horaVal = horaPart.split(':')[0] + ':' + horaPart.split(':')[1];
          return { fecha: fechaPart, hora: horaVal };
        }
        return { fecha: fechaString, hora: '00:00' };
      } catch (error) {
        this.logger.error('Error procesando fecha de cita:', error);
        return { fecha: '', hora: '' };
      }
    };

    if (data.cita?.fecha) {
      const resultado = procesarFecha(data.cita.fecha);
      fecha = resultado.fecha;
      hora = data.cita.hora || resultado.hora;
    } else if (data.cita?.fecha_hora) {
      const resultado = procesarFecha(data.cita.fecha_hora);
      fecha = resultado.fecha;
      hora = resultado.hora;
    }

    const duracionInicial =
      data.cita?.duracion_minutos != null && Number(data.cita.duracion_minutos) >= CITA_DURACION_MINIMA_MIN
        ? Number(data.cita.duracion_minutos)
        : CITA_DURACION_DEFAULT_MIN;

    this.citaForm = this.fb.group({
      id: [data.cita?.id || ''],
      cliente_id: [data.cita?.cliente_id || '', Validators.required],
      paciente_id: [data.cita?.paciente_id || '', Validators.required],
      paciente: [data.cita?.paciente || ''],
      fecha: [fecha, [Validators.required, this.validarFecha.bind(this)]],
      hora: [hora, [Validators.required, this.validarHora.bind(this)]],
      motivo: [data.cita?.motivo || '', Validators.required],
      estado: [data.cita?.estado || 'pendiente', Validators.required],
      veterinario: [data.cita?.veterinario || ''],
      veterinario_id: [data.cita?.veterinario_id || '', Validators.required],
      duracion_minutos: [
        duracionInicial,
        [Validators.required, Validators.min(CITA_DURACION_MINIMA_MIN)]
      ],
      motivo_cancelacion: [data.cita?.motivo_cancelacion || ''],
      observaciones: [data.cita?.observaciones || ''],
      nombreCliente: [data.cita?.nombreCliente || '']
    });
  }

  getDisplayValue(field: string): string {
    const raw = this.data?.cita?.[field] ?? this.citaForm.get(field)?.value;
    if (raw == null || raw === '') {
      return '—';
    }
    return String(raw).trim() || '—';
  }

  getDisplayCliente(): string {
    const nombre = this.citaForm.get('nombreCliente')?.value;
    if (nombre) {
      return String(nombre).split(' - ')[0].trim() || nombre;
    }
    const cliente = this.clientes.find(c => c.id === this.data?.cita?.cliente_id);
    if (cliente) {
      return [cliente.nombre, cliente.apellidoPaterno, cliente.apellidoMaterno].filter(Boolean).join(' ');
    }
    return '—';
  }

  getDisplayPaciente(): string {
    const pacienteId = this.data?.cita?.paciente_id ?? this.citaForm.get('paciente_id')?.value;
    const paciente = this.pacientes.find(p => p.id === pacienteId);
    if (paciente?.nombre) {
      return paciente.especie ? `${paciente.nombre} (${paciente.especie})` : paciente.nombre;
    }
    const nombreForm = this.citaForm.get('paciente')?.value;
    if (nombreForm) return String(nombreForm);
    return 'Paciente no asignado';
  }

  getDisplayFecha(): string {
    const raw = this.citaForm.get('fecha')?.value || this.data?.cita?.fecha;
    if (!raw) {
      return '—';
    }
    if (typeof raw === 'string' && raw.includes('T')) {
      const [fecha] = raw.split('T');
      const [y, m, d] = fecha.split('-');
      return `${d}/${m}/${y}`;
    }
    try {
      const date = new Date(raw);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-MX');
      }
    } catch {
      return String(raw);
    }
    return String(raw);
  }

  getDisplayEstado(): string {
    const estado = this.getDisplayValue('estado');
    if (estado === '—') {
      return estado;
    }
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  }

  getDisplayDuracion(): string {
    const d = this.data?.cita?.duracion_minutos ?? this.citaForm.get('duracion_minutos')?.value;
    const n = Number(d);
    if (!Number.isFinite(n) || n < CITA_DURACION_MINIMA_MIN) {
      return `${CITA_DURACION_DEFAULT_MIN} min`;
    }
    return `${Math.floor(n)} min`;
  }

  async ngOnInit() {
    this.dateAdapter.setLocale('es-ES');

    try {
      const role = await this.authProfile.getEffectiveStaffRole();
      this.puedeAgendarFechaPasada = staffRoleIsVeterinarioOperativo(role);
      this.citaForm.get('fecha')?.updateValueAndValidity({ emitEvent: false });
    } catch (error) {
      this.logger.error('No se pudo resolver rol staff en cita:', error);
      this.puedeAgendarFechaPasada = false;
    }

    this.citaForm.get('estado')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(estado => this.syncMotivoCancelacionValidators(estado));

    this.syncMotivoCancelacionValidators(this.citaForm.get('estado')!.value);

    if (this.modoVer) {
      this.cargarClientes();
      this.cargarPacientes();
    }

    if (this.data.cita) {
      this.establecerValoresEdicion();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private syncMotivoCancelacionValidators(estado: string): void {
    const control = this.citaForm.get('motivo_cancelacion');
    if (!control) {
      return;
    }
    if (String(estado || '').toLowerCase() === 'cancelada') {
      control.setValidators([Validators.required, Validators.minLength(3)]);
    } else {
      control.clearValidators();
    }
    control.updateValueAndValidity({ emitEvent: false });
  }

  cargarClientes() {
    this.clientesService.getClientes().pipe(takeUntil(this.destroy$)).subscribe({
      next: clientes => {
        this.clientes = clientes || [];
      },
      error: error => {
        this.logger.error('Error al cargar clientes en cita:', error);
      }
    });
  }

  cargarPacientes() {
    this.pacientesService.getPacientes().pipe(takeUntil(this.destroy$)).subscribe({
      next: pacientes => {
        this.pacientes = pacientes || [];
      },
      error: error => {
        this.logger.error('Error al cargar pacientes en cita:', error);
      }
    });
  }

  async guardar() {
    this.syncMotivoCancelacionValidators(this.citaForm.get('estado')!.value);
    if (this.citaForm.invalid) {
      this.citaForm.markAllAsTouched();
      return;
    }

    const formValue = { ...this.citaForm.value };

    if (formValue.fecha && formValue.hora) {
      const fecha = new Date(formValue.fecha);
      const [horas, minutos] = formValue.hora.split(':');
      fecha.setHours(parseInt(horas, 10), parseInt(minutos, 10));
      formValue.fecha = fecha.toISOString();
      formValue.fecha_hora = fecha.toISOString().slice(0, 16);
    }

    formValue.veterinario = String(formValue.veterinario || '').trim();
    formValue.veterinario_id = String(formValue.veterinario_id || '').trim();
    formValue.duracion_minutos = Number(formValue.duracion_minutos) || CITA_DURACION_DEFAULT_MIN;

    if (String(formValue.estado).toLowerCase() !== 'cancelada') {
      delete formValue.motivo_cancelacion;
    } else {
      formValue.motivo_cancelacion = String(formValue.motivo_cancelacion || '').trim();
    }

    delete formValue.nombreCliente;
    delete formValue.paciente;
    this.dialogRef.close(formValue);
  }

  cerrar() {
    this.dialogRef.close();
  }

  validarFecha(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return { required: true };
    }

    if (this.puedeAgendarFechaPasada) {
      return null;
    }

    const fecha = new Date(control.value);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fecha < hoy) {
      return { fechaPasada: true };
    }

    return null;
  }

  validarHora(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return { required: true };
    }
    const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!horaRegex.test(control.value)) {
      return { formatoInvalido: true };
    }
    return null;
  }

  esFormularioValido(): boolean {
    return !!this.citaForm.valid &&
      !!this.citaForm.get('cliente_id')?.value &&
      !!this.citaForm.get('paciente_id')?.value &&
      !!this.citaForm.get('fecha')?.value &&
      !!this.citaForm.get('hora')?.value &&
      !!this.citaForm.get('motivo')?.value &&
      (!!this.citaForm.get('veterinario_id')?.value || !!this.citaForm.get('veterinario')?.value) &&
      Number(this.citaForm.get('duracion_minutos')?.value) >= CITA_DURACION_MINIMA_MIN;
  }

  get muestraMotivoCancelacion(): boolean {
    return String(this.citaForm.get('estado')?.value || '').toLowerCase() === 'cancelada';
  }

  establecerValoresEdicion() {
    const cita = this.data.cita;
    if (!cita) return;

    this.citaForm.patchValue({
      cliente_id: cita.cliente_id || '',
      paciente_id: cita.paciente_id || '',
      paciente: cita.paciente || '',
      motivo: cita.motivo || '',
      estado: cita.estado || 'pendiente',
      veterinario: cita.veterinario || '',
      veterinario_id: cita.veterinario_id || '',
      duracion_minutos:
        cita.duracion_minutos != null && Number(cita.duracion_minutos) >= CITA_DURACION_MINIMA_MIN
          ? Number(cita.duracion_minutos)
          : CITA_DURACION_DEFAULT_MIN,
      motivo_cancelacion: cita.motivo_cancelacion || '',
      observaciones: cita.observaciones || '',
      nombreCliente: cita.nombreCliente || ''
    });
    this.syncMotivoCancelacionValidators(cita.estado || 'pendiente');
  }
}
