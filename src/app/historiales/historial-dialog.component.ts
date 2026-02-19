import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HistorialesService } from './historiales.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import Swal from 'sweetalert2';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService } from '../core/loading.service';
import { LoggerService } from '../core/logger.service';

@Component({
  selector: 'app-historial-dialog',
  templateUrl: './historial-dialog.component.html',
  styleUrls: ['./historial-dialog.component.css']
})
export class HistorialDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  historialForm: FormGroup;
  isEditMode = false;
  loading = false;
  pacienteInfo: any = null;
  
  // Propiedades para manejo de archivos
  archivosSeleccionados: File[] = [];
  archivosSubidos: string[] = [];
  subiendoArchivos = false;
  maxArchivos = 5; // Máximo 5 archivos por historial
  
  // Lista de doctores
  doctores: any[] = [];
  cargandoDoctores = false;
  
  // Opciones para hora y minuto
  horas: number[] = Array.from({ length: 24 }, (_, i) => i);
  minutos: number[] = Array.from({ length: 60 }, (_, i) => i);

  constructor(
    private fb: FormBuilder,
    private historialesService: HistorialesService,
    private pacientesService: PacientesService,
    private usuariosService: UsuariosService,
    private storage: AngularFireStorage,
    private dialogRef: MatDialogRef<HistorialDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    private logger: LoggerService
  ) {
    const ahora = new Date();
    this.historialForm = this.fb.group({
      // Campos principales (requeridos)
      historia_clinica: ['', Validators.required],
      diagnostico_presuntivo: ['', Validators.required],
      manejo_terapeutico: ['', Validators.required],
      
      // Examen físico
      peso: ['', Validators.required],
      tr: ['', Validators.required],
      hallazgos: ['', Validators.required],
      
      // Estudios y receta
      estudios_solicitados: [''],
      receta: [''],
      
      // Archivos adjuntos (opcional)
      archivos: [''],
      
      // Información del médico
      medico_atendio: ['', Validators.required],
      
      // Fecha y hora del historial (requeridas)
      fecha_registro: [ahora, Validators.required],
      hora: [ahora.getHours(), Validators.required],
      minuto: [ahora.getMinutes(), Validators.required],
      
      // ID del paciente
      paciente_id: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Cargar lista de doctores
    this.cargarDoctores();
    
    if (this.data) {
      this.isEditMode = !!this.data.historial?.id;
      
      // Si es un nuevo historial con paciente seleccionado
      if (!this.isEditMode && this.data.paciente_id) {
        this.cargarInformacionPaciente(this.data.paciente_id);
        this.historialForm.patchValue({
          paciente_id: this.data.paciente_id
        });
      }
      
      // Si es edición, cargar información del paciente
      if (this.isEditMode && this.data.historial?.paciente_id) {
        this.cargarInformacionPaciente(this.data.historial.paciente_id);
      }

      this.historialForm.patchValue({
        // Nuevos campos
        historia_clinica: this.data.historial?.historia_clinica || '',
        diagnostico_presuntivo: this.data.historial?.diagnostico_presuntivo || '',
        manejo_terapeutico: this.data.historial?.manejo_terapeutico || '',
        peso: this.data.historial?.peso || '',
        tr: this.data.historial?.tr || '',
        hallazgos: this.data.historial?.hallazgos || '',
        estudios_solicitados: this.data.historial?.estudios_solicitados || '',
        receta: this.data.historial?.receta || '',
        medico_atendio: this.data.historial?.medico_atendio || '',
        paciente_id: this.data.historial?.paciente_id || this.data.paciente_id || ''
      });
      
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
          minuto: minuto
        });
      } else {
        const ahora = new Date();
        this.historialForm.patchValue({
          fecha_registro: ahora,
          hora: ahora.getHours(),
          minuto: ahora.getMinutes()
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarInformacionPaciente(pacienteId: string) {
    this.pacientesService.getPaciente(pacienteId).pipe(takeUntil(this.destroy$)).subscribe(paciente => {
      this.pacienteInfo = paciente;
    });
  }

  cargarDoctores() {
    this.cargandoDoctores = true;
    this.usuariosService.getUsuarios().pipe(takeUntil(this.destroy$)).subscribe(
      (usuarios) => {
        // Filtrar solo usuarios con perfil de doctor
        this.doctores = usuarios.filter(usuario => 
          usuario.perfil && 
          (usuario.perfil.toLowerCase().includes('doctor') || 
           usuario.perfil.toLowerCase().includes('medico') ||
           usuario.perfil.toLowerCase().includes('veterinario'))
        );
        
        this.logger.log('Doctores cargados:', this.doctores.length);
        this.cargandoDoctores = false;
        
        // Si hay un doctor ya seleccionado, verificar que esté en la lista
        const medicoActual = this.historialForm.get('medico_atendio')?.value;
        if (medicoActual && this.doctores.length > 0) {
          const doctorExiste = this.doctores.find(d => d.nombre === medicoActual);
          if (!doctorExiste) {
            this.logger.warn('Doctor no encontrado en la lista, limpiando valor');
            this.historialForm.patchValue({ medico_atendio: '' });
          }
        }
      },
      (error) => {
        this.logger.error('Error al cargar doctores:', error);
        this.cargandoDoctores = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los doctores'
        });
      }
    );
  }

  async guardarHistorial() {
    // Prevenir múltiples ejecuciones simultáneas
    if (this.loading) {
      this.logger.warn('Guardado ya en progreso, ignorando llamada adicional');
      return;
    }
    
    if (this.historialForm.valid) {
      this.loading = true;
      
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
        
        // Subir archivos si hay alguno seleccionado (opcional)
        if (this.archivosSeleccionados.length > 0) {
          historialData.archivos = await this.subirArchivos();
        } else {
          // Si no hay archivos, establecer como array vacío
          historialData.archivos = [];
        }
        
        if (this.isEditMode && this.data.historial?.id) {
          // Actualizar historial existente
          await this.historialesService.actualizarHistorial(this.data.historial.id, historialData);
          
          // Registrar en el log de actividades
          if (historialData.paciente_id) {
            await this.registrarHistorialEnLog(historialData, 'editado');
          }
          
          this.loadingService.show();
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
          
          this.loadingService.show();
          this.dialogRef.close(historialData);
        }
      } catch (error) {
        this.logger.error('Error al guardar historial:', error);
        this.loadingService.hide();
        setTimeout(() => Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.errorMessages.getUserMessage(error, 'guardar historial')
        }), 0);
      } finally {
        this.loading = false;
      }
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.historialForm.controls).forEach(key => {
        const control = this.historialForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor completa los campos obligatorios'
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
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.loading = true;
      
      try {
        await this.historialesService.eliminarHistorial(this.data.historial.id);
        this.loadingService.show();
        this.dialogRef.close(true);
      } catch (error) {
        this.logger.error('Error al eliminar historial:', error);
        this.loadingService.hide();
        setTimeout(() => Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.errorMessages.getUserMessage(error, 'eliminar historial')
        }), 0);
      } finally {
        this.loading = false;
      }
    }
  }

  // Métodos para manejo de archivos
  onArchivoSeleccionado(event: any) {
    const archivos = event.target.files;
    if (archivos) {
      for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];
        
        // Validar tipo de archivo
        if (!this.validarTipoArchivo(archivo)) {
          Swal.fire({
            icon: 'error',
            title: 'Tipo de archivo no válido',
            text: `El archivo "${archivo.name}" no es un tipo válido. Solo se permiten PDF, PNG, JPEG y JPG.`
          });
          continue;
        }
        
        // Validar tamaño (máximo 10MB)
        if (archivo.size > 10 * 1024 * 1024) {
          Swal.fire({
            icon: 'error',
            title: 'Archivo demasiado grande',
            text: `El archivo "${archivo.name}" excede el tamaño máximo de 10MB.`
          });
          continue;
        }
        
        // Validar cantidad máxima
        if (this.archivosSeleccionados.length >= this.maxArchivos) {
          Swal.fire({
            icon: 'warning',
            title: 'Límite de archivos alcanzado',
            text: `Solo puedes subir un máximo de ${this.maxArchivos} archivos.`
          });
          break;
        }
        
        this.archivosSeleccionados.push(archivo);
      }
    }
  }

  validarTipoArchivo(archivo: File): boolean {
    const tiposPermitidos = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    return tiposPermitidos.includes(archivo.type);
  }

  removerArchivo(index: number) {
    this.archivosSeleccionados.splice(index, 1);
  }

  async subirArchivos(): Promise<string[]> {
    if (this.archivosSeleccionados.length === 0) {
      return [];
    }

    this.subiendoArchivos = true;
    const urlsArchivos: string[] = [];

    try {
      for (const archivo of this.archivosSeleccionados) {
        const timestamp = Date.now();
        const nombreArchivo = `${timestamp}_${archivo.name}`;
        const rutaArchivo = `historiales_clinicos/${this.data.paciente_id}/${nombreArchivo}`;
        
        const ref = this.storage.ref(rutaArchivo);
        const tarea = this.storage.upload(rutaArchivo, archivo);
        
        await lastValueFrom(tarea.snapshotChanges());
        const url = await firstValueFrom(ref.getDownloadURL());
        
        urlsArchivos.push(url);
      }
      
      this.archivosSubidos = [...this.archivosSubidos, ...urlsArchivos];
      this.archivosSeleccionados = [];
      
      return urlsArchivos;
    } catch (error) {
      this.logger.error('Error al subir archivos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al subir archivos',
        text: this.errorMessages.getUserMessage(error, 'subir archivos')
      });
      return [];
    } finally {
      this.subiendoArchivos = false;
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
          archivos: historialData.archivos
        },
        usuario: 'Sistema', // TODO: Obtener usuario actual
        paciente_id: historialData.paciente_id
      };

      await this.pacientesService.registrarHistorialClinico(historialData.paciente_id, datosLog);
      this.logger.log(`Historial clínico ${accion} registrado en log exitosamente`);
    } catch (error) {
      this.logger.error('Error al registrar historial en log:', error);
    }
  }
} 