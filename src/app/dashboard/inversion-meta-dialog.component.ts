import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ClinicConfigService } from '../core/services/clinic-config.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { ErrorMessagesService } from '../core/error-messages.service';
import Swal from 'sweetalert2';

export interface InversionMetaDialogData {
  montoMeta?: number;
}

@Component({
  selector: 'app-inversion-meta-dialog',
  templateUrl: './inversion-meta-dialog.component.html'
})
export class InversionMetaDialogComponent {
  readonly form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private clinicConfig: ClinicConfigService,
    private loading: LoadingService,
    private errors: ErrorMessagesService,
    private dialogRef: MatDialogRef<InversionMetaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InversionMetaDialogData
  ) {
    this.form = this.fb.group({
      montoMeta: [data.montoMeta ?? null, [Validators.required, Validators.min(1)]]
    });
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const monto = Number(this.form.value.montoMeta);
    this.loading.show(LOADING_MESSAGES.saving);
    try {
      await this.clinicConfig.saveInversionMeta(monto);
      this.dialogRef.close({ saved: true, montoMeta: monto });
    } catch (error) {
      Swal.fire('Error', this.errors.getUserMessage(error, 'guardar meta de inversión'), 'error');
    } finally {
      this.loading.hide();
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
