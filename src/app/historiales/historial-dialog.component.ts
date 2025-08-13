import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HistorialesService } from './historiales.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import Swal from 'sweetalert2';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-historial-dialog',
  templateUrl: './historial-dialog.component.html',
  styleUrls: ['./historial-dialog.component.css']
})
export class HistorialDialogComponent implements OnInit {
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

  constructor(
    private fb: FormBuilder,
    private historialesService: HistorialesService,
    private pacientesService: PacientesService,
    private usuariosService: UsuariosService,
    private storage: AngularFireStorage,
    private dialogRef: MatDialogRef<HistorialDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
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
      
      // Campos existentes (mantener compatibilidad)
      diagnostico: ['', Validators.required],
      tratamiento: ['', Validators.required],
      medicamentos: [''],
      notas: [''],
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
        
        // Campos existentes
        diagnostico: this.data.historial?.diagnostico || '',
        tratamiento: this.data.historial?.tratamiento || '',
        medicamentos: this.data.historial?.medicamentos || '',
        notas: this.data.historial?.notas || '',
        paciente_id: this.data.historial?.paciente_id || this.data.paciente_id || ''
      });
    }
  }

  cargarInformacionPaciente(pacienteId: string) {
    this.pacientesService.getPaciente(pacienteId).subscribe(paciente => {
      this.pacienteInfo = paciente;
    });
  }

  cargarDoctores() {
    this.cargandoDoctores = true;
    this.usuariosService.getUsuarios().subscribe(
      (usuarios) => {
        // Filtrar solo usuarios con perfil de doctor
        this.doctores = usuarios.filter(usuario => 
          usuario.perfil && 
          (usuario.perfil.toLowerCase().includes('doctor') || 
           usuario.perfil.toLowerCase().includes('medico') ||
           usuario.perfil.toLowerCase().includes('veterinario'))
        );
        
        console.log('✅ Doctores cargados:', this.doctores);
        this.cargandoDoctores = false;
        
        // Si hay un doctor ya seleccionado, verificar que esté en la lista
        const medicoActual = this.historialForm.get('medico_atendio')?.value;
        if (medicoActual && this.doctores.length > 0) {
          const doctorExiste = this.doctores.find(d => d.nombre === medicoActual);
          if (!doctorExiste) {
            console.log('⚠️ Doctor no encontrado en la lista, limpiando valor');
            this.historialForm.patchValue({ medico_atendio: '' });
          }
        }
      },
      (error) => {
        console.error('❌ Error al cargar doctores:', error);
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
      console.log('⚠️ Guardado ya en progreso, ignorando llamada adicional');
      return;
    }
    
    if (this.historialForm.valid) {
      this.loading = true;
      
      try {
        const historialData = this.historialForm.value;
        
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
          
          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Historial clínico actualizado correctamente'
          });
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
          
          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Historial clínico creado correctamente'
          });
          
          this.dialogRef.close(historialData);
        }
      } catch (error) {
        console.error('Error al guardar historial:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar el historial clínico'
        });
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
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'Historial clínico eliminado correctamente'
        });
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error al eliminar historial:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el historial clínico'
        });
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
        
        const snapshot = await tarea.snapshotChanges().toPromise();
        const url = await ref.getDownloadURL().toPromise();
        
        urlsArchivos.push(url);
      }
      
      this.archivosSubidos = [...this.archivosSubidos, ...urlsArchivos];
      this.archivosSeleccionados = [];
      
      return urlsArchivos;
    } catch (error) {
      console.error('Error al subir archivos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al subir archivos',
        text: 'No se pudieron subir algunos archivos. Inténtalo de nuevo.'
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
          // Campos existentes
          diagnostico: historialData.diagnostico,
          tratamiento: historialData.tratamiento,
          medicamentos: historialData.medicamentos,
          notas: historialData.notas,
          // Archivos
          archivos: historialData.archivos
        },
        usuario: 'Sistema', // TODO: Obtener usuario actual
        paciente_id: historialData.paciente_id
      };

      await this.pacientesService.registrarHistorialClinico(historialData.paciente_id, datosLog);
      console.log(`Historial clínico ${accion} registrado en log exitosamente`);
    } catch (error) {
      console.error('Error al registrar historial en log:', error);
    }
  }
} 