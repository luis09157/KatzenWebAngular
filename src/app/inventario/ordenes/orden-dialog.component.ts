import { Component, Inject, OnInit, Optional, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { Proveedor } from '../../shared/inventario.models';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { ProductoSelection } from '../../shared/admin/producto-picker.models';

export interface OrdenDialogPrefill {
  productoId?: string;
  proveedorId?: string;
  cantidad?: number;
}

@Component({
  selector: 'app-orden-dialog',
  templateUrl: './orden-dialog.component.html',
  styleUrls: ['./orden-dialog.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class OrdenDialogComponent implements OnInit {
  ordenForm: FormGroup;
  loading = false;

  proveedores: Proveedor[] = [];

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    public dialogRef: MatDialogRef<OrdenDialogComponent>,
    private errorMessages: ErrorMessagesService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: OrdenDialogPrefill | null
  ) {
    this.ordenForm = this.fb.group({
      proveedor_id: ['', Validators.required],
      fecha_orden: [new Date(), Validators.required],
      fecha_entrega_esperada: ['', Validators.required],
      productos: this.fb.array([]),
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.cargarDatos();

    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    this.ordenForm.patchValue({
      fecha_entrega_esperada: manana
    });
  }

  cargarDatos(): void {
    this.inventarioService.getProveedores().subscribe({
      next: (proveedores) => {
        this.proveedores = proveedores.filter(p => p.activo);
        if (this.data?.proveedorId) {
          this.ordenForm.patchValue({ proveedor_id: this.data.proveedorId });
        }
        this.aplicarPrefillProducto();
      },
      error: (error) => {
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cargar proveedores orden'), 'error');
      }
    });
  }

  private aplicarPrefillProducto(): void {
    const productoId = this.data?.productoId;
    if (!productoId) return;

    if (this.productosArray.length === 0) {
      this.agregarProducto();
    }
    const group = this.productosArray.at(0) as FormGroup;
    if (group.get('producto_id')?.value) return;
    const qty = Math.max(1, Number(this.data?.cantidad) || 1);
    group.patchValue({
      producto_id: productoId,
      cantidad: qty
    });
  }

  get productosArray(): FormArray {
    return this.ordenForm.get('productos') as FormArray;
  }

  agregarProducto(): void {
    const productoGroup = this.fb.group({
      producto_id: ['', Validators.required],
      producto_nombre: [''],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precio_unitario: [0, [Validators.required, Validators.min(0)]],
      subtotal: [{ value: 0, disabled: true }]
    });

    productoGroup.get('cantidad')?.valueChanges.subscribe(() => {
      this.calcularSubtotal(productoGroup);
    });
    productoGroup.get('precio_unitario')?.valueChanges.subscribe(() => {
      this.calcularSubtotal(productoGroup);
    });

    this.productosArray.push(productoGroup);
  }

  removerProducto(index: number): void {
    this.productosArray.removeAt(index);
    this.calcularTotal();
  }

  onProductoSeleccionado(productoGroup: FormGroup, sel: ProductoSelection): void {
    const producto = sel.producto;
    if (!producto) {
      productoGroup.patchValue({ producto_id: '', producto_nombre: '', precio_unitario: 0 });
      this.calcularSubtotal(productoGroup);
      return;
    }
    productoGroup.patchValue({
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      precio_unitario: producto.precio_compra
    });
    if (!this.data?.cantidad && this.data?.productoId === producto.id) {
      const qty = Math.max(1, Number(producto.stock_minimo) || 1);
      if (Number(productoGroup.get('cantidad')?.value) === 1) {
        productoGroup.patchValue({ cantidad: qty });
      }
    }
    if (!this.data?.proveedorId && producto.proveedor_principal_id && !this.ordenForm.get('proveedor_id')?.value) {
      this.ordenForm.patchValue({ proveedor_id: producto.proveedor_principal_id });
    }
    if (!this.ordenForm.get('observaciones')?.value && this.data?.productoId === producto.id) {
      this.ordenForm.patchValue({
        observaciones: `Reposición stock · ${producto.nombre}`
      });
    }
    this.calcularSubtotal(productoGroup);
  }

  grupoProducto(index: number): FormGroup {
    return this.productosArray.at(index) as FormGroup;
  }

  calcularSubtotal(productoGroup: FormGroup): void {
    const cantidad = productoGroup.get('cantidad')?.value || 0;
    const precioUnitario = productoGroup.get('precio_unitario')?.value || 0;
    const subtotal = cantidad * precioUnitario;
    productoGroup.patchValue({ subtotal }, { emitEvent: false });
    this.calcularTotal();
  }

  calcularTotal(): number {
    let total = 0;
    this.productosArray.controls.forEach(control => {
      const cantidad = control.get('cantidad')?.value || 0;
      const precioUnitario = control.get('precio_unitario')?.value || 0;
      total += cantidad * precioUnitario;
    });
    return total;
  }

  async guardar(): Promise<void> {
    if (this.ordenForm.invalid || this.productosArray.length === 0) {
      this.ordenForm.markAllAsTouched();
      this.productosArray.controls.forEach(c => c.markAllAsTouched());

      if (this.productosArray.length === 0) {
        Swal.fire('Productos Requeridos', 'Agrega al menos un producto a la orden', 'warning');
      } else {
        Swal.fire('Formulario Incompleto', 'Por favor completa todos los campos requeridos', 'warning');
      }
      return;
    }

    this.loading = true;

    try {
      const formData = this.ordenForm.getRawValue();

      const productosFormateados = formData.productos.map((p: any) => ({
        producto_id: p.producto_id,
        cantidad_solicitada: p.cantidad,
        cantidad_recibida: 0,
        precio_unitario: p.precio_unitario
      }));

      const ordenData: any = {
        proveedor_id: formData.proveedor_id,
        fecha_orden: new Date().toISOString(),
        fecha_entrega_esperada: new Date(formData.fecha_entrega_esperada).toISOString(),
        productos: productosFormateados,
        subtotal: this.calcularTotal(),
        impuestos: this.calcularTotal() * 0.16,
        total: this.calcularTotal() * 1.16,
        observaciones: formData.observaciones || ''
      };

      await this.inventarioService.crearOrdenCompra(ordenData);

      Swal.fire({
        icon: 'success',
        title: 'Orden Creada',
        text: 'La orden de compra ha sido registrada',
        timer: 2000,
        showConfirmButton: false
      });

      this.dialogRef.close(true);
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar orden'), 'error');
    } finally {
      this.loading = false;
    }
  }

  cancelar(): void {
    if (this.ordenForm.dirty || this.productosArray.length > 0) {
      Swal.fire({
        title: '¿Cancelar?',
        text: 'Los cambios no guardados se perderán',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'Continuar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.dialogRef.close(false);
        }
      });
    } else {
      this.dialogRef.close(false);
    }
  }

  hasError(campo: string, error: string): boolean {
    const control = this.ordenForm.get(campo);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }
}
