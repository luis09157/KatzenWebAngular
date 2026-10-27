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
import {
  displayClienteAutocompleteValue,
  getClienteDisplayLabel,
  getClienteNombreCompleto,
} from '../../core/utils/cliente-search.util';
import { filtrarClientesTelefonoPrimero } from './cliente-picker-search.util';
import {
  displayPacienteAutocompleteValue,
  filtrarPacientesDelCliente,
  filtrarPacientesPickerDual,
  getPacienteDisplayLabel,
  getPacientePickerOptionLabel,
  getPacienteBusquedaExpedienteLabel,
  getPacienteNombre,
  getPacientePickerRazaEdadLabel,
  isPacienteActivo,
  ordenarPacientesPorNombre,
} from '../../core/utils/paciente-search.util';
import { getPacienteClienteId, pacientePerteneceACliente } from '../../core/utils/paciente-cliente.util';
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
  /**
   * Spec 085 — buscar por mascota sin dueño previo; al elegir mascota se rellena el dueño.
   * Activa autocomplete de paciente si aún no estaba.
   * 2026-10-26 (Luis): activo por defecto en todos los módulos y la mascota va primero,
   * porque las veterinarias conocen al paciente, no siempre al dueño.
   */
  @Input() busquedaDual = true;
  /** `false` = la mascota es opcional: se emite `selectionChange` al elegir solo el dueño. */
  @Input() pacienteRequerido = true;
  /** Enfoca el campo de teléfono/nombre al montar (POS táctil). */
  @Input() autofocus = false;
  /** Peluquería: la opción muestra raza y edad. El resto de módulos sigue con el dueño. */
  @Input() etiquetaMascota: 'dueno' | 'raza-edad' = 'dueno';

  @Output() selectionChange = new EventEmitter<ClientePacienteSelection>();
  /** Texto escrito en la búsqueda (teléfono o nombre) para prellenar el alta. */
  @Output() crearCliente = new EventEmitter<string>();
  /** Dueño ya elegido al que se le agregará mascota. */
  @Output() crearPaciente = new EventEmitter<Cliente>();

  @ViewChild('clienteInput') clienteInput?: ElementRef<HTMLInputElement>;
  @ViewChild('pacienteInput') pacienteInput?: ElementRef<HTMLInputElement>;

  readonly clienteSearch = new FormControl<string | Cliente>('');
  /** Objeto Paciente cuando hay selección (displayWith); string solo al tipear. */
  readonly pacienteSearch = new FormControl<string | Paciente>('');

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
    // Con búsqueda por mascota, el cursor empieza en la mascota (va primero).
    setTimeout(() => {
      const el = this.busquedaDualEfectiva ? this.pacienteInput?.nativeElement : this.clienteInput?.nativeElement;
      (el || this.clienteInput?.nativeElement)?.focus();
    }, 80);
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

  /** Autocomplete de mascota si el padre lo pide o si hay búsqueda dual. */
  get usaPacienteAutocomplete(): boolean {
    return this.pacienteAutocomplete || this.busquedaDual;
  }

  get busquedaDualEfectiva(): boolean {
    return this.busquedaDual;
  }

  get pacienteInputReadonly(): boolean {
    if (this.disabled) return true;
    if (this.busquedaDualEfectiva) return false;
    return !this.clienteSeleccionado;
  }

  get placeholderPaciente(): string {
    if (this.busquedaDualEfectiva && !this.clienteSeleccionado) {
      return 'Nombre de la mascota…';
    }
    return 'Buscar mascota del cliente…';
  }

  private configurarAutocomplete(): void {
    this.filteredClientes = this.clienteSearch.valueChanges.pipe(
      startWith(''),
      map((value) => filtrarClientesTelefonoPrimero(this.clientes, this.valorBusquedaCliente(value)))
    );

    this.filteredPacientes = this.pacienteSearch.valueChanges.pipe(
      startWith(''),
      map((value) => this.filtrarPacientesSugeridos(value))
    );
  }

  private filtrarPacientesSugeridos(value: string | Paciente | null): Paciente[] {
    const query = typeof value === 'string' ? value : '';
    if (this.busquedaDualEfectiva) {
      return ordenarPacientesPorNombre(
        filtrarPacientesPickerDual(this.pacientes, this.clienteSeleccionado?.id, query, (p) => this.duenoParaBuscar(p)),
        query
      ).slice(0, 50);
    }
    return filtrarPacientesDelCliente(this.pacientes, this.clienteSeleccionado?.id, query);
  }

  /** displayWith: objeto en writeValue; string solo al tipear. */
  displayCliente = displayClienteAutocompleteValue;
  displayPaciente = (value: Paciente | string | null | undefined): string => {
    if (this.etiquetaMascota === 'raza-edad' && value && typeof value !== 'string') {
      return getPacientePickerRazaEdadLabel(value);
    }
    return displayPacienteAutocompleteValue(value);
  };

  private nombreDuenoDePaciente(paciente: Paciente): string {
    const id = getPacienteClienteId(paciente);
    if (!id) return '';
    const cliente = this.clientes.find((c) => String(c.id) === id);
    return cliente ? getClienteNombreCompleto(cliente) : '';
  }

  /** Nombre y teléfono del dueño: se puede buscar la mascota por cualquiera de los dos. */
  private duenoParaBuscar(paciente: Paciente): string {
    const id = getPacienteClienteId(paciente);
    if (!id) return '';
    const cliente = this.clientes.find((c) => String(c.id) === id);
    if (!cliente) return '';
    return `${getClienteNombreCompleto(cliente)} ${String(cliente.telefono || '')}`.trim();
  }

  /** Opción como en el buscador de Pacientes: nombre en negritas… */
  nombreOpcionPaciente(paciente: Paciente): string {
    return getPacienteNombre(paciente) || 'Sin nombre';
  }

  /** …y «— especie · raza · edad · dueño» (peluquería sin dueño, como ya estaba). */
  detalleOpcionPaciente(paciente: Paciente): string {
    const dueno =
      this.etiquetaMascota === 'raza-edad' || this.clienteSeleccionado ? '' : this.nombreDuenoDePaciente(paciente);
    const full = getPacienteBusquedaExpedienteLabel(paciente, dueno);
    const nombre = this.nombreOpcionPaciente(paciente);
    return full.startsWith(`${nombre} `) ? full.slice(nombre.length).trim() : full;
  }

  labelOpcionPaciente(paciente: Paciente): string {
    if (this.etiquetaMascota === 'raza-edad') {
      return getPacientePickerRazaEdadLabel(paciente);
    }
    if (!this.busquedaDualEfectiva || this.clienteSeleccionado) {
      return getPacienteDisplayLabel(paciente);
    }
    return getPacientePickerOptionLabel(paciente, this.nombreDuenoDePaciente(paciente));
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

  /** Restaura cliente/paciente cuando el formulario padre ya trae IDs (alta rápida / edición). */
  private restaurarSeleccionEdicion(): void {
    if (!this.formGroup || !this.clientes.length) return;

    const { clienteId, pacienteId, clienteNombre, pacienteNombre } = this.fieldNames;
    const idCliente = String(this.formGroup.get(clienteId)?.value || '').trim();
    const idPaciente = String(this.formGroup.get(pacienteId)?.value || '').trim();

    if (!idCliente || idCliente === 'manual') return;

    const cliente = this.clientes.find((c) => String(c.id) === idCliente);
    if (!cliente) return;

    this.clienteSeleccionado = cliente;
    this.clienteSearch.setValue(cliente, { emitEvent: false });
    this.actualizarPacientesDelCliente(cliente.id);

    if (!this.pacientes.length) return;

    if (idPaciente && idPaciente !== 'manual') {
      const paciente =
        this.pacientesDelCliente.find((p) => String(p.id) === idPaciente) ||
        this.pacientes.find((p) => String(p.id) === idPaciente);
      if (paciente) {
        if (!this.pacientesDelCliente.some((p) => String(p.id) === String(paciente.id))) {
          this.pacientesDelCliente = [paciente, ...this.pacientesDelCliente];
        }
        this.formGroup.patchValue(
          {
            [pacienteId]: paciente.id,
            [pacienteNombre]: paciente.nombre || this.formGroup.get(pacienteNombre)?.value || '',
            [clienteNombre]: getClienteNombreCompleto(cliente),
          },
          { emitEvent: false }
        );
        if (this.usaPacienteAutocomplete) {
          this.pacienteSearch.setValue(paciente, { emitEvent: false });
        }
      }
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

    this.clienteSearch.setValue(cliente, { emitEvent: false });
    this.pacienteSearch.setValue('', { emitEvent: true });
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
    if (this.usaPacienteAutocomplete) {
      this.pacienteSearch.setValue(paciente, { emitEvent: false });
    }
  }

  onPacienteSelected(pacienteId: string): void {
    const id = String(pacienteId || '').trim();
    if (!id) return;
    const paciente =
      this.pacientesDelCliente.find((p) => String(p.id) === id) || this.pacientes.find((p) => String(p.id) === id);
    if (!paciente) return;

    if (!this.clienteSeleccionado) {
      if (!this.asegurarClienteDesdePaciente(paciente)) return;
    }

    if (!this.clienteSeleccionado) return;

    if (!this.pacientesDelCliente.some((p) => String(p.id) === String(paciente.id))) {
      this.pacientesDelCliente = [paciente, ...this.pacientesDelCliente];
    }

    const { clienteId, pacienteId: pacienteField, clienteNombre, pacienteNombre } = this.fieldNames;
    const nombreDueno = getClienteNombreCompleto(this.clienteSeleccionado);

    this.formGroup.patchValue({
      [pacienteField]: paciente.id,
      [pacienteNombre]: paciente.nombre || '',
      [clienteId]: this.clienteSeleccionado.id,
      [clienteNombre]: nombreDueno,
    });

    // Autocomplete dueño: writeValue con objeto (displayWith); no string suelto.
    this.clienteSearch.setValue(this.clienteSeleccionado, { emitEvent: false });
    if (this.usaPacienteAutocomplete) {
      this.pacienteSearch.setValue(paciente, { emitEvent: false });
    }

    this.clienteIdControl?.updateValueAndValidity({ emitEvent: false });
    this.pacienteIdControl?.updateValueAndValidity({ emitEvent: false });

    this.selectionChange.emit({
      cliente_id: this.clienteSeleccionado.id!,
      cliente: nombreDueno,
      paciente_id: paciente.id!,
      paciente: paciente.nombre || '',
      clienteData: this.clienteSeleccionado,
      pacienteData: paciente,
    });
  }

  /**
   * Resuelve el dueño desde la mascota (búsqueda dual) sin borrar la selección de paciente.
   * @returns false si no hay cliente enlazado en catálogo.
   */
  private asegurarClienteDesdePaciente(paciente: Paciente): boolean {
    const idCliente = getPacienteClienteId(paciente);
    if (!idCliente) return false;
    const cliente = this.clientes.find((c) => String(c.id) === idCliente);
    if (!cliente) return false;

    this.clienteSeleccionado = cliente;
    this.clienteSearch.setValue(cliente, { emitEvent: false });
    this.actualizarPacientesDelCliente(cliente.id);
    return true;
  }

  onPacienteAutocompleteSelected(paciente: Paciente): void {
    if (!paciente?.id) return;
    this.onPacienteSelected(String(paciente.id));
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
