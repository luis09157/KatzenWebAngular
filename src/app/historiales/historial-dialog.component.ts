import { Component, Inject, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HistorialesService } from './historiales.service';
import { PacientesService } from '../pacientes/pacientes.service';
import Swal from 'sweetalert2';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { LoggerService } from '../core/logger.service';
import { CurrentStaffService } from '../core/services/current-staff.service';
import { ClientePacientePickerFields, ClientePacienteSelection } from '../shared/admin/cliente-paciente-picker.models';
import { StaffPickerFields } from '../shared/admin/staff-picker.models';
import { mensajeHintClientePaciente } from '../shared/components/flow-hint/flow-hint.util';
import {
  esImagenArchivoHistorial,
  esTipoPermitidoHistorial,
  MAX_ARCHIVOS_HISTORIAL,
  MAX_BYTES_FOTO_ORIGINAL,
  MAX_BYTES_STORAGE_HISTORIAL,
  nombreStorageArchivo,
  nombreVisibleArchivo,
  normalizarArchivosHistorial,
} from './historial-archivos.util';
import { reducirFotoParaSubir } from './historial-foto-reducir';
import { abrirVisorFotos } from './fotos-expediente.component';
import { CobrarAlTerminarService } from '../visitas/cobrar-al-terminar.service';
import { debeOfrecerCobroConsulta, lineaCobroConsulta } from '../visitas/cobrar-al-terminar.util';

/** Spec 116.1 — foto/archivo elegido que aún no se sube. */
export interface ArchivoPorSubir {
  file: File;
  /** URL local para la miniatura (solo fotos). */
  preview: string | null;
  esImagen: boolean;
}

