import { Component, Inject, OnInit, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VacunasService } from './vacunas.service';
import { ClientesService } from '../clientes/clientes.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { Cliente } from '../core/models';
import {
  AltaRapidaPickerDeps,
  crearClienteRapidoDesdePicker,
  crearMascotaRapidaDesdePicker,
} from '../shared/admin/alta-rapida-picker.helper';
import { ClientePacientePickerComponent } from '../shared/admin/cliente-paciente-picker.component';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { LoggerService } from '../core/logger.service';
import { CurrentStaffService } from '../core/services/current-staff.service';
import { ADMIN_DIALOG_DETAIL } from '../core/config/admin-ui.config';
import { ClientePacientePickerFields, ClientePacienteSelection } from '../shared/admin/cliente-paciente-picker.models';
import { StaffPickerFields } from '../shared/admin/staff-picker.models';
import { AsegurarRefuerzoResultado } from '../recordatorios/recordatorios.service';
import { formatRtdbLocal, resolverFechaRecordatorioRefuerzo } from './vacuna-recordatorio.util';
import { mensajeHintClientePaciente } from '../shared/components/flow-hint/flow-hint.util';
import { fusionarTiposConejoEnCatalogo, TIPOS_VACUNAS_FALLBACK } from './esquema-vacuna.defaults';
import { ConfirmacionEsquemaResultado, SugerenciaEsquema } from './esquema-vacuna.models';
import { esPacienteFallecido, extraerHoraHhMm, sugerirEsquema } from './esquema-vacuna.util';
import {
  VacunaEsquemaConfirmDialogComponent,
  VacunaEsquemaConfirmData,
} from './vacuna-esquema-confirm-dialog.component';

