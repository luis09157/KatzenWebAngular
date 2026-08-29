import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AsegurarRefuerzoResultado, RecordatoriosService } from './recordatorios.service';
import { PacientesService } from '../pacientes/pacientes.service';
import Swal from 'sweetalert2';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { CurrentStaffService } from '../core/services/current-staff.service';
import { ADMIN_DIALOG_DETAIL } from '../core/config/admin-ui.config';
import {
  ClientePacientePickerFields,
  ClientePacienteSelection
} from '../shared/admin/cliente-paciente-picker.models';
import {
  mensajeHintClientePaciente
} from '../shared/components/flow-hint/flow-hint.util';
import { TIPOS_DESPARASITACION } from './esquema-desparasitacion.defaults';
import { ConfirmacionDesparasitacionResultado, TipoDesparasitacion } from './esquema-desparasitacion.models';
import { normalizarTipoDesparasitacion, sugerirEsquemaDesparasitacion } from './esquema-desparasitacion.util';
import {
  DesparasitacionEsquemaConfirmDialogComponent,
  DesparasitacionEsquemaConfirmData
} from './desparasitacion-esquema-confirm-dialog.component';
import { esPacienteFallecido, extraerHoraHhMm } from '../vacunas/esquema-vacuna.util';
import { dayKeyLocal, formatRtdbLocal, labelFechaEs, parseFechaFlexible } from '../vacunas/vacuna-recordatorio.util';

