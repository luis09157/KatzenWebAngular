import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { CajaService } from './caja.service';
import { CajaMetodoPago, CajaTipoMovimiento } from './caja.models';

@Component({
  selector: 'app-caja-movimiento-dialog',
  templateUrl: './caja-movimiento-dialog.component.html',
  styleUrls: ['./caja-movimiento-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CajaMovimientoDialogComponent implements OnInit {
  form: FormGroup;
  loading = false;

  readonly tipos: Array<{ value: CajaTipoMovimiento; label: string }> = [
    { value: 'ingreso', label: 'Ingreso' },
    { value: 'egreso', label: 'Egreso' }
  ];

  readonly metodos: Array<{ value: CajaMetodoPago; label: string }> = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'transferencia', label: 'Transferencia' }
  ];

  constructor(
    private fb: FormBuilder,
    private cajaService: CajaService,
    private dialogRef: MatDialogRef<CajaMovimientoDialogComponent>,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      fechaDefault?: string;
      banioId?: string;
      concepto?: string;
      monto?: number;
      metodoPago?: CajaMetodoPago;
      notas?: string;
    }
  ) {
    this.form = this.fb.group({
      tipo: ['ingreso' as CajaTipoMovimiento, Validators.required],
      concepto: ['', [Validators.required, Validators.minLength(3)]],
      monto: [null, [Validators.required, Validators.min(0.01)]],
      metodoPago: ['efectivo' as CajaMetodoPago, Validators.required],
      ivaDeclarado: [false],
      fecha: [this.cajaService.hoyLocalIsoDate(), Validators.required],
      notas: ['']
    });
  }

  ngOnInit(): void {
    if (this.data?.fechaDefault) {
      this.form.patchValue({ fecha: this.data.fechaDefault });
    }
    if (this.data?.concepto) {
      this.form.patchValue({ concepto: this.data.concepto });
    }
    if (this.data?.monto != null) {
      this.form.patchValue({ monto: this.data.monto });
    }
    if (this.data?.metodoPago) {
      this.form.patchValue({ metodoPago: this.data.metodoPago });
    }
    if (this.data?.notas) {
      this.form.patchValue({ notas: this.data.notas });
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  async guardar(): Promise<void> {
    this.syncFromDom();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire('Formulario incompleto', 'Completa concepto, monto, método y fecha.', 'warning');
      return;
    }

    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const raw = this.form.getRawValue();
      const movId = await this.cajaService.crearMovimiento({
        tipo: raw.tipo,
        concepto: String(raw.concepto).trim(),
        monto: Number(raw.monto),
        metodoPago: raw.metodoPago,
        ivaDeclarado: !!raw.ivaDeclarado,
        fecha: raw.fecha,
        banioId: this.data?.banioId,
        notas: raw.notas ? String(raw.notas).trim() : undefined
      });
      this.dialogRef.close({ ok: true, movimientoId: movId });
      Swal.fire({
        icon: 'success',
        title: 'Movimiento registrado',
        timer: 1800,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'registrar cobro'), 'error');
    } finally {
      this.loadingService.hide();
      this.loading = false;
    }
  }

  private syncFromDom(): void {
    for (const name of ['concepto', 'monto', 'fecha', 'notas']) {
      const control = this.form.get(name);
      const el = document.querySelector(
        `app-caja-movimiento-dialog input[formControlName="${name}"], app-caja-movimiento-dialog textarea[formControlName="${name}"]`
      ) as HTMLInputElement | HTMLTextAreaElement | null;
      if (!control || !el) continue;
      const domValue = el.value;
      const controlValue = control.value == null ? '' : String(control.value);
      if (domValue && domValue !== controlValue) {
        control.setValue(name === 'monto' ? Number(domValue) : domValue);
        control.updateValueAndValidity({ emitEvent: false });
      }
    }
  }
}
