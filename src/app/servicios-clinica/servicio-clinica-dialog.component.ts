import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import {
  DesgloseIvaIncluido,
  MENSAJE_COSTO_MAYOR_O_IGUAL_VENTA,
  TASA_IVA_GENERAL_MX,
  desglosarPrecioIvaIncluido,
  ventaMayorQueCostoValidator
} from '../core/utils/precio-margen.util';
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
  readonly tasaDefault = TASA_IVA_GENERAL_MX;

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
    const aplicaIva = s ? s.aplicaIva === true : true;
    this.form = this.fb.group({
      nombre: [s?.nombre || '', [Validators.required, Validators.minLength(2)]],
      tipo: [s?.tipo || 'consulta', Validators.required],
      precio_costo: [
        s?.precio_costo ?? null,
        [Validators.required, Validators.min(0)]
      ],
      precio_venta: [
        s?.precio_venta ?? null,
        [Validators.required, Validators.min(0), ventaMayorQueCostoValidator('precio_costo')]
      ],
      aplicaIva: [aplicaIva],
      tasaIva: [
        aplicaIva ? s?.tasaIva || TASA_IVA_GENERAL_MX : TASA_IVA_GENERAL_MX,
        [Validators.min(0), Validators.max(100)]
      ],
      notas: [s?.notas || '']
    });
    this.form.get('aplicaIva')?.valueChanges.subscribe((on) => {
      if (on && !(Number(this.form.get('tasaIva')?.value) > 0)) {
        this.form.patchValue({ tasaIva: TASA_IVA_GENERAL_MX }, { emitEvent: false });
      }
    });
    this.form.get('precio_costo')?.valueChanges.subscribe(() => {
      this.form.get('precio_venta')?.updateValueAndValidity({ emitEvent: false });
    });
  }

  get desglose(): DesgloseIvaIncluido {
    const raw = this.form.getRawValue();
    return desglosarPrecioIvaIncluido({
      precioVenta: raw.precio_venta,
      costo: raw.precio_costo,
      aplicaIva: !!raw.aplicaIva,
      tasaIva: raw.tasaIva
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  async guardar(): Promise<void> {
    this.form.markAllAsTouched();
    this.form.get('precio_venta')?.updateValueAndValidity();
    if (this.form.get('precio_venta')?.hasError('costoMayorOIgualVenta')) {
      Swal.fire('Revisa el formulario', MENSAJE_COSTO_MAYOR_O_IGUAL_VENTA, 'warning');
      return;
    }
    if (this.form.invalid || this.loading) return;
    const raw = this.form.getRawValue();
    const valid = validarFormularioServicioClinica(raw);
    if (valid.ok === false) {
      Swal.fire('Revisa el formulario', valid.error, 'warning');
      return;
    }
    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    const aplicaIva = !!raw.aplicaIva;
    const payload = {
      nombre: String(raw.nombre).trim(),
      tipo: raw.tipo,
      precio_venta: Number(raw.precio_venta),
      precio_costo: Number(raw.precio_costo) || 0,
      aplicaIva,
      tasaIva: aplicaIva ? Number(raw.tasaIva) || TASA_IVA_GENERAL_MX : 0,
      notas: String(raw.notas || '').trim()
    };
    try {
      if (this.esEdicion && this.data.servicio?.id) {
        await this.servicios.actualizar(this.data.servicio.id, payload);
      } else {
        await this.servicios.crear({ ...payload, activo: true });
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
