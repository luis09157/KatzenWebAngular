import { Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { Producto, Proveedor } from '../../shared/inventario.models';
import { Observable } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { LoggerService } from '../../core/logger.service';

@Component({
  selector: 'app-entrada-dialog',
  templateUrl: './entrada-dialog.component.html',
  styleUrls: ['./entrada-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class EntradaDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  entradaForm: FormGroup;
  loading = false;
  productos: Producto[] = [];
  proveedores: Proveedor[] = [];
  productosFiltrados: Observable<Producto[]>;
  productoSeleccionado: Producto | null = null;

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    public dialogRef: MatDialogRef<EntradaDialogComponent>,
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService
  ) {
    this.entradaForm = this.fb.group({
      producto_busqueda: ['', Validators.required],
      producto_id: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      costo_unitario: [0, [Validators.required, Validators.min(0)]],
      lote_numero: [''],
      lote_fecha_caducidad: [''],
      proveedor_id: [''],
      numero_factura: [''],
      observaciones: ['']
    });

    // Inicializar el observable de productos filtrados
    this.productosFiltrados = this.entradaForm.get('producto_busqueda')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filtrarProductos(value || ''))
    );
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatos(): void {
    this.inventarioService.getProductos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (productos) => { this.productos = productos; },
      error: (error) => {
        this.logger.error('Error al cargar productos:', error);
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cargar datos'), 'error');
      }
    });
    this.inventarioService.getProveedores().pipe(takeUntil(this.destroy$)).subscribe({
      next: (proveedores) => { this.proveedores = proveedores; },
      error: (error) => {
        this.logger.error('Error al cargar proveedores:', error);
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cargar datos'), 'error');
      }
    });
  }

  private _filtrarProductos(valor: string): Producto[] {
    if (typeof valor !== 'string') return this.productos;
    
    const filtro = valor.toLowerCase();
    return this.productos.filter(p => 
      p.nombre.toLowerCase().includes(filtro) ||
      p.codigo_barras.toLowerCase().includes(filtro) ||
      p.marca.toLowerCase().includes(filtro)
    );
  }

  displayProducto(producto: Producto | null): string {
    return producto ? `${producto.nombre} - ${producto.presentacion}` : '';
  }

  onProductoSeleccionado(producto: Producto): void {
    this.productoSeleccionado = producto;
    this.entradaForm.patchValue({
      producto_id: producto.id,
      costo_unitario: producto.precio_compra,
      proveedor_id: producto.proveedor_principal_id
    });
  }

  calcularTotal(): number {
    const cantidad = this.entradaForm.get('cantidad')?.value || 0;
    const costoUnitario = this.entradaForm.get('costo_unitario')?.value || 0;
    return cantidad * costoUnitario;
  }

  async guardar(): Promise<void> {
    if (this.entradaForm.invalid || !this.productoSeleccionado) {
      this.entradaForm.markAllAsTouched();
      Swal.fire('Formulario Incompleto', 'Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    this.loading = true;

    try {
      const formData = this.entradaForm.value;

      await this.inventarioService.registrarEntrada(
        formData.producto_id,
        formData.cantidad,
        formData.costo_unitario,
        `Entrada de producto. ${formData.observaciones || ''}`.trim(),
        undefined, // orden_compra_id
        formData.observaciones
      );

      Swal.fire({
        icon: 'success',
        title: 'Entrada Registrada',
        html: `
          <strong>${this.productoSeleccionado.nombre}</strong><br>
          Cantidad: ${formData.cantidad} ${this.productoSeleccionado.unidad_medida}<br>
          Costo total: $${this.calcularTotal().toFixed(2)}
        `,
        timer: 3000,
        showConfirmButton: false
      });

      this.dialogRef.close(true);
    } catch (error) {
      console.error('❌ Error al registrar entrada:', error);
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'registrar entrada'), 'error');
    } finally {
      this.loading = false;
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  hasError(campo: string, error: string): boolean {
    const control = this.entradaForm.get(campo);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }
}

