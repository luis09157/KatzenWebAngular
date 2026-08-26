import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { InventarioService } from '../inventario/inventario.service';
import { Producto } from '../shared/inventario.models';
import {
  PLANTILLA_TIPO_LABELS,
  PlantillaCosto,
  PlantillaTipoServicio,
  calcularCostoTotalItems
} from './plantilla-costo.models';
import { PlantillaCostoService } from './plantilla-costo.service';

@Component({
  selector: 'app-plantilla-costo-dialog',
  templateUrl: './plantilla-costo-dialog.component.html',
  styleUrls: ['./plantilla-costo-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PlantillaCostoDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  form: FormGroup;
  loading = false;
  productos: Producto[] = [];

  readonly tipos = (Object.keys(PLANTILLA_TIPO_LABELS) as PlantillaTipoServicio[]).map((value) => ({
    value,
    label: PLANTILLA_TIPO_LABELS[value]
  }));

  constructor(
    private fb: FormBuilder,
    private plantillaService: PlantillaCostoService,
    private inventarioService: InventarioService,
    private dialogRef: MatDialogRef<PlantillaCostoDialogComponent>,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    @Inject(MAT_DIALOG_DATA) public data: { plantilla?: PlantillaCosto }
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      tipoServicio: ['banio' as PlantillaTipoServicio, Validators.required],
      precioSugeridoCliente: [null],
      items: this.fb.array([])
    });
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  get costoTotal(): number {
    return calcularCostoTotalItems(this.items.getRawValue());
  }

  get margenPreview(): number | null {
    const precio = Number(this.form.get('precioSugeridoCliente')?.value);
    if (!precio || Number.isNaN(precio)) return null;
    return Math.round((precio - this.costoTotal) * 100) / 100;
  }

  ngOnInit(): void {
    this.inventarioService
      .getProductos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => {
          this.productos = (list || []).filter((p) => p.activo !== false);
        },
        error: () => {
          this.productos = [];
        }
      });

    const p = this.data?.plantilla;
    if (p) {
      this.form.patchValue({
        nombre: p.nombre,
        tipoServicio: p.tipoServicio || 'banio',
        precioSugeridoCliente: p.precioSugeridoCliente ?? null
      });
      (p.items || []).forEach((it) => this.addItem(it));
    }
    if (this.items.length === 0) {
      this.addItem();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addItem(seed?: {
    tipo?: string;
    productoId?: string;
    nombre?: string;
    cantidad?: number;
    costoUnitario?: number;
  }): void {
    this.items.push(
      this.fb.group({
        tipo: [seed?.tipo === 'producto_inventario' ? 'producto_inventario' : 'gasto_libre'],
        productoId: [seed?.productoId || ''],
        nombre: [seed?.nombre || '', Validators.required],
        cantidad: [seed?.cantidad ?? 1, [Validators.required, Validators.min(0.01)]],
        costoUnitario: [seed?.costoUnitario ?? 0, [Validators.required, Validators.min(0)]]
      })
    );
  }

  removeItem(index: number): void {
    if (this.items.length <= 1) return;
    this.items.removeAt(index);
  }

  onTipoItemChange(index: number): void {
    const g = this.items.at(index);
    if (g.get('tipo')?.value === 'gasto_libre') {
      g.patchValue({ productoId: '' });
    }
  }

  onProductoChange(index: number): void {
    const g = this.items.at(index);
    const id = g.get('productoId')?.value;
    const prod = this.productos.find((p) => p.id === id);
    if (!prod) return;
    g.patchValue({
      nombre: prod.nombre,
      costoUnitario: Number(prod.precio_compra) || 0
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  async guardar(): Promise<void> {
    if (this.form.invalid || this.items.length === 0) {
      this.form.markAllAsTouched();
      this.items.controls.forEach((c) => c.markAllAsTouched());
      Swal.fire('Formulario incompleto', 'Nombre e ítems de costo son obligatorios.', 'warning');
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      nombre: String(raw.nombre).trim(),
      tipoServicio: raw.tipoServicio as PlantillaTipoServicio,
      precioSugeridoCliente:
        raw.precioSugeridoCliente != null && raw.precioSugeridoCliente !== ''
          ? Number(raw.precioSugeridoCliente)
          : undefined,
      items: raw.items.map((it: {
        tipo: string;
        productoId: string;
        nombre: string;
        cantidad: number;
        costoUnitario: number;
      }) => ({
        tipo: it.tipo === 'producto_inventario' ? 'producto_inventario' : 'gasto_libre',
        productoId: it.productoId || undefined,
        nombre: String(it.nombre).trim(),
        cantidad: Number(it.cantidad),
        costoUnitario: Number(it.costoUnitario)
      }))
    };

    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      if (this.data?.plantilla?.id) {
        await this.plantillaService.actualizarPlantilla(this.data.plantilla.id, payload);
      } else {
        await this.plantillaService.crearPlantilla(payload);
      }
      this.dialogRef.close({ ok: true });
      Swal.fire({
        icon: 'success',
        title: 'Plantilla guardada',
        timer: 1600,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar plantilla de costo'), 'error');
    } finally {
      this.loadingService.hide();
      this.loading = false;
    }
  }

  formatMoney(n: number): string {
    return `$${(Number(n) || 0).toFixed(2)}`;
  }
}
