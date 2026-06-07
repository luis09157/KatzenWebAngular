import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InventarioService } from '../inventario.service';
import { Producto, ProductoFormData, CategoriaProducto, UnidadMedida, Proveedor } from '../../shared/inventario.models';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { LoggerService } from '../../core/logger.service';

@Component({
  selector: 'app-producto-dialog',
  templateUrl: './producto-dialog.component.html',
  styleUrls: ['./producto-dialog.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ProductoDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  productoForm: FormGroup;
  modoEdicion = false;
  loading = false;

  categorias: CategoriaProducto[] = [
    'medicamento',
    'quirurgico',
    'alimento',
    'peluqueria',
    'diagnostico',
    'accesorio'
  ];

  unidadesMedida: UnidadMedida[] = [
    'unidad',
    'ml',
    'gr',
    'kg',
    'litro',
    'caja',
    'paquete'
  ];

  proveedores: Proveedor[] = [];
  margenCalculado = 0;

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    public dialogRef: MatDialogRef<ProductoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { producto: Producto | null; modoEdicion: boolean },
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService
  ) {
    this.modoEdicion = data.modoEdicion;

    this.productoForm = this.fb.group({
      codigo_barras: [
        data.producto?.codigo_barras || '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(50)]
      ],
      nombre: [
        data.producto?.nombre || '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(200)]
      ],
      descripcion: [
        data.producto?.descripcion || '',
        [Validators.maxLength(500)]
      ],
      categoria: [
        data.producto?.categoria || 'medicamento',
        [Validators.required]
      ],
      subcategoria: [
        data.producto?.subcategoria || '',
        [Validators.maxLength(100)]
      ],
      marca: [
        data.producto?.marca || '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(100)]
      ],
      presentacion: [
        data.producto?.presentacion || '',
        [Validators.required, Validators.maxLength(100)]
      ],
      unidad_medida: [
        data.producto?.unidad_medida || 'unidad',
        [Validators.required]
      ],
      stock_minimo: [
        data.producto?.stock_minimo || 5,
        [Validators.required, Validators.min(0)]
      ],
      stock_maximo: [
        data.producto?.stock_maximo || 100,
        [Validators.required, Validators.min(1)]
      ],
      punto_reorden: [
        data.producto?.punto_reorden || 10,
        [Validators.required, Validators.min(0)]
      ],
      ubicacion_almacen: [
        data.producto?.ubicacion_almacen || '',
        [Validators.maxLength(100)]
      ],
      requiere_refrigeracion: [
        data.producto?.requiere_refrigeracion || false
      ],
      fecha_caducidad_alerta_dias: [
        data.producto?.fecha_caducidad_alerta_dias || 30,
        [Validators.required, Validators.min(1), Validators.max(365)]
      ],
      precio_compra: [
        data.producto?.precio_compra || 0,
        [Validators.required, Validators.min(0)]
      ],
      precio_venta: [
        data.producto?.precio_venta || 0,
        [Validators.required, Validators.min(0)]
      ],
      iva_aplicable: [
        data.producto?.iva_aplicable || true
      ],
      proveedor_principal_id: [
        data.producto?.proveedor_principal_id || '',
        [Validators.required]
      ],
      requiere_receta: [
        data.producto?.requiere_receta || false
      ],
      controlado: [
        data.producto?.controlado || false
      ]
    });
  }

  ngOnInit(): void {
    this.productoForm.get('precio_compra')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.calcularMargen());
    this.productoForm.get('precio_venta')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.calcularMargen());
    this.cargarProveedores();
    this.calcularMargen();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarProveedores(): void {
    this.inventarioService.getProveedores().pipe(takeUntil(this.destroy$)).subscribe({
      next: (proveedores) => {
        this.proveedores = proveedores;
        if (proveedores.length === 0) this.crearProveedorPorDefecto();
      },
      error: (error) => { this.logger.error('Error al cargar proveedores:', error); }
    });
  }

  async crearProveedorPorDefecto(): Promise<void> {
    try {
      console.log('🔄 Creando proveedor por defecto...');
      const proveedorId = await this.inventarioService.crearProveedor({
        razon_social: 'Proveedor General',
        nombre_comercial: 'Proveedor General',
        rfc: 'XAXX010101000',
        contacto_nombre: 'Sin especificar',
        contacto_telefono: '0000000000',
        contacto_email: 'contacto@proveedor.com',
        direccion: 'Sin especificar',
        ciudad: 'Sin especificar',
        estado: 'Sin especificar',
        codigo_postal: '00000',
        dias_entrega: 7,
        condiciones_pago: 'Contado'
      });

      console.log('✅ Proveedor por defecto creado con ID:', proveedorId);
      this.productoForm.patchValue({ proveedor_principal_id: proveedorId });
      this.cargarProveedores();
    } catch (error) {
      console.error('❌ Error al crear proveedor por defecto:', error);
    }
  }

  calcularMargen(): void {
    const precioCompra = this.productoForm.get('precio_compra')?.value || 0;
    const precioVenta = this.productoForm.get('precio_venta')?.value || 0;

    if (precioCompra > 0) {
      this.margenCalculado = ((precioVenta - precioCompra) / precioCompra) * 100;
    } else {
      this.margenCalculado = 0;
    }
  }

  getMargenColor(): string {
    if (this.margenCalculado >= 30) return 'success';
    if (this.margenCalculado >= 15) return 'warning';
    return 'danger';
  }

  async guardar(): Promise<void> {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      Swal.fire('Formulario Inválido', 'Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    this.loading = true;

    try {
      const formData: ProductoFormData = this.productoForm.value;

      // Validar que stock máximo sea mayor que mínimo
      if (formData.stock_maximo <= formData.stock_minimo) {
        Swal.fire('Error', 'El stock máximo debe ser mayor al stock mínimo', 'error');
        this.loading = false;
        return;
      }

      // Validar que precio de venta sea mayor que precio de compra
      if (formData.precio_venta < formData.precio_compra) {
        const result = await Swal.fire({
          title: 'Advertencia',
          text: 'El precio de venta es menor que el precio de compra. ¿Deseas continuar?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, continuar',
          cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) {
          this.loading = false;
          return;
        }
      }

      if (this.modoEdicion && this.data.producto?.id) {
        console.log('🔄 Actualizando producto...');
        await this.inventarioService.actualizarProducto(this.data.producto.id, formData as Partial<Producto>);
        Swal.fire('Éxito', 'Producto actualizado correctamente', 'success');
      } else {
        console.log('🔄 Creando nuevo producto...');
        await this.inventarioService.crearProducto(formData);
        Swal.fire('Éxito', 'Producto creado correctamente', 'success');
      }

      this.dialogRef.close(true);
    } catch (error) {
      console.error('❌ Error al guardar producto:', error);
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar producto'), 'error');
    } finally {
      this.loading = false;
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  // Helpers para validación
  hasError(campo: string, error: string): boolean {
    const control = this.productoForm.get(campo);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }

  getErrorMessage(campo: string): string {
    const control = this.productoForm.get(campo);
    if (!control) return '';

    if (control.hasError('required')) return 'Este campo es requerido';
    if (control.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    if (control.hasError('min')) {
      const min = control.errors?.['min'].min;
      return `Valor mínimo: ${min}`;
    }
    if (control.hasError('max')) {
      const max = control.errors?.['max'].max;
      return `Valor máximo: ${max}`;
    }

    return '';
  }
}

