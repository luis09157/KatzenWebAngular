import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ClinicConfigService } from '../core/services/clinic-config.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { ErrorMessagesService } from '../core/error-messages.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss'],
})
export class ConfiguracionComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  form: FormGroup;
  loading = true;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private clinicConfig: ClinicConfigService,
    private loadingService: LoadingService,
    private errorMessages: ErrorMessagesService
  ) {
    this.form = this.fb.group({
      nombre: ['KatzenVet', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      logoUrl: ['', [Validators.maxLength(500)]],
      horario: ['', [Validators.maxLength(400)]],
      ivaDefaultPct: [0, [Validators.min(0), Validators.max(100)]],
      vetDefaultUid: [''],
      vetDefaultNombre: [''],
    });
  }

  ngOnInit(): void {
    this.clinicConfig
      .getClinica$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (c) => {
          this.form.patchValue(
            {
              nombre: c.nombre,
              logoUrl: c.logoUrl || '',
              horario: c.horario || '',
              ivaDefaultPct: c.ivaDefaultPct ?? 0,
              vetDefaultUid: c.vetDefaultUid || '',
              vetDefaultNombre: c.vetDefaultNombre || '',
            },
            { emitEvent: false }
          );
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async guardar(): Promise<void> {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      await this.clinicConfig.saveClinica(this.form.getRawValue());
      await Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'Todas las estaciones verán estos datos al recargar.',
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar configuración'), 'error');
    } finally {
      this.loadingService.hide();
      this.saving = false;
    }
  }
}
