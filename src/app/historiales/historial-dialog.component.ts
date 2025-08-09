import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HistorialesService } from './historiales.service';
import { PacientesService } from '../pacientes/pacientes.service';
import Swal from 'sweetalert2';

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

  constructor(
    private fb: FormBuilder,
    private historialesService: HistorialesService,
    private pacientesService: PacientesService,
    private dialogRef: MatDialogRef<HistorialDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.historialForm = this.fb.group({
      diagnostico: ['', Validators.required],
      tratamiento: ['', Validators.required],
      medicamentos: [''],
      notas: [''],
      paciente_id: ['', Validators.required]
    });
  }

  ngOnInit() {
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

  async guardarHistorial() {
    if (this.historialForm.valid) {
      this.loading = true;
      
      try {
        const historialData = this.historialForm.value;
        
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

  // Registrar historial en log de actividades
  private async registrarHistorialEnLog(historialData: any, accion: string): Promise<void> {
    try {
      const datosLog = {
        tipo: 'historial_clinico',
        accion: accion,
        fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
        datos: {
          id: historialData.id,
          diagnostico: historialData.diagnostico,
          tratamiento: historialData.tratamiento,
          medicamentos: historialData.medicamentos,
          notas: historialData.notas
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