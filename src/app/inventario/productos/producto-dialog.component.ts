import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InventarioService } from '../inventario.service';
import { Producto, ProductoFormData, CategoriaProducto, UnidadMedida, Proveedor } from '../../shared/inventario.models';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { LoggerService } from '../../core/logger.service';
import {
  calcularMargenPorcentaje,
  calcularVentaDesdeMargen,
  MENSAJE_COSTO_MAYOR_O_IGUAL_VENTA,
  precioConIva,
  resolverTasaIva,
  sugerirIvaPorCategoria,
  ventaMayorQueCostoValidator
} from '../../core/utils/precio-margen.util';

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
  /** Evita bucles margen % ↔ precio venta. */
  private syncingMargen = false;
  /** Si el usuario tocó IVA manualmente, no pisar al cambiar categoría. */
  private ivaManual = false;

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    public dialogRef: MatDialogRef<ProductoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { producto: Producto | null; modoEdicion: boolean },
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService,
    private router: Router
  ) {
    this.modoEdicion = data.modoEdicion;
    const cat = data.producto?.categoria || 'medicamento';
    const ivaSug = sugerirIvaPorCategoria(cat);
    const ivaAplicable =
      data.producto?.iva_aplicable !== undefined
        ? data.producto.iva_aplicable
        : ivaSug.iva_aplicable;
    const tasaIva =
      data.producto?.tasa_iva !== undefined && data.producto?.tasa_iva !== null
        ? data.producto.tasa_iva
        : ivaAplicable
          ? ivaSug.tasa_iva
          : 0;

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
      categoria: [cat, [Validators.required]],
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
      margen_objetivo: [null as number | null],
      precio_venta: [
        data.producto?.precio_venta || 0,
        [Validators.required, Validators.min(0), ventaMayorQueCostoValidator('precio_compra')]
      ],
      iva_aplicable: [ivaAplicable],
      tasa_iva: [tasaIva, [Validators.min(0), Validators.max(100)]],
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
    this.productoForm
      .get('precio_compra')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.revalidarPrecios();
        this.calcularMargen();
      });
    this.productoForm
      .get('precio_venta')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.syncingMargen) {
          this.calcularMargen();
        }
        this.revalidarPrecios();
      });
    this.productoForm
      .get('categoria')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((cat: CategoriaProducto) => this.aplicarSugerenciaIva(cat));
    this.productoForm
      .get('iva_aplicable')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((aplica: boolean) => {
        this.ivaManual = true;
        if (!aplica) {
          this.productoForm.patchValue({ tasa_iva: 0 }, { emitEvent: false });
        } else if (Number(this.productoForm.get('tasa_iva')?.value) === 0) {
          this.productoForm.patchValue({ tasa_iva: 16 }, { emitEvent: false });
        }
      });
    this.productoForm
      .get('tasa_iva')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.ivaManual = true;
      });

    this.cargarProveedores();
    this.calcularMargen();
    this.revalidarPrecios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get precioVentaConIva(): number {
    const neto = this.productoForm.get('precio_venta')?.value;
    const aplica = !!this.productoForm.get('iva_aplicable')?.value;
    const tasa = this.productoForm.get('tasa_iva')?.value;
    return precioConIva(neto, aplica, resolverTasaIva(aplica, tasa));
  }

  get hintIvaCategoria(): string {
    return sugerirIvaPorCategoria(this.productoForm.get('categoria')?.value).motivo;
  }

  private aplicarSugerenciaIva(categoria: CategoriaProducto): void {
    if (this.ivaManual || this.modoEdicion) return;
    const sug = sugerirIvaPorCategoria(categoria);
    this.productoForm.patchValue(
      { iva_aplicable: sug.iva_aplicable, tasa_iva: sug.tasa_iva },
      { emitEvent: false }
    );
  }

  private revalidarPrecios(): void {
    this.productoForm.get('precio_venta')?.updateValueAndValidity({ emitEvent: false });
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

  /** Cierra el diálogo y abre el CRUD de proveedores (menú Inventario → Proveedores). */
  irAGestionProveedores(): void {
    this.dialogRef.close(false);
    void this.router.navigate(['/admin/inventario/proveedores']);
  }

  async crearProveedorPorDefecto(): Promise<void> {
    try {
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

      this.productoForm.patchValue({ proveedor_principal_id: proveedorId });
      this.cargarProveedores();
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar proveedor'), 'error');
    }
  }

  calcularMargen(): void {
    const precioCompra = this.productoForm.get('precio_compra')?.value || 0;
    const precioVenta = this.productoForm.get('precio_venta')?.value || 0;
    this.margenCalculado = calcularMargenPorcentaje(precioCompra, precioVenta);
    if (!this.syncingMargen) {
      this.productoForm.patchValue(
        { margen_objetivo: Math.round(this.margenCalculado * 100) / 100 },
        { emitEvent: false }
      );
    }
  }

  /** Recalcula precio de venta desde margen % deseado. */
  onMargenObjetivoChange(): void {
    const costo = Number(this.productoForm.get('precio_compra')?.value);
    const margen = Number(this.productoForm.get('margen_objetivo')?.value);
    if (!(costo > 0) || Number.isNaN(margen)) {
      return;
    }
    const venta = calcularVentaDesdeMargen(costo, margen);
    if (venta == null) return;
    this.syncingMargen = true;
    this.productoForm.patchValue({ precio_venta: venta }, { emitEvent: false });
    this.margenCalculado = margen;
    this.revalidarPrecios();
    this.syncingMargen = false;
  }

  getMargenColor(): string {
    if (this.margenCalculado >= 30) return 'success';
    if (this.margenCalculado >= 15) return 'warning';
    return 'danger';
  }

  async guardar(): Promise<void> {
    this.revalidarPrecios();
    this.productoForm.get('precio_venta')?.markAsTouched();

    if (this.productoForm.get('precio_venta')?.hasError('costoMayorOIgualVenta')) {
      Swal.fire('Error', MENSAJE_COSTO_MAYOR_O_IGUAL_VENTA, 'error');
      return;
    }

    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      Swal.fire('Formulario Inválido', 'Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    this.loading = true;

    try {
      const raw = this.productoForm.getRawValue();
      const ivaAplicable = !!raw.iva_aplicable;
      const formData: ProductoFormData = {
        codigo_barras: raw.codigo_barras,
        nombre: raw.nombre,
        descripcion: raw.descripcion,
        categoria: raw.categoria,
        subcategoria: raw.subcategoria,
        marca: raw.marca,
        presentacion: raw.presentacion,
        unidad_medida: raw.unidad_medida,
        stock_minimo: raw.stock_minimo,
        stock_maximo: raw.stock_maximo,
        punto_reorden: raw.punto_reorden,
        ubicacion_almacen: raw.ubicacion_almacen,
        requiere_refrigeracion: raw.requiere_refrigeracion,
        fecha_caducidad_alerta_dias: raw.fecha_caducidad_alerta_dias,
        precio_compra: Number(raw.precio_compra) || 0,
        precio_venta: Number(raw.precio_venta) || 0,
        iva_aplicable: ivaAplicable,
        tasa_iva: resolverTasaIva(ivaAplicable, raw.tasa_iva),
        proveedor_principal_id: raw.proveedor_principal_id,
        requiere_receta: raw.requiere_receta,
        controlado: raw.controlado
      };

      if (formData.stock_maximo <= formData.stock_minimo) {
        Swal.fire('Error', 'El stock máximo debe ser mayor al stock mínimo', 'error');
        this.loading = false;
        return;
      }

      if (!(formData.precio_venta > formData.precio_compra)) {
        Swal.fire('Error', MENSAJE_COSTO_MAYOR_O_IGUAL_VENTA, 'error');
        this.loading = false;
        return;
      }

      if (this.modoEdicion && this.data.producto?.id) {
        await this.inventarioService.actualizarProducto(this.data.producto.id, formData as Partial<Producto>);
        this.dialogRef.close(true);
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Producto actualizado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await this.inventarioService.crearProducto(formData);
        this.dialogRef.close(true);
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Producto creado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      }

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

  hasError(campo: string, error: string): boolean {
    const control = this.productoForm.get(campo);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }

  getErrorMessage(campo: string): string {
    const control = this.productoForm.get(campo);
    if (!control) return '';

    if (control.hasError('costoMayorOIgualVenta')) {
      return MENSAJE_COSTO_MAYOR_O_IGUAL_VENTA;
    }
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
