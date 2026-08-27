import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import {
  costoMenorQueVentaValidator,
  MENSAJE_COSTO_MAYOR_O_IGUAL_VENTA
} from '../core/utils/precio-margen.util';
import { DefaultsPensionService } from '../finanzas/defaults-pension.service';
import {
  ESTADO_PENSION_LABELS,
  EstadoPension,
  PensionEstancia,
  TAMANO_PENSION_LABELS,
  TamanoMascotaPension
} from './pension.models';
import {
  ClientePacienteSelection
} from '../shared/admin/cliente-paciente-picker.models';
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
    @Inject(MAT_DIALOG_DATA)
    public data: {
      estancia?: PensionEstancia;
      paciente_id?: string;
      cliente_id?: string;
      paciente?: string;
      cliente?: string;
    }
  ) {
    this.form = this.fb.group({
      paciente: [''],
      paciente_id: ['', Validators.required],
      cliente: [''],
      cliente_id: ['', Validators.required],
      fecha_ingreso: ['', Validators.required],
      fecha_salida_prevista: [''],
      tamano_mascota: [''],
      precio_dia: [0, [Validators.required, Validators.min(0)]],
      precio_total: [null],
      costo_dia: [null, [costoMenorQueVentaValidator('precio_dia')]],
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
      this.form.patchValue({
        fecha_ingreso: iso,
        estado: 'reservada',
        paciente_id: this.data?.paciente_id || '',
        cliente_id: this.data?.cliente_id || '',
        paciente: this.data?.paciente || '',
        cliente: this.data?.cliente || ''
      });
    }

    this.form
      .get('tamano_mascota')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((t: TamanoMascotaPension) => this.aplicarDefaultsTamano(t));

    this.form
      .get('precio_dia')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.revalidarCostoDia());
    this.form
      .get('costo_dia')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.revalidarCostoDia());
    this.revalidarCostoDia();
  }

  private revalidarCostoDia(): void {
    this.form.get('costo_dia')?.updateValueAndValidity({ emitEvent: false });
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

  onClientePacienteSelected(sel: ClientePacienteSelection): void {
    const tamano = this.inferirTamanoMascota(sel.pacienteData);
    if (tamano && !this.esEdicion) {
      this.form.patchValue({ tamano_mascota: tamano });
      void this.aplicarDefaultsTamano(tamano);
    }
  }

  /** Mapea tamaño conocido del paciente (baños) a tamaño pensión si aplica. */
  private inferirTamanoMascota(paciente: ClientePacienteSelection['pacienteData']): TamanoMascotaPension | '' {
    const raw = String(paciente?.['tamano_perro'] || paciente?.['tamano'] || '').toLowerCase();
    if (raw === 'pequeno' || raw === 'mediano' || raw === 'grande') {
      return raw as TamanoMascotaPension;
    }
    return '';
  }

  async guardar(): Promise<void> {
    this.revalidarCostoDia();
    this.form.get('costo_dia')?.markAsTouched();
    if (this.form.get('costo_dia')?.hasError('costoMayorOIgualVenta')) {
      Swal.fire('Error', MENSAJE_COSTO_MAYOR_O_IGUAL_VENTA, 'error');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const raw = this.form.getRawValue();
      const payload = {
        paciente_id: String(raw.paciente_id || '').trim(),
        paciente: String(raw.paciente || '').trim(),
        cliente_id: String(raw.cliente_id || '').trim(),
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
