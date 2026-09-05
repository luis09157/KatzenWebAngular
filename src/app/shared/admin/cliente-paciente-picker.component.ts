import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { Cliente, Paciente } from '../../core/models';
import { ClientesService } from '../../clientes/clientes.service';
import { PacientesService } from '../../pacientes/pacientes.service';
import { LoggerService } from '../../core/logger.service';
import { getClienteDisplayLabel, getClienteNombreCompleto } from '../../core/utils/cliente-search.util';
import { filtrarClientesTelefonoPrimero } from './cliente-picker-search.util';
import { filtrarPacientesDelCliente, getPacienteDisplayLabel } from '../../core/utils/paciente-search.util';
import { pacientePerteneceACliente } from '../../core/utils/paciente-cliente.util';
import { isPacienteActivo } from '../../core/utils/paciente-search.util';
import {
  ClientePacientePickerFields,
  ClientePacienteSelection,
  DEFAULT_CLIENTE_PACIENTE_FIELDS,
} from './cliente-paciente-picker.models';

@Component({
  selector: 'app-cliente-paciente-picker',
  templateUrl: './cliente-paciente-picker.component.html',
  styleUrls: ['./cliente-paciente-picker.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ClientePacientePickerComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  /** FormGroup padre que contiene cliente_id, paciente_id y nombres opcionales. */
  @Input({ required: true }) formGroup!: FormGroup;

  @Input() fields: ClientePacientePickerFields = DEFAULT_CLIENTE_PACIENTE_FIELDS;
  @Input() disabled = false;
  @Input() pacienteAutocomplete = false;
  /**
   * Spec 065 — muestra «Cliente nuevo» / «Agregar mascota». El padre abre los diálogos
   * (escucha `crearCliente` / `crearPaciente`) y luego llama `seleccionarClienteExterno` /
   * `seleccionarPacienteExterno`.
   */
  @Input() permitirCrear = false;
  /** `false` = la mascota es opcional: se emite `selectionChange` al elegir solo el dueño. */
  @Input() pacienteRequerido = true;
  /** Enfoca el campo de teléfono/nombre al montar (POS táctil). */
  @Input() autofocus = false;

  @Output() selectionChange = new EventEmitter<ClientePacienteSelection>();
  /** Texto escrito en la búsqueda (teléfono o nombre) para prellenar el alta. */
  @Output() crearCliente = new EventEmitter<string>();
  /** Dueño ya elegido al que se le agregará mascota. */
  @Output() crearPaciente = new EventEmitter<Cliente>();

  @ViewChild('clienteInput') clienteInput?: ElementRef<HTMLInputElement>;

  readonly clienteSearch = new FormControl<string | Cliente>('');
  readonly pacienteSearch = new FormControl<string>('');

  clientes: Cliente[] = [];
  pacientes: Paciente[] = [];
  pacientesDelCliente: Paciente[] = [];
  filteredClientes!: Observable<Cliente[]>;
  filteredPacientes!: Observable<Paciente[]>;
  clienteSeleccionado: Cliente | null = null;

  constructor(
    private clientesService: ClientesService,
    private pacientesService: PacientesService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.configurarAutocomplete();
    this.cargarDatos();

    if (this.disabled) {
      this.clienteSearch.disable({ emitEvent: false });
      this.pacienteSearch.disable({ emitEvent: false });
    }
  }

  ngAfterViewInit(): void {
    if (!this.autofocus || this.disabled) return;
    setTimeout(() => this.clienteInput?.nativeElement?.focus(), 80);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get fieldNames(): Required<ClientePacientePickerFields> {
    return {
      clienteId: this.fields.clienteId || DEFAULT_CLIENTE_PACIENTE_FIELDS.clienteId,
      pacienteId: this.fields.pacienteId || DEFAULT_CLIENTE_PACIENTE_FIELDS.pacienteId,
      clienteNombre: this.fields.clienteNombre || DEFAULT_CLIENTE_PACIENTE_FIELDS.clienteNombre,
      pacienteNombre: this.fields.pacienteNombre || DEFAULT_CLIENTE_PACIENTE_FIELDS.pacienteNombre,
    };
  }

  private configurarAutocomplete(): void {
    this.filteredClientes = this.clienteSearch.valueChanges.pipe(
      startWith(''),
      map((value) => filtrarClientesTelefonoPrimero(this.clientes, this.valorBusquedaCliente(value)))
    );

    this.filteredPacientes = this.pacienteSearch.valueChanges.pipe(
      startWith(''),
      map((value) => filtrarPacientesDelCliente(this.pacientes, this.clienteSeleccionado?.id, value))
    );
  }

  private valorBusquedaCliente(value: string | Cliente | null): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return getClienteDisplayLabel(value);
  }

  private cargarDatos(): void {
    this.clientesService
      .getClientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clientes) => {
          this.clientes = clientes || [];
          this.restaurarSeleccionEdicion();
        },
        error: (error) => {
          this.logger.error('ClientePacientePicker: error cargando clientes', error);
          this.clientes = [];
        },
      });

    this.pacientesService
      .getPacientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pacientes) => {
          this.pacientes = pacientes || [];
          this.restaurarSeleccionEdicion();
        },
        error: (error) => {
          this.logger.error('ClientePacientePicker: error cargando pacientes', error);
          this.pacientes = [];
        },
      });
  }

  /** Restaura cliente/paciente cuando el formulario padre ya trae IDs (edición). */
  private restaurarSeleccionEdicion(): void {
    if (!this.formGroup || !this.clientes.length || !this.pacientes.length) return;

    const { clienteId, pacienteId, clienteNombre, pacienteNombre } = this.fieldNames;
    const idCliente = this.formGroup.get(clienteId)?.value;
    const idPaciente = this.formGroup.get(pacienteId)?.value;

    if (!idCliente || idCliente === 'manual') return;

    const cliente = this.clientes.find((c) => c.id === idCliente);
    if (!cliente) return;

    this.clienteSeleccionado = cliente;
    this.clienteSearch.setValue(getClienteDisplayLabel(cliente), { emitEvent: false });
    this.actualizarPacientesDelCliente(cliente.id);

    if (idPaciente && idPaciente !== 'manual') {
      const paciente = this.pacientesDelCliente.find((p) => p.id === idPaciente);
      if (paciente) {
        this.formGroup.patchValue(
          {
            [pacienteId]: paciente.id,
            [pacienteNombre]: paciente.nombre || this.formGroup.get(pacienteNombre)?.value || '',
            [clienteNombre]: getClienteNombreCompleto(cliente),
          },
          { emitEvent: false }
        );
        if (this.pacienteAutocomplete) {
          this.pacienteSearch.setValue(getPacienteDisplayLabel(paciente), { emitEvent: false });
        }
      }
    } else if (this.formGroup.get(clienteNombre)?.value) {
      this.clienteSearch.setValue(this.formGroup.get(clienteNombre)?.value || getClienteDisplayLabel(cliente), {
        emitEvent: false,
      });
    }
  }

  onClienteSelected(cliente: Cliente): void {
    this.clienteSeleccionado = cliente;
    const { clienteId, pacienteId, clienteNombre, pacienteNombre } = this.fieldNames;

    this.formGroup.patchValue({
      [clienteId]: cliente.id,
      [clienteNombre]: getClienteNombreCompleto(cliente),
      [pacienteId]: '',
      [pacienteNombre]: '',
    });

    this.clienteSearch.setValue(getClienteDisplayLabel(cliente), { emitEvent: false });
    this.pacienteSearch.setValue('', { emitEvent: false });
    this.actualizarPacientesDelCliente(cliente.id);

    if (!this.pacienteRequerido) {
      this.selectionChange.emit({
        cliente_id: cliente.id || '',
        cliente: getClienteNombreCompleto(cliente),
        paciente_id: '',
        paciente: '',
        clienteData: cliente,
      });
    }
  }

  /** Texto libre actual de la búsqueda (para prellenar teléfono/nombre en el alta). */
  get textoBusquedaCliente(): string {
    const v = this.clienteSearch.value;
    return typeof v === 'string' ? v.trim() : '';
  }

  solicitarCrearCliente(): void {
    if (this.disabled) return;
    this.crearCliente.emit(this.textoBusquedaCliente);
  }

  solicitarCrearPaciente(): void {
    if (this.disabled || !this.clienteSeleccionado) return;
    this.crearPaciente.emit(this.clienteSeleccionado);
  }

  /**
   * Spec 065 — selecciona un cliente recién creado (aún puede no venir en el stream RTDB).
   * Emite `selectionChange` solo si la mascota es opcional.
   */
  seleccionarClienteExterno(cliente: Cliente): void {
    if (!cliente?.id) return;
    if (!this.clientes.some((c) => c.id === cliente.id)) {
      this.clientes = [cliente, ...this.clientes];
    }
    this.onClienteSelected(cliente);
  }

  /** Spec 065 — selecciona una mascota recién creada para el dueño actual y emite la selección. */
  seleccionarPacienteExterno(paciente: Paciente, cliente?: Cliente): void {
    if (!paciente?.id) return;
    if (cliente?.id && this.clienteSeleccionado?.id !== cliente.id) {
      this.seleccionarClienteExterno(cliente);
    }
    if (!this.clienteSeleccionado) return;
    if (!this.pacientes.some((p) => p.id === paciente.id)) {
      this.pacientes = [paciente, ...this.pacientes];
    }
    if (!this.pacientesDelCliente.some((p) => p.id === paciente.id)) {
      this.pacientesDelCliente = [paciente, ...this.pacientesDelCliente];
    }
    this.onPacienteSelected(paciente.id);
    if (this.pacienteAutocomplete) {
      this.pacienteSearch.setValue(getPacienteDisplayLabel(paciente), { emitEvent: false });
    }
  }

  onPacienteSelected(pacienteId: string): void {
    const paciente = this.pacientesDelCliente.find((p) => p.id === pacienteId);
    if (!paciente || !this.clienteSeleccionado) return;

    const { clienteId, pacienteId: pacienteField, clienteNombre, pacienteNombre } = this.fieldNames;

    this.formGroup.patchValue({
      [pacienteField]: paciente.id,
      [pacienteNombre]: paciente.nombre || '',
      [clienteId]: this.clienteSeleccionado.id,
      [clienteNombre]: getClienteNombreCompleto(this.clienteSeleccionado),
    });

    this.selectionChange.emit({
      cliente_id: this.clienteSeleccionado.id!,
      cliente: getClienteNombreCompleto(this.clienteSeleccionado),
      paciente_id: paciente.id!,
      paciente: paciente.nombre || '',
      clienteData: this.clienteSeleccionado,
      pacienteData: paciente,
    });
  }

  onPacienteAutocompleteSelected(paciente: Paciente): void {
    if (!paciente?.id) return;
    this.onPacienteSelected(paciente.id);
    this.pacienteSearch.setValue(getPacienteDisplayLabel(paciente), { emitEvent: false });
  }

  limpiarCliente(): void {
    if (this.disabled) return;
    const { clienteId, pacienteId, clienteNombre, pacienteNombre } = this.fieldNames;
    this.clienteSeleccionado = null;
    this.pacientesDelCliente = [];
    this.clienteSearch.setValue('', { emitEvent: false });
    this.pacienteSearch.setValue('', { emitEvent: false });
    this.formGroup.patchValue({
      [clienteId]: '',
      [pacienteId]: '',
      [clienteNombre]: '',
      [pacienteNombre]: '',
    });
  }

  private actualizarPacientesDelCliente(clienteId: string | undefined): void {
    this.pacientesDelCliente = (this.pacientes || []).filter(
      (p) => pacientePerteneceACliente(p, clienteId) && isPacienteActivo(p)
    );
  }

  getClienteLabel = getClienteDisplayLabel;
  getPacienteLabel = getPacienteDisplayLabel;

  get clienteIdControl() {
    return this.formGroup.get(this.fieldNames.clienteId);
  }

  get pacienteIdControl() {
    return this.formGroup.get(this.fieldNames.pacienteId);
  }
}