@Component({
  selector: 'app-historial-dialog',
  templateUrl: './historial-dialog.component.html',
  styleUrls: ['./historial-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HistorialDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  historialForm: FormGroup;
  isEditMode = false;
  loading = false;
  pacienteInfo: any = null;

  // Spec 116.1 — fotos y estudios
  /** Ya guardados en la consulta (URLs). Se conservan al editar. */
  archivosGuardados: string[] = [];
  /** Elegidos en esta edición; se suben al guardar. */
  archivosPorSubir: ArchivoPorSubir[] = [];
  subiendoArchivos = false;
  progresoSubida = '';
  readonly maxArchivos = MAX_ARCHIVOS_HISTORIAL;

  get totalArchivos(): number {
    return this.archivosGuardados.length + this.archivosPorSubir.length;
  }

  get puedeAgregarArchivos(): boolean {
    return this.totalArchivos < this.maxArchivos && !this.loading;
  }

  readonly pickerFields: ClientePacientePickerFields = {
    clienteId: 'cliente_id',
    pacienteId: 'paciente_id',
    clienteNombre: 'cliente',
    pacienteNombre: 'paciente_nombre',
  };
  readonly staffPickerFields: StaffPickerFields = {
    uidField: 'medico_atendio_uid',
    nombreField: 'medico_atendio',
  };

  get muestraPickerClientePaciente(): boolean {
    if (this.isEditMode) return false;
    return !(this.data?.paciente_id || this.data?.historial?.paciente_id);
  }

  /** Spec 048 */
  /** Spec 069 — campos extra (examen, diagnóstico, receta…) colapsados. */
  mostrarMasDatos = false;

  get hintHistorial(): string {
    if (!this.muestraPickerClientePaciente) return '';
    return mensajeHintClientePaciente(
      this.historialForm,
      { clienteId: 'cliente_id', pacienteId: 'paciente_id' },
      'Paso 3: escribe el motivo y una nota. Lo demás es opcional.'
    );
  }

  // Opciones para hora y minuto
  horas: number[] = Array.from({ length: 24 }, (_, i) => i);
  minutos: number[] = Array.from({ length: 60 }, (_, i) => i);

  constructor(
    private fb: FormBuilder,
    private historialesService: HistorialesService,
    private pacientesService: PacientesService,
    private storage: AngularFireStorage,
    private dialogRef: MatDialogRef<HistorialDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    private logger: LoggerService,
    private currentStaff: CurrentStaffService,
    private matDialog: MatDialog,
    private cobrarAlTerminar: CobrarAlTerminarService
  ) {
    const ahora = new Date();
    this.historialForm = this.fb.group({
      // Spec 069 — mínimo clínico: motivo + nota. El resto opcional.
      historia_clinica: ['', Validators.required],
      diagnostico_presuntivo: [''],
      manejo_terapeutico: [''],
      peso: [''],
      tr: [''],
      hallazgos: [''],
      estudios_solicitados: [''],
      receta: [''],
      archivos: [''],
      medico_atendio: [''],
      medico_atendio_uid: [''],
      fecha_registro: [ahora, Validators.required],
      hora: [ahora.getHours(), Validators.required],
      minuto: [ahora.getMinutes(), Validators.required],
      paciente_id: ['', Validators.required],
      cliente_id: [''],
      cliente: [''],
      paciente_nombre: [''],
      oculto_portal: [false],
      notas_internas: ['', Validators.required],
    });
  }

  ngOnInit() {
    if (this.data) {
      this.isEditMode = !!this.data.historial?.id;

      // Si es un nuevo historial con paciente seleccionado
      if (!this.isEditMode && this.data.paciente_id) {
        this.cargarInformacionPaciente(this.data.paciente_id);
        this.historialForm.patchValue({
          paciente_id: this.data.paciente_id,
          cliente_id: this.data.cliente_id || '',
          cliente: this.data.cliente || '',
          paciente_nombre: this.data.paciente || '',
        });
        this.historialForm.get('paciente_id')?.clearValidators();
        this.historialForm.get('paciente_id')?.updateValueAndValidity({ emitEvent: false });
      }

      // Si es edición, cargar información del paciente
      if (this.isEditMode && this.data.historial?.paciente_id) {
        this.cargarInformacionPaciente(this.data.historial.paciente_id);
        this.historialForm.get('paciente_id')?.clearValidators();
        this.historialForm.get('paciente_id')?.updateValueAndValidity({ emitEvent: false });
      }

      this.historialForm.patchValue({
        // Nuevos campos
        historia_clinica:
          this.data.historial?.historia_clinica ||
          (this.data.motivo_consulta ? `Motivo de consulta: ${this.data.motivo_consulta}` : ''),
        diagnostico_presuntivo: this.data.historial?.diagnostico_presuntivo || '',
        manejo_terapeutico: this.data.historial?.manejo_terapeutico || '',
        peso: this.data.historial?.peso || '',
        tr: this.data.historial?.tr || '',
        hallazgos: this.data.historial?.hallazgos || '',
        estudios_solicitados: this.data.historial?.estudios_solicitados || '',
        receta: this.data.historial?.receta || '',
        medico_atendio: this.data.historial?.medico_atendio || '',
        medico_atendio_uid: this.data.historial?.medico_atendio_uid || '',
        paciente_id: this.data.historial?.paciente_id || this.data.paciente_id || '',
        oculto_portal: this.data.historial?.oculto_portal === true,
        notas_internas: this.data.historial?.notas_internas || '',
      });

      // Spec 116.1 — al editar se conservan las fotos que ya tenía.
      this.archivosGuardados = normalizarArchivosHistorial(this.data.historial?.archivos);

      if (this.isEditMode && this.data.historial?.id) {
        this.historialesService
          .getNotasInternas(this.data.historial.id)
          .then((texto) => {
            if (texto) {
              this.historialForm.patchValue({ notas_internas: texto });
            }
          })
          .catch(() => undefined);
      }

      // Manejar fecha y hora por separado (sin conversión de zona horaria)
      if (this.data.historial?.fecha_registro) {
        // Parsear la fecha string manualmente para evitar conversiones de zona horaria
        const fechaStr = this.data.historial.fecha_registro; // Formato: "YYYY-MM-DD HH:MM:SS"
        const partes = fechaStr.split(' ');
        const fechaPartes = partes[0].split('-');
        const horaPartes = partes[1] ? partes[1].split(':') : ['0', '0', '0'];

        const año = parseInt(fechaPartes[0], 10);
        const mes = parseInt(fechaPartes[1], 10) - 1; // Mes es 0-indexed
        const dia = parseInt(fechaPartes[2], 10);
        const hora = parseInt(horaPartes[0], 10);
        const minuto = parseInt(horaPartes[1], 10);

        // Crear fecha usando la zona horaria local
        const fechaLocal = new Date(año, mes, dia);

        this.logger.log('Fecha cargada:', fechaStr, fechaLocal, hora, minuto);

        this.historialForm.patchValue({
          fecha_registro: fechaLocal,
          hora: hora,
          minuto: minuto,
        });
      } else {
        const ahora = new Date();
        this.historialForm.patchValue({
          fecha_registro: ahora,
          hora: ahora.getHours(),
          minuto: ahora.getMinutes(),
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.archivosPorSubir.forEach((a) => a.preview && URL.revokeObjectURL(a.preview));
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarInformacionPaciente(pacienteId: string) {
    this.pacientesService
      .getPaciente(pacienteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((paciente) => {
        this.pacienteInfo = paciente;
        if (paciente && !this.isEditMode) {
          const clienteId = String((paciente as any).cliente_id || (paciente as any).idCliente || '');
          this.historialForm.patchValue({
            paciente_id: pacienteId,
            paciente_nombre: paciente.nombre || '',
            cliente_id: this.data?.cliente_id || clienteId,
            cliente: this.data?.cliente || this.historialForm.get('cliente')?.value || '',
          });
        }
      });
  }

  getPacienteMeta(): string {
    if (!this.pacienteInfo) {
      return '—';
    }
    const partes: string[] = [];
    if (this.pacienteInfo.especie) partes.push(this.pacienteInfo.especie);
    if (this.pacienteInfo.raza) partes.push(this.pacienteInfo.raza);
    if (this.pacienteInfo.sexo) partes.push(this.pacienteInfo.sexo);
    if (this.pacienteInfo.peso) partes.push(`${this.pacienteInfo.peso} kg`);
    if (this.pacienteInfo.edad) partes.push(String(this.pacienteInfo.edad));
    return partes.length ? partes.join(' · ') : '—';
  }

  onClientePacienteSelected(sel: ClientePacienteSelection): void {
    this.pacienteInfo = sel.pacienteData || null;
  }

  async guardarHistorial() {
    // Prevenir múltiples ejecuciones simultáneas
    if (this.loading) {
      this.logger.warn('Guardado ya en progreso, ignorando llamada adicional');
      return;
    }

    if (this.historialForm.valid) {
      this.loading = true;
      this.loadingService.show(LOADING_MESSAGES.saving);

      try {
        const historialData = this.historialForm.value;

        // Combinar fecha con hora y minuto seleccionados (sin conversión de zona horaria)
        if (historialData.fecha_registro instanceof Date) {
          const fecha = historialData.fecha_registro;
          const hora = historialData.hora || 0;
          const minuto = historialData.minuto || 0;

          // Construir fecha string directamente sin conversiones de zona horaria
          const año = fecha.getFullYear();
          const mes = String(fecha.getMonth() + 1).padStart(2, '0');
          const dia = String(fecha.getDate()).padStart(2, '0');
          const horaStr = String(hora).padStart(2, '0');
          const minutoStr = String(minuto).padStart(2, '0');

          historialData.fecha_registro = `${año}-${mes}-${dia} ${horaStr}:${minutoStr}:00`;

          this.logger.log('Fecha guardada:', historialData.fecha_registro);
        }

        // Eliminar los campos temporales de hora y minuto
        delete historialData.hora;
        delete historialData.minuto;

        // Spec 116.1 — las fotos que ya tenía + las nuevas. Si alguna no sube, no se guarda
        // (la consulta sigue abierta para reintentar y no se pierde nada).
        const pacienteIdArchivos = String(
          historialData.paciente_id || this.data?.historial?.paciente_id || this.data?.paciente_id || ''
        );
        const nuevas = await this.subirArchivos(pacienteIdArchivos);
        if (nuevas === null) {
          return;
        }
        historialData.archivos = [...this.archivosGuardados, ...nuevas];

        if (this.data?.cita_id && !this.isEditMode) {
          historialData.cita_id = this.data.cita_id;
        }

        if (this.isEditMode && this.data.historial?.id) {
          // Actualizar historial existente
          await this.historialesService.actualizarHistorial(this.data.historial.id, historialData);

          // Registrar en el log de actividades
          if (historialData.paciente_id) {
            await this.registrarHistorialEnLog(historialData, 'editado');
          }

          this.dialogRef.close(historialData);
        } else {
          // Crear nuevo historial
          const ref = await this.historialesService.crearHistorial(historialData);
          const historialId = ref.key;
          historialData.id = historialId;

          // Registrar en el log de actividades
          if (historialData.paciente_id) {
            await this.registrarHistorialEnLog(historialData, 'creado');
          }

          // Spec 116.3 — «¿Cobrar ahora?» (no si viene de una cita: Citas ya lo pregunta).
          await this.ofrecerCobroAlTerminar(historialData);

          this.dialogRef.close(historialData);
        }
      } catch (error) {
        this.logger.error('Error al guardar historial:', error);
        setTimeout(
          () =>
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: this.errorMessages.getUserMessage(error, 'guardar historial'),
            }),
          0
        );
      } finally {
        this.loadingService.hide();
        this.loading = false;
      }
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.historialForm.controls).forEach((key) => {
        const control = this.historialForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });

      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor completa los campos obligatorios',
      });
    }
  }

  cancelar() {
    this.dialogRef.close(false);
  }

  async eliminarHistorial() {
    if (!this.data?.historial?.id) return;

    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Borrar este historial?',
      text: 'Se ocultará en el panel admin y en el portal del dueño. Los datos se conservan.',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      this.loading = true;
      this.loadingService.show(LOADING_MESSAGES.deleting);

      try {
        await this.historialesService.eliminarHistorial(this.data.historial.id);
        this.dialogRef.close(true);
      } catch (error) {
        this.logger.error('Error al eliminar historial:', error);
        setTimeout(
          () =>
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: this.errorMessages.getUserMessage(error, 'eliminar historial'),
            }),
          0
        );
      } finally {
        this.loadingService.hide();
        this.loading = false;
      }
    }
  }

  // Spec 116.1 — fotos y estudios
  async onArchivoSeleccionado(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const archivos = Array.from(input?.files || []);
    if (input) input.value = '';
    const avisos: string[] = [];
    for (const archivo of archivos) {
      if (this.totalArchivos >= this.maxArchivos) {
        avisos.push(`Solo caben ${this.maxArchivos} fotos o archivos por consulta.`);
        break;
      }
      if (!esTipoPermitidoHistorial(archivo.type, archivo.name)) {
        avisos.push(`«${archivo.name}» no es foto ni PDF.`);
        continue;
      }
      const esPdf = archivo.type === 'application/pdf' || /\.pdf$/i.test(archivo.name);
      const limite = esPdf ? MAX_BYTES_STORAGE_HISTORIAL : MAX_BYTES_FOTO_ORIGINAL;
      if (archivo.size > limite) {
        avisos.push(`«${archivo.name}» pesa más de ${Math.round(limite / 1024 / 1024)} MB.`);
        continue;
      }
      const esImagen = !esPdf;
      let preview: string | null = null;
      if (esImagen) {
        try {
          preview = URL.createObjectURL(archivo);
        } catch {
          preview = null;
        }
      }
      this.archivosPorSubir.push({ file: archivo, preview, esImagen });
    }
    if (avisos.length) {
      Swal.fire({ icon: 'warning', title: 'Algunos no se agregaron', html: avisos.join('<br>') });
    }
  }

  quitarArchivoPorSubir(index: number): void {
    const [quitado] = this.archivosPorSubir.splice(index, 1);
    if (quitado?.preview) URL.revokeObjectURL(quitado.preview);
  }

  /** Quita la foto de esta consulta (el archivo no se borra de Storage). */
  quitarArchivoGuardado(index: number): void {
    this.archivosGuardados.splice(index, 1);
  }

  esImagenGuardada(url: string): boolean {
    return esImagenArchivoHistorial(url);
  }

  nombreArchivoGuardado(url: string, i: number): string {
    return nombreVisibleArchivo(url, i);
  }

  verFotoGuardada(url: string): void {
    const fotos = this.archivosGuardados.filter((u) => esImagenArchivoHistorial(u));
    abrirVisorFotos(this.matDialog, fotos, Math.max(0, fotos.indexOf(url)));
  }

  /**
   * Sube las fotos/archivos nuevos. Regresa sus URLs, o `null` si alguno falló
   * (en ese caso no se guarda la consulta y se avisa).
   */
  async subirArchivos(pacienteId: string): Promise<string[] | null> {
    if (this.archivosPorSubir.length === 0) {
      return [];
    }
    if (!pacienteId) {
      Swal.fire({ icon: 'warning', title: 'Falta la mascota', text: 'Elige la mascota antes de subir fotos.' });
      return null;
    }

    this.subiendoArchivos = true;
    const total = this.archivosPorSubir.length;
    let listos = 0;
    this.progresoSubida = `Subiendo fotos… 0 de ${total}`;
    const timestamp = Date.now();

    try {
      const urls = await Promise.all(
        this.archivosPorSubir.map(async (item, n) => {
          const archivo = item.esImagen ? await reducirFotoParaSubir(item.file) : item.file;
          if (archivo.size > MAX_BYTES_STORAGE_HISTORIAL) {
            throw new Error(`«${item.file.name}» sigue pesando más de 10 MB.`);
          }
          const ruta = `historiales_clinicos/${pacienteId}/${nombreStorageArchivo(archivo.name, timestamp, n)}`;
          const contentType = archivo.type || (item.esImagen ? 'image/jpeg' : 'application/pdf');
          const tarea = this.storage.upload(ruta, archivo, { contentType });
          await lastValueFrom(tarea.snapshotChanges());
          const url = await firstValueFrom(this.storage.ref(ruta).getDownloadURL());
          listos++;
          this.progresoSubida = `Subiendo fotos… ${listos} de ${total}`;
          return String(url);
        })
      );

      this.archivosPorSubir.forEach((a) => a.preview && URL.revokeObjectURL(a.preview));
      this.archivosPorSubir = [];
      return urls;
    } catch (error) {
      this.logger.error('Error al subir archivos:', error);
      setTimeout(
        () =>
          Swal.fire({
            icon: 'error',
            title: 'No se subieron las fotos',
            text: `${this.errorMessages.getUserMessage(error, 'subir archivos')} La consulta no se guardó todavía: revisa la señal y vuelve a tocar Guardar.`,
          }),
        0
      );
      return null;
    } finally {
      this.subiendoArchivos = false;
      this.progresoSubida = '';
    }
  }

  /** Spec 116.3 — nunca impide cerrar: si algo falla, la consulta ya quedó guardada. */
  private async ofrecerCobroAlTerminar(historialData: any): Promise<void> {
    if (!debeOfrecerCobroConsulta({ esNueva: true, citaId: historialData?.cita_id || this.data?.cita_id })) return;
    try {
      this.loadingService.hide();
      const clienteInfo = String(this.pacienteInfo?.cliente_id || this.pacienteInfo?.idCliente || '');
      await this.cobrarAlTerminar.ofrecer({
        titulo: 'Consulta guardada',
        linea: lineaCobroConsulta(historialData, {
          clienteId: this.data?.cliente_id || clienteInfo,
          paciente: this.pacienteInfo?.nombre || this.data?.paciente,
        }),
      });
    } catch (error) {
      this.logger.error('Cobrar al terminar (consulta):', error);
    }
  }

  // Registrar historial en log de actividades
  private async registrarHistorialEnLog(historialData: any, accion: string): Promise<void> {
    try {
      const datosLog = {
        tipo: 'historial_clinico',
        accion: accion,
        fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
        datos: {
          id: historialData.id,
          // Nuevos campos
          historia_clinica: historialData.historia_clinica,
          diagnostico_presuntivo: historialData.diagnostico_presuntivo,
          manejo_terapeutico: historialData.manejo_terapeutico,
          peso: historialData.peso,
          tr: historialData.tr,
          hallazgos: historialData.hallazgos,
          estudios_solicitados: historialData.estudios_solicitados,
          receta: historialData.receta,
          medico_atendio: historialData.medico_atendio,
          // Archivos
          archivos: historialData.archivos,
        },
        usuario: await this.currentStaff.getStaffLabel(),
        paciente_id: historialData.paciente_id,
      };

      await this.pacientesService.registrarHistorialClinico(historialData.paciente_id, datosLog);
      this.logger.log(`Historial clínico ${accion} registrado en log exitosamente`);
    } catch (error) {
      this.logger.error('Error al registrar historial en log:', error);
    }
  }
}