@Component({
  selector: 'app-recordatorio-dialog',
  templateUrl: './recordatorio-dialog.component.html',
  styleUrls: ['./recordatorio-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class RecordatorioDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  recordatorioForm: FormGroup;
  isEditMode = false;
  loading = false;
  pacienteInfo: any = null;
  readonly tiposDesparasitacion = TIPOS_DESPARASITACION;

  readonly pickerFields: ClientePacientePickerFields = {
    clienteId: 'cliente_id',
    pacienteId: 'paciente_id',
    clienteNombre: 'cliente',
    pacienteNombre: 'paciente'
  };

  get muestraPickerClientePaciente(): boolean {
    if (this.isEditMode) return false;
    return !this.data?.paciente_id;
  }

  /** Spec 048 */
  get hintRecordatorio(): string {
    if (!this.muestraPickerClientePaciente) return '';
    return mensajeHintClientePaciente(
      this.recordatorioForm,
      { clienteId: 'cliente_id', pacienteId: 'paciente_id' },
      'Paso 3: título, tipo y fecha del recordatorio.'
    );
  }

  // Tipos de recordatorios predefinidos
  tiposRecordatorio = [
    { value: 'vacuna', label: 'Vacuna' },
    { value: 'desparasitacion', label: 'Desparasitación' },
    { value: 'consulta', label: 'Consulta' },
    { value: 'cirugia', label: 'Cirugía' },
    { value: 'revision', label: 'Revisión' },
    { value: 'medicamento', label: 'Medicamento' },
    { value: 'otro', label: 'Otro' }
  ];

  // Estados del recordatorio
  estados = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'completado', label: 'Completado' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  constructor(
    private fb: FormBuilder,
    private recordatoriosService: RecordatoriosService,
    private pacientesService: PacientesService,
    private dialogRef: MatDialogRef<RecordatorioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private loadingService: LoadingService,
    private currentStaff: CurrentStaffService,
    private matDialog: MatDialog
  ) {
    this.recordatorioForm = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: [''],
      tipo: ['', Validators.required],
      fecha_material: ['', Validators.required],
      hora_material: ['', Validators.required],
      estado: ['pendiente'],
      prioridad: ['media'],
      paciente_id: ['', Validators.required],
      cliente_id: [''],
      cliente: [''],
      paciente: [''],
      notas: [''],
      tipoDesparasitacion: ['interna']
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get esDesparasitacion(): boolean {
    return String(this.recordatorioForm.get('tipo')?.value || '').toLowerCase() === 'desparasitacion';
  }

  ngOnInit() {
    this.recordatorioForm.get('tipo')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(tipo => {
      if (String(tipo || '').toLowerCase() === 'desparasitacion') {
        const titulo = String(this.recordatorioForm.get('titulo')?.value || '').trim();
        if (!titulo || /^desparasit/i.test(titulo) || titulo === 'Vacuna anual, desparasitación…') {
          const kind = normalizarTipoDesparasitacion(this.recordatorioForm.get('tipoDesparasitacion')?.value);
          this.recordatorioForm.patchValue({ titulo: this.tituloDesparasitacion(kind) }, { emitEvent: false });
        }
      }
    });

    if (this.data?.paciente && typeof this.data.paciente === 'object') {
      this.pacienteInfo = this.data.paciente;
    }

    if (this.data?.registrarDesparasitacion && !this.data?.id) {
      const now = new Date();
      const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      this.recordatorioForm.patchValue({
        tipo: 'desparasitacion',
        tipoDesparasitacion: this.data.tipoDesparasitacion || 'interna',
        titulo: this.data.titulo || 'Desparasitación',
        estado: 'completado',
        fecha_material: now,
        hora_material: hora
      });
    }

    if (this.data) {
      // Si tiene ID, es modo edición
      if (this.data.id) {
        this.isEditMode = true;
        this.recordatorioForm.get('paciente_id')?.clearValidators();
        this.recordatorioForm.get('paciente_id')?.updateValueAndValidity({ emitEvent: false });
        let fecha: Date | null = null;
        let hora = '';
        if (this.data.fecha_hora_recordatorio || this.data.fecha_recordatorio) {
          const fechaObj = new Date(this.data.fecha_hora_recordatorio || this.data.fecha_recordatorio);
          if (!isNaN(fechaObj.getTime())) {
            fecha = fechaObj;
            hora = fechaObj.toTimeString().slice(0,5);
          }
        }
        this.recordatorioForm.patchValue({
          titulo: this.data.titulo || '',
          descripcion: this.data.descripcion || '',
          tipo: this.data.tipo || '',
          fecha_material: fecha,
          hora_material: hora,
          estado: this.data.estado || 'pendiente',
          prioridad: this.data.prioridad || 'media',
          paciente_id: this.data.paciente_id || '',
          notas: this.data.notas || '',
          tipoDesparasitacion: this.data.tipoDesparasitacion || 'interna'
        });
        
        // Cargar información del paciente para edición
        if (this.data.paciente_id) {
          this.cargarInformacionPaciente(this.data.paciente_id);
        }
      } else {
        // Es un nuevo recordatorio, establecer el paciente_id si viene desde la página del paciente
        this.isEditMode = false;
        if (this.data.paciente_id) {
          this.recordatorioForm.patchValue({
            paciente_id: this.data.paciente_id,
            cliente_id: this.data.cliente_id || ''
          });
          this.recordatorioForm.get('paciente_id')?.clearValidators();
          this.recordatorioForm.get('paciente_id')?.updateValueAndValidity({ emitEvent: false });
          this.cargarInformacionPaciente(this.data.paciente_id);
        }
      }
    }
  }

  onClientePacienteSelected(sel: ClientePacienteSelection): void {
    this.pacienteInfo = sel.pacienteData || null;
    if (this.data) {
      this.data.paciente = sel.pacienteData;
      this.data.cliente = sel.clienteData;
    }
  }

  cargarInformacionPaciente(pacienteId: string) {
    this.pacientesService.getPaciente(pacienteId).subscribe(paciente => {
      this.pacienteInfo = paciente;
    });
  }

  async guardarRecordatorio() {
    if (this.recordatorioForm.invalid) {
      Object.keys(this.recordatorioForm.controls).forEach(key => {
        const control = this.recordatorioForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor completa los campos obligatorios'
      });
      return;
    }

    let confirmacion: ConfirmacionDesparasitacionResultado | undefined;
    if (!this.isEditMode && this.esDesparasitacion) {
      confirmacion = await this.abrirConfirmacionDesparasitacion();
      if (confirmacion === undefined) {
        return;
      }
    }

    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);

    try {
      const recordatorioData = { ...this.recordatorioForm.value };

      let fechaISO = '';
      let fechaObj: Date | null = null;
      if (recordatorioData.fecha_material && recordatorioData.hora_material) {
        fechaObj = new Date(recordatorioData.fecha_material);
        const [h, m] = recordatorioData.hora_material.split(':');
        fechaObj.setHours(Number(h), Number(m), 0, 0);
        fechaISO = fechaObj.toISOString();
      }
      recordatorioData.fecha_hora_recordatorio = fechaISO;
      recordatorioData.fecha_recordatorio = fechaISO;

      if (this.esDesparasitacion) {
        recordatorioData.tipoDesparasitacion = normalizarTipoDesparasitacion(
          recordatorioData.tipoDesparasitacion
        );
        if (confirmacion) {
          recordatorioData.esquemaConfirmado = true;
          recordatorioData.esquemaCodigo = confirmacion.esquemaCodigo;
          recordatorioData.intervaloConfirmadoDias = confirmacion.intervaloDias;
        }
      }

      let proxima: AsegurarRefuerzoResultado | undefined;

      if (this.isEditMode && this.data.id) {
        await this.recordatoriosService.actualizarRecordatorio(this.data.id, recordatorioData);
        if (recordatorioData.paciente_id) {
          await this.registrarRecordatorioEnLog(recordatorioData, 'editado');
        }
        this.dialogRef.close(recordatorioData);
      } else {
        const ref = await this.recordatoriosService.crearRecordatorio(recordatorioData);
        const recordatorioId = ref.key;
        recordatorioData.id = recordatorioId;

        if (recordatorioData.paciente_id) {
          await this.registrarRecordatorioEnLog(recordatorioData, 'creado');
        }

        if (confirmacion?.agendar && !esPacienteFallecido(this.pacienteInfo?.estado)) {
          const fechaNext = confirmacion.fecha;
          if (fechaNext) {
            proxima = await this.recordatoriosService.asegurarProximaDesparasitacion({
              pacienteId: String(recordatorioData.paciente_id),
              clienteId: String(recordatorioData.cliente_id || this.data?.cliente_id || ''),
              fechaIsoLocal: formatRtdbLocal(fechaNext),
              dayKey: dayKeyLocal(fechaNext),
              fechaLabel: labelFechaEs(fechaNext),
              titulo: 'Desparasitación — siguiente dosis',
              tipoDesparasitacion: confirmacion.tipoDesparasitacion,
              intervaloDias: confirmacion.intervaloDias,
              esquemaCodigo: confirmacion.esquemaCodigo
            });
          }
        }

        this.dialogRef.close(recordatorioData);
        await this.mostrarExitoGuardado(proxima);
      }
    } catch (error) {
      console.error('Error al guardar recordatorio:', error);
      let mensajeError = 'No se pudo guardar el recordatorio';
      if (error instanceof Error) {
        if (error.message.includes('Ya existe un recordatorio similar')) {
          mensajeError = 'Ya existe un recordatorio similar para este paciente';
        }
      }
      await Swal.fire({ icon: 'error', title: 'Error', text: mensajeError });
    } finally {
      this.loadingService.hide();
      this.loading = false;
    }
  }

  private tituloDesparasitacion(kind: TipoDesparasitacion): string {
    if (kind === 'externa') return 'Desparasitación externa';
    if (kind === 'ambas') return 'Desparasitación interna y externa';
    return 'Desparasitación interna';
  }

  private async abrirConfirmacionDesparasitacion(): Promise<ConfirmacionDesparasitacionResultado | undefined> {
    const v = this.recordatorioForm.value;
    const tipo = normalizarTipoDesparasitacion(v.tipoDesparasitacion);
    const sugerencia = sugerirEsquemaDesparasitacion({
      especie: this.pacienteInfo?.especie || this.data?.paciente?.especie,
      edadTexto: this.pacienteInfo?.edad || this.data?.paciente?.edad,
      tipo,
      fechaAplicacion: v.fecha_material,
      estadoPaciente: this.pacienteInfo?.estado || this.data?.paciente?.estado
    });
    const data: DesparasitacionEsquemaConfirmData = {
      sugerencia,
      nombrePaciente:
        this.data?.paciente?.nombre ||
        this.pacienteInfo?.nombre ||
        (typeof this.data?.paciente === 'string' ? this.data.paciente : 'Paciente'),
      tipo,
      especie: sugerencia.especieNormalizada,
      fechaAplicacion: v.fecha_material,
      horaActual: extraerHoraHhMm(parseFechaFlexible(v.fecha_material)),
      fallecido: esPacienteFallecido(this.pacienteInfo?.estado || this.data?.paciente?.estado)
    };
    const ref = this.matDialog.open(DesparasitacionEsquemaConfirmDialogComponent, {
      ...ADMIN_DIALOG_DETAIL,
      width: '560px',
      data
    });
    return firstValueFrom(ref.afterClosed());
  }

  private async mostrarExitoGuardado(proxima?: AsegurarRefuerzoResultado): Promise<void> {
    let text = 'Recordatorio guardado.';
    if (proxima?.action === 'created') {
      text = `Se registró la desparasitación y se agendó la siguiente dosis para el ${proxima.fechaLabel}.`;
    } else if (proxima?.action === 'updated') {
      text = `Se actualizó el recordatorio de la siguiente dosis (${proxima.fechaLabel}).`;
    } else if (this.esDesparasitacion) {
      text = 'Desparasitación registrada. No se agendó la siguiente dosis.';
    }
    await Swal.fire({ icon: 'success', title: 'Listo', text });
  }

  cancelar() {
    this.dialogRef.close(false);
  }

  async eliminarRecordatorio() {
    if (!this.data?.id) return;

    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Borrar este recordatorio?',
      text: 'Se ocultará del listado. Los datos se conservan.',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.loading = true;
      
      try {
        await this.recordatoriosService.eliminarRecordatorio(this.data.id);
        this.loadingService.show();
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error al eliminar recordatorio:', error);
        this.loadingService.hide();
        setTimeout(() => Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo borrar el recordatorio'
        }), 0);
      } finally {
        this.loading = false;
      }
    }
  }

  async cambiarEstado(estado: string) {
    if (!this.data?.id) return;

    this.loading = true;
    
    try {
      if (estado === 'completado') {
        await this.recordatoriosService.marcarCompletado(this.data.id);
      } else {
        await this.recordatoriosService.marcarPendiente(this.data.id);
      }
      
      this.loadingService.show();
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      this.loadingService.hide();
      setTimeout(() => Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cambiar el estado del recordatorio'
      }), 0);
    } finally {
      this.loading = false;
    }
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
    if (p.edad) parts.push(`${p.edad} años`);
    if (p.peso) parts.push(`${p.peso} kg`);
    if (p.sexo) parts.push(p.sexo);
    return parts.join(' · ');
  }

  // Registrar recordatorio en log de actividades
  private async registrarRecordatorioEnLog(recordatorioData: any, accion: string): Promise<void> {
    try {
      const datosLog = {
        tipo: 'recordatorio',
        accion: accion,
        fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
        datos: {
          id: recordatorioData.id,
          titulo: recordatorioData.titulo,
          descripcion: recordatorioData.descripcion,
          tipo: recordatorioData.tipo,
          fecha_hora_recordatorio: recordatorioData.fecha_hora_recordatorio,
          estado: recordatorioData.estado,
          prioridad: recordatorioData.prioridad,
          notas: recordatorioData.notas
        },
        usuario: await this.currentStaff.getStaffLabel(),
        paciente_id: recordatorioData.paciente_id
      };

      await this.pacientesService.registrarRecordatorio(recordatorioData.paciente_id, datosLog);
      console.log(`Recordatorio ${accion} registrado en log exitosamente`);
    } catch (error) {
      console.error('Error al registrar recordatorio en log:', error);
    }
  }
} 