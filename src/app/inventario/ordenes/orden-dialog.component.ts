import { Component, OnInit, ViewEncapsulation} from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { Proveedor, Producto, OrdenCompraFormData } from '../../shared/inventario.models';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';

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
  productos: Producto[] = [];
  productosFiltrados: Observable<Producto[]>;

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    public dialogRef: MatDialogRef<OrdenDialogComponent>,
    private errorMessages: ErrorMessagesService
  ) {
    this.ordenForm = this.fb.group({
      proveedor_id: ['', Validators.required],
      fecha_orden: [new Date(), Validators.required],
      fecha_entrega_esperada: ['', Validators.required],
      productos: this.fb.array([]),
      observaciones: ['']
    });

    this.productosFiltrados = this.ordenForm.get('proveedor_id')!.valueChanges.pipe(
      startWith(''),
      map(value => this.productos)
    );
  }

  ngOnInit(): void {
    console.log('🚀 Orden Dialog cargado');
    this.cargarDatos();
    
    // Establecer fecha mínima de entrega (mañana)
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    this.ordenForm.patchValue({
      fecha_entrega_esperada: manana
    });
  }

  cargarDatos(): void {
    // Cargar proveedores
    this.inventarioService.getProveedores().subscribe({
      next: (proveedores) => {
        this.proveedores = proveedores.filter(p => p.activo);
        console.log('✅ Proveedores cargados:', proveedores.length);
      },
      error: (error) => console.error('❌ Error al cargar proveedores:', error)
    });

    // Cargar productos
    this.inventarioService.getProductos().subscribe({
      next: (productos) => {
        this.productos = productos.filter(p => p.activo);
        console.log('✅ Productos cargados:', productos.length);
      },
      error: (error) => console.error('❌ Error al cargar productos:', error)
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

    // Auto-calcular subtotal
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

  onProductoSeleccionado(productoGroup: FormGroup, producto: Producto): void {
    console.log('🔍 Producto seleccionado:', producto.nombre);
    productoGroup.patchValue({
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      precio_unitario: producto.precio_compra
    });
    this.calcularSubtotal(productoGroup);
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

  displayProducto(producto: Producto | null): string {
    return producto ? producto.nombre : '';
  }

  getProductosFiltradosArray(index: number): Observable<Producto[]> {
    const productoControl = this.productosArray.at(index).get('producto_nombre');
    return productoControl!.valueChanges.pipe(
      startWith(''),
      map(value => this._filtrarProductos(value || ''))
    );
  }

  private _filtrarProductos(valor: string): Producto[] {
    if (typeof valor !== 'string') return this.productos;
    
    const filtro = valor.toLowerCase();
    return this.productos.filter(p => 
      p.nombre.toLowerCase().includes(filtro) ||
      p.codigo_barras.toLowerCase().includes(filtro)
    );
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
      
      // Preparar productos
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

      console.log('🔄 Creando orden...');
      await this.inventarioService.crearOrdenCompra(ordenData);
      console.log('✅ Orden creada');

      Swal.fire({
        icon: 'success',
        title: 'Orden Creada',
        text: 'La orden de compra ha sido registrada',
        timer: 2000,
        showConfirmButton: false
      });

      this.dialogRef.close(true);
    } catch (error) {
      console.error('❌ Error al crear orden:', error);
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

