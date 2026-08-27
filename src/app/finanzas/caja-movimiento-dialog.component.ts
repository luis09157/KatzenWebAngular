import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { CajaService } from './caja.service';
import {
  CAJA_CATEGORIA_LABELS,
  CAJA_CATEGORIAS_EGRESO,
  CAJA_CATEGORIAS_INGRESO,
  CajaCategoria,
  CajaMetodoPago,
  CajaTipoMovimiento
} from './caja.models';
import { PlantillaCosto, PLANTILLA_TIPO_LABELS } from './plantilla-costo.models';
import { PlantillaCostoService } from './plantilla-costo.service';

@Component({
  selector: 'app-caja-movimiento-dialog',
  templateUrl: './caja-movimiento-dialog.component.html',
  styleUrls: ['./caja-movimiento-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CajaMovimientoDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  form: FormGroup;
  loading = false;
  plantillas: PlantillaCosto[] = [];

  readonly tipos: Array<{ value: CajaTipoMovimiento; label: string }> = [
    { value: 'ingreso', label: 'Ingreso' },
    { value: 'egreso', label: 'Egreso' }
  ];

  readonly metodos: Array<{ value: CajaMetodoPago; label: string }> = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'transferencia', label: 'Transferencia' }
  ];

  readonly categoriaLabels = CAJA_CATEGORIA_LABELS;

  constructor(
    private fb: FormBuilder,
    private cajaService: CajaService,
    private plantillaService: PlantillaCostoService,
    private dialogRef: MatDialogRef<CajaMovimientoDialogComponent>,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      tipo?: CajaTipoMovimiento;
      fechaDefault?: string;
      banioId?: string;
      citaId?: string;
      clienteId?: string;
      concepto?: string;
      monto?: number;
      metodoPago?: CajaMetodoPago;
      notas?: string;
      categoria?: CajaCategoria;
      costoAsociado?: number;
      plantillaCostoId?: string;
      movimientoInventarioIds?: string[];
    }
  ) {
    this.form = this.fb.group({
      tipo: [(this.data?.tipo || 'ingreso') as CajaTipoMovimiento, Validators.required],
      concepto: ['', [Validators.required, Validators.minLength(3)]],
      monto: [null, [Validators.required, Validators.min(0.01)]],
      metodoPago: ['efectivo' as CajaMetodoPago, Validators.required],
      ivaDeclarado: [false],
      fecha: [this.cajaService.hoyLocalIsoDate(), Validators.required],
      notas: [''],
      categoria: ['otro' as CajaCategoria, Validators.required],
      plantillaCostoId: [''],
      costoAsociado: [null]
    });
  }

  get categoriasDisponibles(): CajaCategoria[] {
    const tipo = this.form.get('tipo')?.value as CajaTipoMovimiento;
    return tipo === 'egreso' ? CAJA_CATEGORIAS_EGRESO : CAJA_CATEGORIAS_INGRESO;
  }

  get margenPreview(): number | null {
    const tipo = this.form.get('tipo')?.value;
    const monto = Number(this.form.get('monto')?.value);
    const costo = this.form.get('costoAsociado')?.value;
    if (tipo !== 'ingreso' || costo == null || costo === '' || Number.isNaN(Number(costo))) {
      return null;
    }
    if (!monto || Number.isNaN(monto)) return null;
    return Math.round((monto - Number(costo)) * 100) / 100;
  }

  ngOnInit(): void {
    this.plantillaService
      .getPlantillas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => {
          this.plantillas = list || [];
        },
        error: () => {
          this.plantillas = [];
        }
      });

    if (this.data?.tipo) {
      this.form.patchValue({ tipo: this.data.tipo });
    }
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
    if (this.data?.categoria) {
      this.form.patchValue({ categoria: this.data.categoria });
    }
    if (this.data?.costoAsociado != null) {
      this.form.patchValue({ costoAsociado: this.data.costoAsociado });
    }
    if (this.data?.plantillaCostoId) {
      this.form.patchValue({ plantillaCostoId: this.data.plantillaCostoId });
    }

    this.form
      .get('tipo')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((tipo: CajaTipoMovimiento) => {
        const cats = tipo === 'egreso' ? CAJA_CATEGORIAS_EGRESO : CAJA_CATEGORIAS_INGRESO;
        const actual = this.form.get('categoria')?.value as CajaCategoria;
        if (!cats.includes(actual)) {
          this.form.patchValue({
            categoria: tipo === 'egreso' ? 'operativo' : 'otro',
            plantillaCostoId: '',
            costoAsociado: tipo === 'egreso' ? null : this.form.get('costoAsociado')?.value
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPlantillaChange(): void {
    const id = this.form.get('plantillaCostoId')?.value;
    if (!id) return;
    const p = this.plantillas.find((x) => x.id === id);
    if (!p) return;
    const patch: Record<string, unknown> = {
      costoAsociado: Number(p.costoTotalEstimado) || 0
    };
    if (!this.form.get('concepto')?.value) {
      patch['concepto'] = p.nombre;
    }
    if (p.precioSugeridoCliente != null && !this.form.get('monto')?.value) {
      patch['monto'] = p.precioSugeridoCliente;
    }
    const mapTipo: Partial<Record<string, CajaCategoria>> = {
      banio: 'banio',
      corte: 'corte',
      cirugia: 'cirugia',
      consulta: 'consulta',
      vacuna: 'vacuna',
      pension: 'pension',
      otro: 'otro'
    };
    const cat = mapTipo[p.tipoServicio];
    if (cat) patch['categoria'] = cat;
    this.form.patchValue(patch);
  }

  labelPlantilla(p: PlantillaCosto): string {
    const tipo = PLANTILLA_TIPO_LABELS[p.tipoServicio] || p.tipoServicio;
    return `${p.nombre} · ${tipo} · costo $${(Number(p.costoTotalEstimado) || 0).toFixed(2)}`;
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  async guardar(): Promise<void> {
    this.syncFromDom();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire('Formulario incompleto', 'Completa concepto, monto, método, categoría y fecha.', 'warning');
      return;
    }

    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const raw = this.form.getRawValue();
      const costoRaw = raw.costoAsociado;
      const movId = await this.cajaService.crearMovimiento({
        tipo: raw.tipo,
        concepto: String(raw.concepto).trim(),
        monto: Number(raw.monto),
        metodoPago: raw.metodoPago,
        ivaDeclarado: !!raw.ivaDeclarado,
        fecha: raw.fecha,
        banioId: this.data?.banioId,
        citaId: this.data?.citaId,
        clienteId: this.data?.clienteId,
        notas: raw.notas ? String(raw.notas).trim() : undefined,
        categoria: raw.categoria,
        plantillaCostoId: raw.plantillaCostoId || undefined,
        costoAsociado:
          costoRaw != null && costoRaw !== '' && !Number.isNaN(Number(costoRaw))
            ? Number(costoRaw)
            : undefined,
        movimientoInventarioIds: this.data?.movimientoInventarioIds
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

  formatMoney(n: number): string {
    return `$${(Number(n) || 0).toFixed(2)}`;
  }

  private syncFromDom(): void {
    for (const name of ['concepto', 'monto', 'fecha', 'notas', 'costoAsociado']) {
      const control = this.form.get(name);
      const el = document.querySelector(
        `app-caja-movimiento-dialog input[formControlName="${name}"], app-caja-movimiento-dialog textarea[formControlName="${name}"]`
      ) as HTMLInputElement | HTMLTextAreaElement | null;
      if (!control || !el) continue;
      const domValue = el.value;
      const controlValue = control.value == null ? '' : String(control.value);
      if (domValue && domValue !== controlValue) {
        control.setValue(
          name === 'monto' || name === 'costoAsociado' ? Number(domValue) : domValue
        );
        control.updateValueAndValidity({ emitEvent: false });
      }
    }
  }
}