@Component({
  selector: 'app-vacuna-dialog',
  templateUrl: './vacuna-dialog.component.html',
  styleUrls: ['./vacuna-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class VacunaDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild(ClientePacientePickerComponent) picker?: ClientePacientePickerComponent;
  vacunaForm: FormGroup;
  isEditMode = false;
  loading = false;
  pacienteInfo: any = null;
  private operationId: string = '';

  readonly pickerFields: ClientePacientePickerFields = {
    clienteId: 'idCliente',
    pacienteId: 'idPaciente',
    clienteNombre: 'clienteDisplay',
    pacienteNombre: 'pacienteDisplay',
  };
  readonly staffPickerFields: StaffPickerFields = {
    uidField: 'veterinario_id',
    nombreField: 'veterinario',
  };

  get muestraPickerClientePaciente(): boolean {
    if (this.isEditMode) return false;
    const idPac = this.data?.paciente_id || this.data?.idPaciente;
    return !idPac;
  }

  /** Spec 048 */
  get hintVacuna(): string {
    if (!this.muestraPickerClientePaciente) return '';
    return mensajeHintClientePaciente(
      this.vacunaForm,
      { clienteId: 'idCliente', pacienteId: 'idPaciente' },
      'Paso 3: elige tipo de vacuna, dosis y fecha de aplicación.'
    );
  }

  tiposVacunas: any[] = [];
  sugerenciaActual: SugerenciaEsquema | null = null;
  private aplicandoSugerencia = false;

  /** Fallback 052: values legacy + flags semánticos opcionales. */
  private tiposVacunasFallback = TIPOS_VACUNAS_FALLBACK;

  // Dosis más comunes utilizadas por veterinarios
  dosisComunes = [
    { value: '0.5ml', label: '0.5ml' },
    { value: '1ml', label: '1ml' },
    { value: '1.5ml', label: '1.5ml' },
    { value: '2ml', label: '2ml' },
    { value: '2.5ml', label: '2.5ml' },
    { value: '3ml', label: '3ml' },
    { value: '5ml', label: '5ml' },
    { value: '10ml', label: '10ml' },
    { value: '0.25ml', label: '0.25ml' },
    { value: '0.75ml', label: '0.75ml' },
  ];

  // Estados de la vacuna
  estados = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'aplicada', label: 'Aplicada' },
    { value: 'cancelada', label: 'Cancelada' },
  ];

  constructor(
    private fb: FormBuilder,
    private vacunasService: VacunasService,
    private clientesService: ClientesService,
    private pacientesService: PacientesService,
    private dialogRef: MatDialogRef<VacunaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    private logger: LoggerService,
    private matDialog: MatDialog,
    private currentStaff: CurrentStaffService
  ) {
    this.vacunaForm = this.fb.group({
      // Información básica
      vacuna: ['', Validators.required],
      idVacuna: [''],
      dosis: ['', Validators.required],
      dosisPersonalizada: [''],
      lote: [''],

      // Fechas
      fechaAplicacion: ['', Validators.required],
      fechaRecordatorio: [''],
      proximaAplicacion: [''],
      intervalo: [0],

      // Estado y recordatorio
      aplicada: [false],
      recordatorio: [false],

      // Personal médico (035: UID + nombre)
      veterinario: [''],
      veterinario_id: [''],

      // Observaciones médicas
      reaccion: [''],
      observaciones: [''],

      // IDs de relación
      idPaciente: ['', Validators.required],
      idCliente: ['', Validators.required],
      clienteDisplay: [''],
      pacienteDisplay: [''],

      // Metadatos
      fechaRegistro: [''],
      fechaActualizacion: [''],
      stability: [0],
    });

    // Observar cambios en el campo dosis para validar dosis personalizada
    this.vacunaForm
      .get('dosis')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const dosisPersonalizadaControl = this.vacunaForm.get('dosisPersonalizada');
        if (value === 'personalizada') {
          dosisPersonalizadaControl?.setValidators([Validators.required]);
        } else {
          dosisPersonalizadaControl?.clearValidators();
          dosisPersonalizadaControl?.setValue('');
        }
        dosisPersonalizadaControl?.updateValueAndValidity();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarInformacionPaciente(pacienteId: string) {
    this.pacientesService
      .getPaciente(pacienteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((paciente) => {
        this.pacienteInfo = paciente;
        this.aplicarSugerenciaEsquema();
      });
  }

  getNombreCompletoCliente(cliente: any): string {
    const nombre = cliente.nombre || '';
    const apellidoPaterno = cliente.apellidoPaterno || '';
    const apellidoMaterno = cliente.apellidoMaterno || '';

    return `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim();
  }

  getPacienteMeta(): string {
    const p = this.data?.paciente || this.pacienteInfo;
    if (!p) return '';
    const parts: string[] = [];
    if (p.especie) parts.push(p.especie);
    if (p.raza) parts.push(p.raza);
    if (p.edad) {
      const edad = String(p.edad);
      parts.push(/sem|mes|año|anio|year/i.test(edad) ? edad : `${edad} años`);
    }
    if (p.peso) parts.push(`${p.peso} kg`);
    if (p.sexo) parts.push(p.sexo);
    return parts.join(' · ');
  }

  ngOnInit() {
    this.logger.log('VacunaDialogComponent - Datos recibidos:', this.data);

    // Cargar tipos de vacunas desde Firebase
    this.cargarTiposVacunas();

    // Establecer IDs si vienen en los datos
    if (this.data?.paciente_id || this.data?.idPaciente) {
      this.vacunaForm.patchValue({
        idPaciente: this.data.paciente_id || this.data.idPaciente,
      });
    }

    if (this.data?.cliente_id || this.data?.idCliente) {
      this.vacunaForm.patchValue({
        idCliente: this.data.cliente_id || this.data.idCliente,
      });
    }

    // Cargar información del paciente si no viene completa en data
    if ((this.data?.paciente_id || this.data?.idPaciente) && !this.data?.paciente) {
      this.cargarInformacionPaciente(this.data.paciente_id || this.data.idPaciente);
    }

    if (this.data && this.data.id) {
      this.isEditMode = true;
      this.vacunaForm.get('idPaciente')?.clearValidators();
      this.vacunaForm.get('idCliente')?.clearValidators();
      this.vacunaForm.get('idPaciente')?.updateValueAndValidity({ emitEvent: false });
      this.vacunaForm.get('idCliente')?.updateValueAndValidity({ emitEvent: false });
      this.vacunaForm.patchValue({
        vacuna: this.data.vacuna || '',
        idVacuna: this.data.idVacuna || '',
        dosis: this.data.dosis || '',
        lote: this.data.lote || '',
        fechaAplicacion: this.data.fechaAplicacion || this.data.fecha || '',
        fechaRecordatorio: this.data.fechaRecordatorio || '',
        proximaAplicacion: this.data.proximaAplicacion || '',
        intervalo: this.data.intervalo || 0,
        observaciones: this.data.observaciones || '',
        reaccion: this.data.reaccion || '',
        recordatorio: this.data.recordatorio || false,
        aplicada: this.data.aplicada || false,
        veterinario: this.data.veterinario || '',
        veterinario_id: this.data.veterinario_id || '',
        idPaciente: this.data.idPaciente || this.data.paciente_id || '',
        idCliente: this.data.idCliente || this.data.cliente_id || '',
        fechaRegistro: this.data.fechaRegistro || '',
        fechaActualizacion: this.data.fechaActualizacion || '',
        stability: this.data.stability || 0,
      });
    } else if (this.data?.paciente_id || this.data?.idPaciente) {
      this.vacunaForm.get('idPaciente')?.clearValidators();
      this.vacunaForm.get('idCliente')?.clearValidators();
      this.vacunaForm.get('idPaciente')?.updateValueAndValidity({ emitEvent: false });
      this.vacunaForm.get('idCliente')?.updateValueAndValidity({ emitEvent: false });
    }

    this.vacunaForm
      .get('vacuna')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.aplicarSugerenciaEsquema();
      });
    this.vacunaForm
      .get('fechaAplicacion')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.aplicandoSugerencia) return;
        this.aplicarSugerenciaEsquema(false);
        this.calcularProximaFecha();
      });
    this.aplicarSugerenciaEsquema(!this.isEditMode);
  }

  private altaRapidaDeps(): AltaRapidaPickerDeps {
    return {
      dialog: this.matDialog,
      clientesService: this.clientesService,
      pacientesService: this.pacientesService,
      loadingService: this.loadingService,
      errorMessages: this.errorMessages,
      picker: this.picker,
    };
  }

  async crearClienteRapido(prefill = ''): Promise<void> {
    await crearClienteRapidoDesdePicker(this.altaRapidaDeps(), prefill);
  }

  async crearMascotaRapida(cliente?: Cliente | null): Promise<void> {
    await crearMascotaRapidaDesdePicker(this.altaRapidaDeps(), cliente);
  }

  onClientePacienteSelected(sel: ClientePacienteSelection): void {
    this.pacienteInfo = sel.pacienteData || null;
    if (this.data) {
      this.data.paciente = sel.pacienteData;
      this.data.cliente = sel.clienteData;
    }
    this.aplicarSugerenciaEsquema();
  }

  async guardarVacuna() {
    // Prevenir múltiples ejecuciones
    if (this.loading) {
      this.logger.log('VacunaDialogComponent - Operación ya en progreso, ignorando llamada');
      return;
    }

    // Generar ID único para esta operación
    this.operationId = 'op_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    this.logger.log('VacunaDialogComponent - ID de operación:', this.operationId);

    // Validaciones personalizadas antes de guardar
    const errorValidacion = this.validarDatosFormulario();
    if (errorValidacion) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación Fallida',
        html: errorValidacion,
      });
      return;
    }

    if (this.vacunaForm.valid) {
      const confirmacion = await this.abrirConfirmacionEsquema();
      if (!confirmacion) {
        return;
      }

      this.loading = true;
      this.logger.log('VacunaDialogComponent - Iniciando guardado de vacuna');

      try {
        const vacunaData = { ...this.vacunaForm.value };
        this.aplicarConfirmacionAVacuna(vacunaData, confirmacion);

        // Si se seleccionó dosis personalizada, usar ese valor como dosis
        if (vacunaData.dosis === 'personalizada' && vacunaData.dosisPersonalizada) {
          vacunaData.dosis = vacunaData.dosisPersonalizada;
        }

        // Limpiar el campo dosisPersonalizada antes de enviar
        delete vacunaData.dosisPersonalizada;

        // Convertir fechas a formato ISO string si son objetos Date
        if (vacunaData.fechaAplicacion instanceof Date) {
          vacunaData.fechaAplicacion = vacunaData.fechaAplicacion.toISOString();
        }
        if (vacunaData.fechaRecordatorio instanceof Date) {
          vacunaData.fechaRecordatorio = formatRtdbLocal(vacunaData.fechaRecordatorio);
        }
        if (vacunaData.proximaAplicacion instanceof Date) {
          vacunaData.proximaAplicacion = formatRtdbLocal(vacunaData.proximaAplicacion).slice(0, 10);
        }

        const tipoVacuna = this.tiposVacunas.find((t) => t.value === vacunaData.vacuna);
        vacunaData.nombreVacunaLabel = tipoVacuna ? tipoVacuna.label : undefined;
        vacunaData.pacienteEstado = this.estadoPacienteActual();
        vacunaData.confirmadoPorUid = await this.currentStaff.getStaffId();

        let refuerzo: AsegurarRefuerzoResultado | undefined;
        const savingMsg = this.isEditMode ? LOADING_MESSAGES.updating : 'Guardando vacuna…';
        this.loadingService.show(savingMsg);

        if (this.isEditMode && this.data.id) {
          this.logger.log('VacunaDialogComponent - Actualizando vacuna existente');
          const actualizado = await this.vacunasService.actualizarVacuna(this.data.id, vacunaData);
          refuerzo = actualizado.refuerzo;

          if (vacunaData.idPaciente) {
            await this.registrarVacunaEnLog(vacunaData, 'editada');
          }
          this.loadingService.hide();
          await this.mostrarExitoGuardado('Vacuna actualizada correctamente', refuerzo);
        } else {
          this.logger.log('VacunaDialogComponent - Creando nueva vacuna - Operación ID:', this.operationId);
          const resultado = await this.vacunasService.crearVacuna(vacunaData);
          const vacunaId = resultado.key;
          vacunaData.id = vacunaId;
          refuerzo = resultado._refuerzo;

          this.logger.log(
            'VacunaDialogComponent - Vacuna creada con ID:',
            vacunaId,
            '- Operación ID:',
            this.operationId
          );

          if (vacunaData.idPaciente) {
            this.logger.log('VacunaDialogComponent - Registrando en log - Operación ID:', this.operationId);
            await this.registrarVacunaEnLog(vacunaData, 'creada');
          }
          this.loadingService.hide();
          await this.mostrarExitoGuardado('Vacuna creada correctamente', refuerzo);
        }

        this.logger.log('VacunaDialogComponent - Operación completada exitosamente, cerrando diálogo');
        this.loadingService.show();
        this.dialogRef.close(vacunaData);
      } catch (error) {
        this.logger.error('VacunaDialogComponent - Error al guardar vacuna:', error);
        this.loadingService.hide();
        setTimeout(
          () =>
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: this.errorMessages.getUserMessage(error, 'guardar vacuna'),
            }),
          0
        );
      } finally {
        this.loading = false;
      }
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.vacunaForm.controls).forEach((key) => {
        const control = this.vacunaForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });

      // Identificar campos faltantes
      const camposFaltantes: string[] = [];
      if (!this.vacunaForm.get('vacuna')?.value) camposFaltantes.push('Tipo de Vacuna');
      if (!this.vacunaForm.get('fechaAplicacion')?.value) camposFaltantes.push('Fecha de Aplicación');
      if (!this.vacunaForm.get('dosis')?.value) camposFaltantes.push('Dosis');

      Swal.fire({
        icon: 'warning',
        title: 'Campos Obligatorios Incompletos',
        html: `
          <p>Los siguientes campos son requeridos:</p>
          <ul style="text-align: left; margin: 10px 40px;">
            ${camposFaltantes.map((campo) => `<li>${campo}</li>`).join('')}
          </ul>
        `,
      });
    }
  }

  // Validar datos del formulario con reglas de negocio
  validarDatosFormulario(): string | null {
    const formValue = this.vacunaForm.value;

    if (this.muestraPickerClientePaciente && !formValue.idPaciente) {
      return 'Debes seleccionar <strong>cliente y paciente</strong> del catálogo';
    }

    // 1. Validar formato de dosis personalizada
    if (formValue.dosis === 'personalizada') {
      const dosisPersonalizada = formValue.dosisPersonalizada?.trim();
      if (!dosisPersonalizada) {
        return 'Debes especificar la <strong>dosis personalizada</strong>';
      }

      // Validar formato (número seguido de unidad)
      const formatoValido = /^\d+(\.\d+)?\s?(ml|mg|g|cc|UI|IU)$/i.test(dosisPersonalizada);
      if (!formatoValido) {
        return `
          <p>El formato de la dosis personalizada no es válido.</p>
          <p class="text-muted">Ejemplos válidos: <code>1ml</code>, <code>2.5 mg</code>, <code>500 UI</code></p>
        `;
      }
    }

    // 2. Validar que la fecha de próxima aplicación sea posterior a fecha de aplicación
    if (formValue.proximaAplicacion && formValue.fechaAplicacion) {
      const fechaAplicacion = new Date(formValue.fechaAplicacion);
      const proximaAplicacion = new Date(formValue.proximaAplicacion);

      if (proximaAplicacion <= fechaAplicacion) {
        return `
          <p>La <strong>Fecha de Próxima Dosis</strong> debe ser <strong>posterior</strong> a la Fecha de Aplicación.</p>
          <p class="text-muted">Por favor, ajusta las fechas.</p>
        `;
      }
    }

    // 3. Validar que la fecha de recordatorio sea futura si el recordatorio está activo
    if (formValue.recordatorio && formValue.fechaRecordatorio) {
      const fechaRecordatorio = new Date(formValue.fechaRecordatorio);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fechaRecordatorio < hoy) {
        return `
          <p>La <strong>Fecha de Recordatorio</strong> debe ser <strong>futura</strong>.</p>
          <p class="text-muted">No puedes crear recordatorios para fechas pasadas.</p>
        `;
      }
    }

    // 4. Validar fechas futuras solo para vacunas pendientes
    if (formValue.estado === 'pendiente' && formValue.fechaAplicacion) {
      const fechaAplicacion = new Date(formValue.fechaAplicacion);
      const hoy = new Date();
      const hace30Dias = new Date(hoy);
      hace30Dias.setDate(hoy.getDate() - 30);

      if (fechaAplicacion < hace30Dias) {
        return `
          <p>Estás intentando crear una vacuna <strong>pendiente</strong> con una fecha de más de 30 días en el pasado.</p>
          <p class="text-muted">¿Seguro que el estado debería ser "Pendiente" y no "Aplicada"?</p>
        `;
      }
    }

    return null; // Sin errores
  }

  cancelar() {
    this.dialogRef.close(false);
  }

  async eliminarVacuna() {
    if (!this.data?.id) return;

    // Obtener información de la vacuna para el mensaje
    const nombreVacuna = this.getNombreVacunaParaMostrar();
    const nombrePaciente = this.pacienteInfo?.nombre || 'este paciente';

    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Borrar esta vacuna?',
      html: `
        <p>Estás a punto de <strong>borrar</strong> la siguiente vacuna:</p>
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">
          <p><strong>Vacuna:</strong> ${nombreVacuna}</p>
          <p><strong>Paciente:</strong> ${nombrePaciente}</p>
        </div>
        <p class="text-muted">Se ocultará del listado. Los datos se conservan.</p>
      `,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      this.loading = true;

      try {
        // Usar baja lógica en lugar de eliminación física
        await this.vacunasService.bajaLogicaVacuna(this.data.id);

        // Registrar en el log de actividades si hay paciente
        if (this.data.idPaciente) {
          await this.registrarEliminacionEnLog();
        }

        this.loadingService.show();
        this.dialogRef.close(true);
      } catch (error) {
        this.logger.error('Error al eliminar vacuna:', error);
        this.loadingService.hide();
        setTimeout(
          () =>
            Swal.fire({
              icon: 'error',
              title: 'Error al borrar',
              text: this.errorMessages.getUserMessage(error, 'eliminar vacuna'),
            }),
          0
        );
      } finally {
        this.loading = false;
      }
    }
  }

  // Obtener nombre de vacuna para mostrar
  private getNombreVacunaParaMostrar(): string {
    const vacunaValue = this.data?.vacuna || this.vacunaForm.get('vacuna')?.value;
    if (!vacunaValue) return 'Vacuna';

    // Buscar en tipos de vacunas
    const tipoVacuna = this.tiposVacunas.find((t) => t.value === vacunaValue);
    if (tipoVacuna) return tipoVacuna.label;

    // Si no se encuentra, formatear el valor
    return vacunaValue
      .replace(/_/g, ' ')
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  async cambiarEstado(estado: string) {
    if (!this.data?.id) return;

    this.loading = true;

    try {
      if (estado === 'aplicada') {
        await this.vacunasService.marcarAplicada(this.data.id);
      } else {
        await this.vacunasService.marcarPendiente(this.data.id);
      }

      this.loadingService.show();
      this.dialogRef.close(true);
    } catch (error) {
      this.logger.error('Error al cambiar estado:', error);
      this.loadingService.hide();
      setTimeout(
        () =>
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.errorMessages.getUserMessage(error, 'cambiar estado vacuna'),
          }),
        0
      );
    } finally {
      this.loading = false;
    }
  }

  // Calcular próxima fecha automáticamente
  calcularProximaFecha() {
    const fecha = this.vacunaForm.get('fechaAplicacion')?.value;
    const intervalo = this.vacunaForm.get('intervalo')?.value;

    if (fecha && intervalo) {
      const fechaActual = new Date(fecha);
      const proximaFecha = new Date(fechaActual.getTime() + intervalo * 24 * 60 * 60 * 1000);
      this.vacunaForm.patchValue({
        proximaAplicacion: proximaFecha,
      });
    }
  }

  /** Hint UI: se creará recordatorio si hay próxima fecha y el vet confirma. */
  get hintRecordatorioRefuerzo(): string | null {
    if (this.sugerenciaActual && !this.sugerenciaActual.puedeSugerir && this.sugerenciaActual.mensajeSinEsquema) {
      return this.sugerenciaActual.mensajeSinEsquema;
    }
    const v = this.vacunaForm?.value;
    if (!v) return null;
    const fecha = resolverFechaRecordatorioRefuerzo({
      fechaRecordatorio: v.fechaRecordatorio,
      proximaAplicacion: v.proximaAplicacion,
      fechaAplicacion: v.fechaAplicacion,
      intervalo: v.intervalo,
    });
    if (!fecha) return null;
    return `Sugerencia de refuerzo: ${fecha.labelEs}. Se confirmará en el siguiente paso.`;
  }

  get hintEsquemaLive(): string {
    return this.sugerenciaActual?.fuenteCorta || '';
  }

  private estadoPacienteActual(): string {
    return String(this.pacienteInfo?.estado || this.data?.paciente?.estado || '');
  }

  private construirSugerencia(): SugerenciaEsquema {
    const paciente = this.data?.paciente || this.pacienteInfo;
    const tipoValue = this.vacunaForm.get('vacuna')?.value;
    const tipo = this.tiposVacunas.find((t: { value: string }) => t.value === tipoValue) || null;
    return sugerirEsquema({
      especie: paciente?.especie,
      tipoVacuna: tipoValue,
      tipo,
      edadTexto: paciente?.edad,
      fechaAplicacion: this.vacunaForm.get('fechaAplicacion')?.value,
      estadoPaciente: this.estadoPacienteActual(),
    });
  }

  private aplicarSugerenciaEsquema(patchForm = true): void {
    const tipo = this.vacunaForm.get('vacuna')?.value;
    if (!tipo) {
      this.sugerenciaActual = null;
      return;
    }
    this.sugerenciaActual = this.construirSugerencia();
    if (!patchForm || this.isEditMode) return;
    this.aplicandoSugerencia = true;
    const s = this.sugerenciaActual;
    if (s.puedeSugerir && s.intervaloSugeridoDias) {
      this.vacunaForm.patchValue({
        intervalo: s.intervaloSugeridoDias,
        proximaAplicacion: s.proximaSugerida || '',
      });
    } else if (!s.puedeSugerir) {
      this.vacunaForm.patchValue({
        intervalo: 0,
        proximaAplicacion: '',
      });
    }
    this.aplicandoSugerencia = false;
  }

  private async abrirConfirmacionEsquema(): Promise<ConfirmacionEsquemaResultado | undefined> {
    const sugerencia = this.construirSugerencia();
    this.sugerenciaActual = sugerencia;
    const v = this.vacunaForm.value;
    const data: VacunaEsquemaConfirmData = {
      sugerencia,
      nombreVacuna: this.getNombreVacunaParaMostrar(),
      nombrePaciente: this.data?.paciente?.nombre || this.pacienteInfo?.nombre || 'Paciente',
      especie: sugerencia.especieNormalizada,
      fechaAplicacion: v.fechaAplicacion,
      intervaloActual: v.intervalo,
      proximaActual: v.proximaAplicacion || v.fechaRecordatorio,
      horaActual: extraerHoraHhMm(v.fechaRecordatorio || v.proximaAplicacion),
      tipoVacuna: v.vacuna,
      fallecido: esPacienteFallecido(this.estadoPacienteActual()),
    };
    const ref = this.matDialog.open(VacunaEsquemaConfirmDialogComponent, {
      ...ADMIN_DIALOG_DETAIL,
      width: '560px',
      data,
    });
    return firstValueFrom(ref.afterClosed());
  }

  private aplicarConfirmacionAVacuna(
    vacunaData: Record<string, unknown>,
    confirmacion: ConfirmacionEsquemaResultado
  ): void {
    vacunaData.esquemaConfirmado = true;
    vacunaData.esquemaCodigo = confirmacion.esquemaCodigo;
    vacunaData.etapaEsquema = confirmacion.etapaEsquema;
    vacunaData.intervaloSugeridoDias = confirmacion.intervaloSugeridoDias ?? null;
    vacunaData.proximaSugerida = confirmacion.proximaSugerida ?? null;
    vacunaData.hintsMostrados = confirmacion.hintsMostrados || [];

    if (!confirmacion.agendar || esPacienteFallecido(this.estadoPacienteActual())) {
      vacunaData.agendarRefuerzo = false;
      vacunaData.recordatorio = false;
      vacunaData.intervalo = 0;
      vacunaData.intervaloConfirmadoDias = null;
      vacunaData.proximaAplicacion = null;
      vacunaData.fechaRecordatorio = null;
      return;
    }

    vacunaData.agendarRefuerzo = true;
    vacunaData.recordatorio = true;
    const fecha = confirmacion.fecha;
    const intervalo = confirmacion.intervaloDias || 0;
    vacunaData.intervalo = intervalo;
    vacunaData.intervaloConfirmadoDias = intervalo;
    if (fecha) {
      vacunaData.fechaRecordatorio = formatRtdbLocal(fecha);
      vacunaData.proximaAplicacion = formatRtdbLocal(fecha).slice(0, 10);
    }
  }

  private async mostrarExitoGuardado(base: string, refuerzo?: AsegurarRefuerzoResultado): Promise<void> {
    let text = base;
    if (refuerzo?.action === 'created') {
      text = `${base}\nSe creó recordatorio de refuerzo para el ${refuerzo.fechaLabel}.`;
    } else if (refuerzo?.action === 'updated') {
      text = `${base}\nSe actualizó el recordatorio de refuerzo (${refuerzo.fechaLabel}).`;
    } else if (refuerzo?.action === 'skipped' && refuerzo.reason === 'sin_fecha') {
      text = `${base}\nNo se agendó recordatorio de refuerzo.`;
    }
    await Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text,
    });
  }

  // Cargar tipos de vacunas desde Firebase con fallback
  cargarTiposVacunas() {
    this.logger.log('🔄 Cargando tipos de vacunas desde Firebase...');

    this.vacunasService
      .getTiposVacunas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tipos) => {
          this.logger.log('📦 Tipos de vacunas obtenidos de Firebase:', tipos);

          if (tipos && tipos.length > 0) {
            // Filtrar solo los activos; fusionar tipos conejo ola 3 si faltan (aditivo, no pisa legacy).
            this.tiposVacunas = fusionarTiposConejoEnCatalogo(
              tipos.filter((tipo: { activo?: boolean }) => tipo.activo !== false)
            );
            this.logger.log('✅ Tipos de vacunas cargados desde Firebase:', this.tiposVacunas.length);
          } else {
            // Si no hay datos en Firebase, usar fallback
            this.logger.log('⚠️ Firebase vacío, usando tipos predefinidos (fallback)');
            this.tiposVacunas = [...this.tiposVacunasFallback];
            this.inicializarTiposEnFirebase();
          }
        },
        error: (error) => {
          // Si hay error en Firebase, usar fallback
          this.logger.error('❌ Error al cargar tipos de vacunas desde Firebase:', error);
          this.logger.log('🔄 Usando tipos predefinidos (fallback)');
          this.tiposVacunas = [...this.tiposVacunasFallback];
        },
      });
  }

  // Inicializar tipos de vacunas en Firebase si no existen
  private async inicializarTiposEnFirebase() {
    try {
      this.logger.log('🔄 Inicializando tipos de vacunas en Firebase...');

      // Aquí podrías agregar lógica para poblar Firebase con los datos iniciales
      // Por ahora solo registramos el intento
      this.logger.log('ℹ️ Los tipos predefinidos están siendo usados como fallback');
      this.logger.log('ℹ️ Para persistir en Firebase, el administrador debe configurarlos manualmente');
    } catch (error) {
      this.logger.error('❌ Error al inicializar tipos en Firebase:', error);
    }
  }

  // Registrar vacuna en log de actividades
  private async registrarVacunaEnLog(vacunaData: any, accion: string): Promise<void> {
    try {
      // Validar que los datos necesarios estén presentes
      if (!vacunaData || !vacunaData.vacuna || !vacunaData.idPaciente) {
        this.logger.warn('VacunaDialogComponent - Datos insuficientes para registrar en log:', vacunaData);
        return;
      }

      const tipoVacuna = this.tiposVacunas.find((t) => t.value === vacunaData.vacuna);
      const nombreVacuna = tipoVacuna ? tipoVacuna.label : vacunaData.vacuna || 'Vacuna sin nombre';

      // Asegurar que fecha_aplicacion tenga un valor válido
      let fechaAplicacion = vacunaData.fechaAplicacion;
      if (!fechaAplicacion) {
        fechaAplicacion = new Date().toISOString();
        this.logger.warn('VacunaDialogComponent - fechaAplicacion undefined, usando fecha actual:', fechaAplicacion);
      }

      const datosLog = {
        nombre_vacuna: nombreVacuna,
        dosis: vacunaData.dosis || 'Sin dosis',
        fecha_aplicacion: fechaAplicacion,
        veterinario: vacunaData.veterinario || 'Sin veterinario',
        lote: vacunaData.lote || 'Sin lote',
        estado: vacunaData.aplicada ? 'aplicada' : 'pendiente',
        observaciones: vacunaData.observaciones || 'Sin observaciones',
      };

      this.logger.log('VacunaDialogComponent - Registrando en log:', datosLog);
      await this.pacientesService.registrarVacuna(vacunaData.idPaciente, datosLog);
      this.logger.log(`Vacuna ${accion} registrada en log exitosamente`);
    } catch (error) {
      this.logger.error('Error al registrar vacuna en log:', error);
      // No interrumpir el flujo principal si falla el log
    }
  }

  // Registrar eliminación en log de actividades
  private async registrarEliminacionEnLog(): Promise<void> {
    try {
      const tipoVacuna = this.tiposVacunas.find((t) => t.value === this.data.vacuna);
      const nombreVacuna = tipoVacuna ? tipoVacuna.label : this.data.vacuna;

      const actividad = {
        tipo: 'vacuna_eliminada',
        titulo: 'Vacuna Eliminada',
        descripcion: `${nombreVacuna} - ${this.data.dosis}`,
        icono: 'delete',
        color: '#f44336',
        datos: {
          nombre_vacuna: nombreVacuna,
          dosis: this.data.dosis,
          fecha_eliminacion: new Date().toISOString(),
          motivo: 'Eliminación por usuario',
        },
      };

      await this.pacientesService.agregarLogActividad(this.data.idPaciente, actividad);
      this.logger.log('Eliminación de vacuna registrada en log exitosamente');
    } catch (error) {
      this.logger.error('Error al registrar eliminación en log:', error);
    }
  }

  // Generar ID único (método auxiliar)
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
