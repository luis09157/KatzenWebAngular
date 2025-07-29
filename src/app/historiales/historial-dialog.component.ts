import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HistorialesService } from './historiales.service';
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

  constructor(
    private fb: FormBuilder,
    private historialesService: HistorialesService,
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
      this.isEditMode = true;
      this.historialForm.patchValue({
        diagnostico: this.data.diagnostico || '',
        tratamiento: this.data.tratamiento || '',
        medicamentos: this.data.medicamentos || '',
        notas: this.data.notas || '',
        paciente_id: this.data.paciente_id || ''
      });
    }
  }

  async guardarHistorial() {
    if (this.historialForm.valid) {
      this.loading = true;
      
      try {
        const historialData = this.historialForm.value;
        
        if (this.isEditMode && this.data.id) {
          // Actualizar historial existente
          await this.historialesService.actualizarHistorial(this.data.id, historialData);
          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Historial clínico actualizado correctamente'
          });
        } else {
          // Crear nuevo historial
          await this.historialesService.crearHistorial(historialData);
          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Historial clínico creado correctamente'
          });
        }
        
        // Cerrar con los datos del formulario en lugar de true
        this.dialogRef.close(historialData);
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
        await this.historialesService.eliminarHistorial(this.data.id);
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
} 