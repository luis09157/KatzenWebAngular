import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { RecordatoriosService } from './recordatorios.service';
import { PacientesService } from '../pacientes/pacientes.service';
import Swal from 'sweetalert2';
import { LoadingService } from '../core/loading.service';

@Component({
  selector: 'app-recordatorio-dialog',
  templateUrl: './recordatorio-dialog.component.html',
  styleUrls: ['./recordatorio-dialog.component.css'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'fill' }
    }
  ]
})
export class RecordatorioDialogComponent implements OnInit {
  recordatorioForm: FormGroup;
  isEditMode = false;
  loading = false;
  pacienteInfo: any = null;

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
    private loadingService: LoadingService
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
      notas: ['']
    });
  }

  ngOnInit() {
    if (this.data) {
      // Si tiene ID, es modo edición
      if (this.data.id) {
        this.isEditMode = true;
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
          notas: this.data.notas || ''
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
            paciente_id: this.data.paciente_id
          });
          // Cargar información del paciente
          this.cargarInformacionPaciente(this.data.paciente_id);
        }
      }
    }
  }

  cargarInformacionPaciente(pacienteId: string) {
    this.pacientesService.getPaciente(pacienteId).subscribe(paciente => {
      this.pacienteInfo = paciente;
    });
  }

  async guardarRecordatorio() {
    console.log('Iniciando guardarRecordatorio');
    console.log('Formulario válido:', this.recordatorioForm.valid);
    console.log('Formulario valores:', this.recordatorioForm.value);
    console.log('Errores del formulario:', this.recordatorioForm.errors);
    
    if (this.recordatorioForm.valid) {
      this.loading = true;
      console.log('Loading iniciado');
      
      try {
        const recordatorioData = this.recordatorioForm.value;
        console.log('Datos del recordatorio:', recordatorioData);
        
        // Combinar fecha (Date) y hora (string) en string ISO
        let fechaISO = '';
        if (recordatorioData.fecha_material && recordatorioData.hora_material) {
          const fecha = new Date(recordatorioData.fecha_material);
          const [h, m] = recordatorioData.hora_material.split(':');
          fecha.setHours(Number(h), Number(m), 0, 0);
          fechaISO = fecha.toISOString();
        }
        recordatorioData.fecha_hora_recordatorio = fechaISO;
        recordatorioData.fecha_recordatorio = fechaISO;
        
        console.log('Datos procesados:', recordatorioData);
        
        if (this.isEditMode && this.data.id) {
          console.log('Modo edición');
          await this.recordatoriosService.actualizarRecordatorio(this.data.id, recordatorioData);
          
          // Registrar en el log de actividades
          if (recordatorioData.paciente_id) {
            await this.registrarRecordatorioEnLog(recordatorioData, 'editado');
          }
          
          this.loadingService.show();
          this.dialogRef.close(recordatorioData);
        } else {
          console.log('Modo creación');
          // Crear nuevo recordatorio
          const ref = await this.recordatoriosService.crearRecordatorio(recordatorioData);
          const recordatorioId = ref.key;
          
          // Agregar el ID al objeto de datos
          recordatorioData.id = recordatorioId;
          
          // Registrar en el log de actividades
          if (recordatorioData.paciente_id) {
            await this.registrarRecordatorioEnLog(recordatorioData, 'creado');
          }
          
          console.log('Recordatorio creado con ID:', recordatorioId);
          this.loadingService.show();
          this.dialogRef.close(recordatorioData);
        }
      } catch (error) {
        console.error('Error al guardar recordatorio:', error);
        let mensajeError = 'No se pudo guardar el recordatorio';
        
        if (error instanceof Error) {
          if (error.message.includes('Ya existe un recordatorio similar')) {
            mensajeError = 'Ya existe un recordatorio similar para este paciente';
          }
        }
        
        Swal.fire({ icon: 'error', title: 'Error', text: mensajeError });
      } finally {
        console.log('Loading finalizado');
        this.loading = false;
      }
    } else {
      console.log('Formulario no válido');
      console.log('Errores por campo:');
      
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.recordatorioForm.controls).forEach(key => {
        const control = this.recordatorioForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
          console.log(`${key}:`, control.errors);
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

  async eliminarRecordatorio() {
    if (!this.data?.id) return;

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
        await this.recordatoriosService.eliminarRecordatorio(this.data.id);
        this.loadingService.show();
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error al eliminar recordatorio:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el recordatorio'
        });
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
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cambiar el estado del recordatorio'
      });
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
        usuario: 'Sistema', // TODO: Obtener usuario actual
        paciente_id: recordatorioData.paciente_id
      };

      await this.pacientesService.registrarRecordatorio(recordatorioData.paciente_id, datosLog);
      console.log(`Recordatorio ${accion} registrado en log exitosamente`);
    } catch (error) {
      console.error('Error al registrar recordatorio en log:', error);
    }
  }
} 