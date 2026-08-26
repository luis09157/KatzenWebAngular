import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { InventarioService } from '../inventario.service';
import { OrdenCompra, Producto } from '../../shared/inventario.models';
import { CajaMovimientoDialogComponent } from '../../finanzas/caja-movimiento-dialog.component';
import { ADMIN_DIALOG_CONFIG } from '../../core/config/admin-ui.config';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../../core/loading.service';

@Component({
  selector: 'app-recibir-orden-dialog',
  templateUrl: './recibir-orden-dialog.component.html',
  styleUrls: ['./recibir-orden-dialog.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class RecibirOrdenDialogComponent implements OnInit {
  recibirForm: FormGroup;
  loading = false;
  orden: OrdenCompra;
  productos: Map<string, Producto> = new Map();

  /** Ya hay egreso vinculado: no ofrecer checkbox de nuevo. */
  get yaTieneEgresoCaja(): boolean {
    return !!this.orden.cajaMovimientoId;
  }

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<RecibirOrdenDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { orden: OrdenCompra },
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService
  ) {
    this.orden = data.orden;

    this.recibirForm = this.fb.group({
      fecha_recepcion: [new Date()],
      productos: this.fb.array([]),
      observaciones: [''],
      registrarEgresoCaja: [false]
    });
  }

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.inventarioService.getProductos().subscribe({
      next: (productos) => {
        productos.forEach(p => {
          if (p.id) this.productos.set(p.id, p);
        });

        this.orden.items.forEach(p => {
          const productoGroup = this.fb.group({
            producto_id: [p.producto_id],
            cantidad_solicitada: [p.cantidad_solicitada],
            cantidad_recibida: [p.cantidad_recibida || 0],
            cantidad_a_recibir: [p.cantidad_solicitada - (p.cantidad_recibida || 0)],
            precio_unitario: [p.precio_unitario || 0]
          });

          this.productosArray.push(productoGroup);
        });
      },
      error: (error) => {
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cargar productos orden'), 'error');
      }
    });
  }

  get productosArray(): FormArray {
    return this.recibirForm.get('productos') as FormArray;
  }

  getProductoNombre(productoId: string): string {
    return this.productos.get(productoId)?.nombre || 'Desconocido';
  }

  getProductoPresentacion(productoId: string): string {
    return this.productos.get(productoId)?.presentacion || '';
  }

  getProductoUnidad(productoId: string): string {
    return this.productos.get(productoId)?.unidad_medida || '';
  }

  /** Monto sugerido del egreso = Σ (cantidad_a_recibir × precio_unitario). */
  get montoEgresoSugerido(): number {
    let total = 0;
    for (const ctrl of this.productosArray.controls) {
      const qty = Number(ctrl.get('cantidad_a_recibir')?.value) || 0;
      const precio = Number(ctrl.get('precio_unitario')?.value) || 0;
      if (qty > 0) total += qty * precio;
    }
    return Math.round(total * 100) / 100;
  }

  recibirTodo(): void {
    this.productosArray.controls.forEach(control => {
      const pendiente = control.get('cantidad_solicitada')?.value -
                       control.get('cantidad_recibida')?.value;
      control.patchValue({ cantidad_a_recibir: pendiente });
    });
  }

  async guardar(): Promise<void> {
    const productosARecibir = this.recibirForm.value.productos.filter(
      (p: { cantidad_a_recibir: number }) => p.cantidad_a_recibir > 0
    );

    if (productosARecibir.length === 0) {
      Swal.fire('Sin Productos', 'Debes recibir al menos un producto', 'warning');
      return;
    }

    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);

    try {
      if (!this.orden.id) throw new Error('ID de orden no válido');

      await this.inventarioService.recibirOrdenCompra(
        this.orden.id,
        productosARecibir,
        this.recibirForm.value.observaciones
      );

      this.loadingService.hide();
      this.loading = false;

      const quiereEgreso =
        !this.yaTieneEgresoCaja &&
        !!this.recibirForm.value.registrarEgresoCaja;

      if (quiereEgreso) {
        await this.abrirEgresoCaja(productosARecibir.length);
        this.dialogRef.close(true);
        return;
      }

      Swal.fire({
        icon: 'success',
        title: 'Orden Recibida',
        text: `Se han recibido ${productosARecibir.length} productos`,
        timer: 2000,
        showConfirmButton: false
      });

      this.dialogRef.close(true);
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'recibir orden'), 'error');
      this.loadingService.hide();
      this.loading = false;
    }
  }

  private async abrirEgresoCaja(numProductos: number): Promise<void> {
    const proveedor = this.orden.proveedor || 'Proveedor';
    const monto = this.montoEgresoSugerido > 0 ? this.montoEgresoSugerido : this.orden.total;
    const ref = this.dialog.open(CajaMovimientoDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '640px',
      disableClose: true,
      data: {
        tipo: 'egreso' as const,
        concepto: `OC ${this.orden.folio} · ${proveedor}`,
        monto,
        metodoPago: 'transferencia' as const,
        categoria: 'proveedores' as const,
        notas: `Recepción ${numProductos} producto(s). Forma pago OC: ${this.orden.forma_pago || '—'}`
      }
    });

    const result = await firstValueFrom(ref.afterClosed());
    const cajaId = result?.movimientoId as string | undefined;
    if (cajaId && this.orden.id) {
      try {
        await this.inventarioService.vincularOrdenACaja(this.orden.id, cajaId, true);
      } catch (err) {
        Swal.fire(
          'Aviso',
          this.errorMessages.getUserMessage(err, 'vincular egreso a orden'),
          'warning'
        );
      }
    } else {
      await Swal.fire({
        icon: 'info',
        title: 'Recepción guardada sin egreso',
        text: 'El stock ya se actualizó. Puedes registrar el pago después en Finanzas → Egreso (Proveedores).',
        confirmButtonText: 'Entendido'
      });
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
