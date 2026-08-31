import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import {
  ServicioClinica,
  TIPOS_SERVICIO_CLINICA,
  TIPO_SERVICIO_CLINICA_LABELS
} from './servicios-clinica.models';
import { ServiciosClinicaService } from './servicios-clinica.service';
import { validarFormularioServicioClinica } from './servicios-clinica.util';

@Component({
  selector: 'app-servicio-clinica-dialog',
  templateUrl: './servicio-clinica-dialog.component.html',
  styleUrls: ['./servicio-clinica-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ServicioClinicaDialogComponent {
  form: FormGroup;
  loading = false;
  esEdicion = false;

  readonly tipos = TIPOS_SERVICIO_CLINICA;
  readonly tipoLabels = TIPO_SERVICIO_CLINICA_LABELS;

  constructor(
    private fb: FormBuilder,
    private servicios: ServiciosClinicaService,
    private dialogRef: MatDialogRef<ServicioClinicaDialogComponent>,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    @Inject(MAT_DIALOG_DATA) public data: { servicio?: ServicioClinica }
  ) {
    const s = data?.servicio;
    this.esEdicion = !!s?.id;
    this.form = this.fb.group({
      nombre: [s?.nombre || '', [Validators.required, Validators.minLength(2)]],
      tipo: [s?.tipo || 'consulta', Validators.required],
      precio_venta: [s?.precio_venta ?? null, [Validators.required, Validators.min(0)]],
      notas: [s?.notas || '']
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  async guardar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading) return;
    const raw = this.form.getRawValue();
    const valid = validarFormularioServicioClinica(raw);
    if (valid.ok === false) {
      Swal.fire('Revisa el formulario', valid.error, 'warning');
      return;
    }
    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      if (this.esEdicion && this.data.servicio?.id) {
        await this.servicios.actualizar(this.data.servicio.id, {
          nombre: String(raw.nombre).trim(),
          tipo: raw.tipo,
          precio_venta: Number(raw.precio_venta),
          notas: String(raw.notas || '').trim()
        });
      } else {
        await this.servicios.crear({
          nombre: String(raw.nombre).trim(),
          tipo: raw.tipo,
          precio_venta: Number(raw.precio_venta),
          notas: String(raw.notas || '').trim(),
          activo: true
        });
      }
      this.dialogRef.close(true);
    } catch (error) {
      Swal.fire(
        'Error',
        this.errorMessages.getUserMessage(error, 'guardar servicio de clínica'),
        'error'
      );
    } finally {
      this.loading = false;
      this.loadingService.hide();
    }
  }
}
