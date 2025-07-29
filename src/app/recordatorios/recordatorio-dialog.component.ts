import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RecordatoriosService } from './recordatorios.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recordatorio-dialog',
  templateUrl: './recordatorio-dialog.component.html',
  styleUrls: ['./recordatorio-dialog.component.css']
})
export class RecordatorioDialogComponent implements OnInit {
  recordatorioForm: FormGroup;
  isEditMode = false;
  loading = false;

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
    private dialogRef: MatDialogRef<RecordatorioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
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
    }
  }

  async guardarRecordatorio() {
    if (this.recordatorioForm.valid) {
      this.loading = true;
      try {
        const recordatorioData = this.recordatorioForm.value;
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
        if (this.isEditMode && this.data.id) {
          await this.recordatoriosService.actualizarRecordatorio(this.data.id, recordatorioData);
          Swal.fire({ icon: 'success', title: '¡Éxito!', text: 'Recordatorio actualizado correctamente' });
        } else {
          await this.recordatoriosService.crearRecordatorio(recordatorioData);
          Swal.fire({ icon: 'success', title: '¡Éxito!', text: 'Recordatorio creado correctamente' });
        }
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error al guardar recordatorio:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar el recordatorio' });
      } finally {
        this.loading = false;
      }
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
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'Recordatorio eliminado correctamente'
        });
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
      
      Swal.fire({
        icon: 'success',
        title: '¡Estado actualizado!',
        text: `Recordatorio marcado como ${estado}`
      });
      
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
} 