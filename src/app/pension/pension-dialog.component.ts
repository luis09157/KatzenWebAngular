import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { DefaultsPensionService } from '../finanzas/defaults-pension.service';
import {
  ESTADO_PENSION_LABELS,
  EstadoPension,
  PensionEstancia,
  TAMANO_PENSION_LABELS,
  TamanoMascotaPension
} from './pension.models';
import { PensionService } from './pension.service';

@Component({
  selector: 'app-pension-dialog',
  templateUrl: './pension-dialog.component.html',
  styleUrls: ['./pension-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PensionDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  form: FormGroup;
  loading = false;
  esEdicion = false;

  readonly tamanos: TamanoMascotaPension[] = ['pequeno', 'mediano', 'grande'];
  readonly tamanoLabels = TAMANO_PENSION_LABELS;
  readonly estados: EstadoPension[] = ['reservada', 'activa', 'finalizada', 'cancelada'];
  readonly estadoLabels = ESTADO_PENSION_LABELS;

  constructor(
    private fb: FormBuilder,
    private pensionService: PensionService,
    private defaultsPension: DefaultsPensionService,
    private dialogRef: MatDialogRef<PensionDialogComponent>,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    @Inject(MAT_DIALOG_DATA) public data: { estancia?: PensionEstancia }
  ) {
    this.form = this.fb.group({
      paciente: ['', [Validators.required, Validators.minLength(2)]],
      paciente_id: ['manual'],
      cliente: ['', [Validators.required, Validators.minLength(2)]],
      cliente_id: ['manual'],
      fecha_ingreso: ['', Validators.required],
      fecha_salida_prevista: [''],
      tamano_mascota: [''],
      precio_dia: [0, [Validators.required, Validators.min(0)]],
      precio_total: [null],
      costo_dia: [null],
      estado: ['reservada' as EstadoPension, Validators.required],
      notas: ['']
    });
  }

  ngOnInit(): void {
    const hoy = new Date();
    const iso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    if (this.data?.estancia?.id) {
      this.esEdicion = true;
      const e = this.data.estancia;
      this.form.patchValue({
        paciente: e.paciente || '',
        paciente_id: e.paciente_id || 'manual',
        cliente: e.cliente || '',
        cliente_id: e.cliente_id || 'manual',
        fecha_ingreso: e.fecha_ingreso,
        fecha_salida_prevista: e.fecha_salida_prevista || '',
        tamano_mascota: e.tamano_mascota || '',
        precio_dia: e.precio_dia,
        precio_total: e.precio_total ?? null,
        costo_dia: e.costo_dia ?? null,
        estado: e.estado,
        notas: e.notas || ''
      });
    } else {
      this.form.patchValue({ fecha_ingreso: iso, estado: 'reservada' });
    }

    this.form
      .get('tamano_mascota')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((t: TamanoMascotaPension) => this.aplicarDefaultsTamano(t));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async aplicarDefaultsTamano(tamano: TamanoMascotaPension | ''): Promise<void> {
    if (!tamano || this.esEdicion) return;
    try {
      const defaults = await this.defaultsPension.getDefaultsOnce();
      const row = this.defaultsPension.defaultParaTamano(defaults, tamano);
      if (!row) return;
      const patch: Record<string, unknown> = {};
      if (row.precioDia > 0 && !this.form.get('precio_dia')?.dirty) {
        patch['precio_dia'] = row.precioDia;
      }
      if (row.costoDia != null && !this.form.get('costo_dia')?.dirty) {
        patch['costo_dia'] = row.costoDia;
      }
      if (Object.keys(patch).length) {
        this.form.patchValue(patch);
        this.recalcularTotal();
      }
    } catch {
      /* defaults opcionales */
    }
  }

  recalcularTotal(): void {
    if (this.form.get('precio_total')?.dirty) return;
    const ingreso = this.form.get('fecha_ingreso')?.value;
    const salida = this.form.get('fecha_salida_prevista')?.value;
    const precioDia = Number(this.form.get('precio_dia')?.value) || 0;
    const dias = this.pensionService.calcularDias(ingreso, salida);
    this.form.patchValue({ precio_total: Math.round(precioDia * dias * 100) / 100 }, { emitEvent: false });
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const raw = this.form.getRawValue();
      const payload = {
        paciente_id: raw.paciente_id || 'manual',
        paciente: String(raw.paciente || '').trim(),
        cliente_id: raw.cliente_id || 'manual',
        cliente: String(raw.cliente || '').trim(),
        fecha_ingreso: raw.fecha_ingreso,
        fecha_salida_prevista: raw.fecha_salida_prevista || undefined,
        tamano_mascota: raw.tamano_mascota || undefined,
        precio_dia: Number(raw.precio_dia) || 0,
        precio_total:
          raw.precio_total != null && raw.precio_total !== ''
            ? Number(raw.precio_total)
            : undefined,
        costo_dia:
          raw.costo_dia != null && raw.costo_dia !== '' ? Number(raw.costo_dia) : undefined,
        estado: raw.estado as EstadoPension,
        notas: raw.notas || ''
      };
      if (this.esEdicion && this.data.estancia?.id) {
        await this.pensionService.actualizarEstancia(this.data.estancia.id, payload);
      } else {
        await this.pensionService.crearEstancia(payload);
      }
      this.dialogRef.close(true);
      Swal.fire({
        icon: 'success',
        title: this.esEdicion ? 'Estancia actualizada' : 'Estancia registrada',
        timer: 1600,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar pensión'), 'error');
    } finally {
      this.loadingService.hide();
      this.loading = false;
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
