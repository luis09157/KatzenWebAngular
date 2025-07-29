import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VacunasService } from './vacunas.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-vacuna-dialog',
  templateUrl: './vacuna-dialog.component.html',
  styleUrls: ['./vacuna-dialog.component.css']
})
export class VacunaDialogComponent implements OnInit {
  vacunaForm: FormGroup;
  isEditMode = false;
  loading = false;

  // Tipos de vacunas predefinidos
  tiposVacunas = [
    { value: 'quintuple', label: 'Quíntuple' },
    { value: 'sextuple', label: 'Séxtuple' },
    { value: 'antirrabica', label: 'Antirrábica' },
    { value: 'coronavirus', label: 'Coronavirus' },
    { value: 'triple_felina', label: 'Triple Felina' },
    { value: 'leucemia', label: 'Leucemia' },
    { value: 'parvovirus', label: 'Parvovirus' },
    { value: 'moquillo', label: 'Moquillo' },
    { value: 'hepatitis', label: 'Hepatitis' },
    { value: 'otra', label: 'Otra' }
  ];

  // Estados de la vacuna
  estados = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'aplicada', label: 'Aplicada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  constructor(
    private fb: FormBuilder,
    private vacunasService: VacunasService,
    private dialogRef: MatDialogRef<VacunaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.vacunaForm = this.fb.group({
      vacuna: ['', Validators.required],
      idVacuna: [''],
      dosis: ['', Validators.required],
      fecha: ['', Validators.required],
      fechaRecordatorio: [''],
      observaciones: [''],
      recordatorio: [false],
      aplicada: [false],
      idPaciente: ['', Validators.required],
      intervalo: [0], // Días para próxima aplicación
      lote: [''], // Número de lote
      veterinario: [''], // Veterinario que aplicó
      reaccion: [''], // Reacción adversa
      proximaAplicacion: [''] // Fecha de próxima aplicación
    });
  }

  ngOnInit() {
    if (this.data) {
      this.isEditMode = true;
      this.vacunaForm.patchValue({
        vacuna: this.data.vacuna || '',
        idVacuna: this.data.idVacuna || '',
        dosis: this.data.dosis || '',
        fecha: this.data.fecha || '',
        fechaRecordatorio: this.data.fechaRecordatorio || '',
        observaciones: this.data.observaciones || '',
        recordatorio: this.data.recordatorio || false,
        aplicada: this.data.aplicada || false,
        idPaciente: this.data.idPaciente || '',
        intervalo: this.data.intervalo || 0,
        lote: this.data.lote || '',
        veterinario: this.data.veterinario || '',
        reaccion: this.data.reaccion || '',
        proximaAplicacion: this.data.proximaAplicacion || ''
      });
    }
  }

  async guardarVacuna() {
    if (this.vacunaForm.valid) {
      this.loading = true;
      
      try {
        const vacunaData = this.vacunaForm.value;
        
        if (this.isEditMode && this.data.id) {
          // Actualizar vacuna existente
          await this.vacunasService.actualizarVacuna(this.data.id, vacunaData);
          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Vacuna actualizada correctamente'
          });
        } else {
          // Crear nueva vacuna
          await this.vacunasService.crearVacuna(vacunaData);
          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Vacuna creada correctamente'
          });
        }
        
        // Cerrar con los datos del formulario en lugar de true
        this.dialogRef.close(vacunaData);
      } catch (error) {
        console.error('Error al guardar vacuna:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar la vacuna'
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

  async eliminarVacuna() {
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
        await this.vacunasService.eliminarVacuna(this.data.id);
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'Vacuna eliminada correctamente'
        });
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error al eliminar vacuna:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar la vacuna'
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
      if (estado === 'aplicada') {
        await this.vacunasService.marcarAplicada(this.data.id);
      } else {
        await this.vacunasService.marcarPendiente(this.data.id);
      }
      
      Swal.fire({
        icon: 'success',
        title: '¡Estado actualizado!',
        text: `Vacuna marcada como ${estado}`
      });
      
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cambiar el estado de la vacuna'
      });
    } finally {
      this.loading = false;
    }
  }

  // Calcular próxima fecha automáticamente
  calcularProximaFecha() {
    const fecha = this.vacunaForm.get('fecha')?.value;
    const intervalo = this.vacunaForm.get('intervalo')?.value;
    
    if (fecha && intervalo) {
      const fechaActual = new Date(fecha);
      const proximaFecha = new Date(fechaActual.getTime() + (intervalo * 24 * 60 * 60 * 1000));
      this.vacunaForm.patchValue({
        proximaAplicacion: proximaFecha.toISOString().split('T')[0]
      });
    }
  }
} 