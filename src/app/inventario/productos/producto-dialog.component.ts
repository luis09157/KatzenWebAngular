import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Subject, firstValueFrom, lastValueFrom } from 'rxjs';
import { debounceTime, finalize, takeUntil } from 'rxjs/operators';
import { InventarioService } from '../inventario.service';
import { Producto, ProductoFormData, CategoriaProducto, UnidadMedida, Proveedor } from '../../shared/inventario.models';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { LoggerService } from '../../core/logger.service';
import { LoadingService, LOADING_MESSAGES } from '../../core/loading.service';
import {
  calcularMargenPorcentaje,
  calcularVentaDesdeMargen,
  desglosarPrecioIvaIncluido,
  MENSAJE_COSTO_MAYOR_O_IGUAL_VENTA,
  resolverTasaIva,
  sugerirIvaPorCategoria,
  ventaMayorQueCostoValidator
} from '../../core/utils/precio-margen.util';
import {
  ETIQUETA_CATEGORIA_PRODUCTO,
  ETIQUETA_UNIDAD_MEDIDA,
  esCodigoInternoKatzen,
  generarCodigoInternoProducto,
  generarQrDataUrl,
  imprimirEtiquetaProducto,
  marcaProductoODefault,
  presetProductoPorCategoria
} from './producto-identificacion.util';

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
    'vacuna',
    'quirurgico',
    'alimento',
    'peluqueria',
    'diagnostico',
    'accesorio'
  ];

  unidadesMedida: UnidadMedida[] = [
    'unidad',
    'tableta',
    'capsula',
    'frasco',
    'dosis',
    'ml',
    'gr',
    'kg',
    'litro',
    'caja',
    'paquete'
  ];

  readonly etiquetaCategoria = ETIQUETA_CATEGORIA_PRODUCTO;
  readonly etiquetaUnidad = ETIQUETA_UNIDAD_MEDIDA;

  proveedores: Proveedor[] = [];
  margenCalculado = 0;
  /** Evita bucles margen % ↔ precio venta. */
  private syncingMargen = false;
  /** Si el usuario tocó IVA manualmente, no pisar al cambiar categoría. */
  private ivaManual = false;
  private ultimaCategoria: CategoriaProducto;

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadProgress = 0;
  isUploading = false;
  imagenEliminada = false;
  qrDataUrl = '';

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    public dialogRef: MatDialogRef<ProductoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { producto: Producto | null; modoEdicion: boolean },
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService,
    private router: Router,
    private storage: AngularFireStorage,
    private loadingService: LoadingService
  ) {
    this.modoEdicion = data.modoEdicion;
    const cat = (data.producto?.categoria || 'medicamento') as CategoriaProducto;
    this.ultimaCategoria = cat;
    const preset = presetProductoPorCategoria(cat);
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
        data.producto?.codigo_barras || (!this.modoEdicion ? generarCodigoInternoProducto(cat) : ''),
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
        [Validators.maxLength(100)]
      ],
      presentacion: [
        data.producto?.presentacion || (!this.modoEdicion ? preset.presentacion : ''),
        [Validators.required, Validators.maxLength(100)]
      ],
      unidad_medida: [
        data.producto?.unidad_medida || preset.unidad,
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
        data.producto?.requiere_refrigeracion ?? preset.requiere_refrigeracion
      ],
      fecha_caducidad_alerta_dias: [
        data.producto?.fecha_caducidad_alerta_dias || preset.fecha_caducidad_alerta_dias,
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

    if (data.producto?.imagen_url) {
      this.imagePreview = data.producto.imagen_url;
    }
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
      .subscribe((cat: CategoriaProducto) => this.onCategoriaChange(cat));
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
    this.productoForm
      .get('codigo_barras')
      ?.valueChanges.pipe(debounceTime(280), takeUntil(this.destroy$))
      .subscribe((codigo: string) => {
        void this.actualizarQr(codigo);
      });

    this.cargarProveedores();
    this.calcularMargen();
    this.revalidarPrecios();
    void this.actualizarQr(this.productoForm.get('codigo_barras')?.value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get hintSubcategoria(): string {
    return presetProductoPorCategoria(this.productoForm.get('categoria')?.value).subcategoriaHint;
  }

  get desgloseIva(): ReturnType<typeof desglosarPrecioIvaIncluido> {
    const venta = this.productoForm.get('precio_venta')?.value;
    const costo = this.productoForm.get('precio_compra')?.value;
    const aplica = !!this.productoForm.get('iva_aplicable')?.value;
    const tasa = this.productoForm.get('tasa_iva')?.value;
    return desglosarPrecioIvaIncluido({
      precioVenta: venta,
      costo,
      aplicaIva: aplica,
      tasaIva: resolverTasaIva(aplica, tasa)
    });
  }

  get hintIvaCategoria(): string {
    return sugerirIvaPorCategoria(this.productoForm.get('categoria')?.value).motivo;
  }

  regenerarCodigo(): void {
    const cat = this.productoForm.get('categoria')?.value as CategoriaProducto;
    this.productoForm.patchValue({ codigo_barras: generarCodigoInternoProducto(cat) });
  }

  async imprimirEtiqueta(): Promise<void> {
    const codigo = String(this.productoForm.get('codigo_barras')?.value || '').trim();
    const nombre = String(this.productoForm.get('nombre')?.value || '').trim() || 'Producto';
    if (codigo.length < 3) {
      Swal.fire('Código incompleto', 'El código debe tener al menos 3 caracteres para imprimir el QR.', 'info');
      return;
    }
    const qr = this.qrDataUrl || await generarQrDataUrl(codigo);
    if (!qr) return;
    imprimirEtiquetaProducto({
      nombre,
      codigo,
      presentacion: this.productoForm.get('presentacion')?.value,
      qrDataUrl: qr
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      Swal.fire('Error', 'Solo se permiten archivos de imagen', 'error');
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire('Error', 'La imagen no puede ser mayor a 5 MB', 'error');
      input.value = '';
      return;
    }
    this.selectedFile = file;
    this.imagenEliminada = false;
    const reader = new FileReader();
    reader.onload = e => {
      this.imagePreview = String(e.target?.result || '');
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.imagenEliminada = true;
  }

  private async actualizarQr(codigo: string): Promise<void> {
    const texto = String(codigo || '').trim();
    if (texto.length < 3) {
      this.qrDataUrl = '';
      return;
    }
    try {
      this.qrDataUrl = await generarQrDataUrl(texto);
    } catch (error) {
      this.logger.error('No se pudo generar el QR', error);
      this.qrDataUrl = '';
    }
  }

  private onCategoriaChange(categoria: CategoriaProducto): void {
    this.aplicarSugerenciaIva(categoria);
    if (!this.modoEdicion) {
      const prev = presetProductoPorCategoria(this.ultimaCategoria);
      const next = presetProductoPorCategoria(categoria);
      const patch: Partial<ProductoFormData> & { codigo_barras?: string } = {};
      const unidad = this.productoForm.get('unidad_medida')?.value;
      if (unidad === prev.unidad) patch.unidad_medida = next.unidad;
      const presentacion = String(this.productoForm.get('presentacion')?.value || '');
      if (!presentacion || presentacion === prev.presentacion) patch.presentacion = next.presentacion;
      if (this.productoForm.get('requiere_refrigeracion')?.value === prev.requiere_refrigeracion) {
        patch.requiere_refrigeracion = next.requiere_refrigeracion;
      }
      const alerta = Number(this.productoForm.get('fecha_caducidad_alerta_dias')?.value);
      if (alerta === prev.fecha_caducidad_alerta_dias) {
        patch.fecha_caducidad_alerta_dias = next.fecha_caducidad_alerta_dias;
      }
      const codigo = String(this.productoForm.get('codigo_barras')?.value || '');
      if (!codigo || esCodigoInternoKatzen(codigo)) {
        patch.codigo_barras = generarCodigoInternoProducto(categoria);
      }
      this.productoForm.patchValue(patch);
    }
    this.ultimaCategoria = categoria;
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
    this.loadingService.show(this.modoEdicion ? LOADING_MESSAGES.updating : LOADING_MESSAGES.saving);

    try {
      const raw = this.productoForm.getRawValue();
      const ivaAplicable = !!raw.iva_aplicable;
      let codigo = String(raw.codigo_barras || '').trim();
      if (!codigo) {
        codigo = generarCodigoInternoProducto(raw.categoria);
      }

      const formData: ProductoFormData = {
        codigo_barras: codigo,
        nombre: raw.nombre,
        descripcion: raw.descripcion,
        categoria: raw.categoria,
        subcategoria: raw.subcategoria,
        marca: marcaProductoODefault(raw.marca),
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
        return;
      }

      if (!(formData.precio_venta > formData.precio_compra)) {
        Swal.fire('Error', MENSAJE_COSTO_MAYOR_O_IGUAL_VENTA, 'error');
        return;
      }

      let productoId = this.modoEdicion ? this.data.producto?.id : undefined;

      if (this.modoEdicion && productoId) {
        await this.inventarioService.actualizarProducto(productoId, formData as Partial<Producto>);
      } else {
        try {
          productoId = await this.inventarioService.crearProducto(formData);
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          if (msg.includes('código de barras') && esCodigoInternoKatzen(formData.codigo_barras)) {
            formData.codigo_barras = generarCodigoInternoProducto(formData.categoria);
            this.productoForm.patchValue({ codigo_barras: formData.codigo_barras });
            productoId = await this.inventarioService.crearProducto(formData);
          } else {
            throw error;
          }
        }
      }

      if (productoId) {
        await this.persistirImagen(productoId);
      }

      this.dialogRef.close(true);
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: this.modoEdicion ? 'Producto actualizado correctamente' : 'Producto creado correctamente',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('❌ Error al guardar producto:', error);
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar producto'), 'error');
    } finally {
      this.loading = false;
      this.loadingService.hide();
    }
  }

  private async persistirImagen(productoId: string): Promise<void> {
    if (this.selectedFile) {
      try {
        const url = await this.uploadImage(productoId);
        await this.inventarioService.actualizarProducto(productoId, { imagen_url: url });
      } catch (error) {
        this.logger.error('Producto guardado, pero la foto no se subió', error);
        Swal.fire(
          'Producto guardado',
          'El catálogo se actualizó, pero la foto no se pudo subir. Puedes editar el producto e intentarlo de nuevo.',
          'warning'
        );
      }
      return;
    }
    if (this.imagenEliminada && this.modoEdicion) {
      await this.inventarioService.actualizarProducto(productoId, { imagen_url: '' });
    }
  }

  private async uploadImage(productoId: string): Promise<string> {
    if (!this.selectedFile) {
      throw new Error('No hay archivo seleccionado');
    }
    this.isUploading = true;
    this.uploadProgress = 0;
    const fileId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const filePath = `Inventario/Productos/${productoId}/${fileId}`;
    const fileRef = this.storage.ref(filePath);
    const uploadTask = this.storage.upload(filePath, this.selectedFile, {
      contentType: this.selectedFile.type
    });
    uploadTask.percentageChanges().pipe(takeUntil(this.destroy$)).subscribe(pct => {
      this.uploadProgress = pct || 0;
    });
    try {
      await lastValueFrom(uploadTask.snapshotChanges().pipe(
        finalize(() => {
          this.isUploading = false;
          this.uploadProgress = 0;
        })
      ));
      return await firstValueFrom(fileRef.getDownloadURL());
    } catch (error) {
      this.isUploading = false;
      this.uploadProgress = 0;
      throw error;
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
