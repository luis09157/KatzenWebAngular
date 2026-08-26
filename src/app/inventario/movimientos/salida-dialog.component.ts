import { Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { Producto } from '../../shared/inventario.models';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { LoggerService } from '../../core/logger.service';
import { LoadingService, LOADING_MESSAGES } from '../../core/loading.service';
import { ADMIN_DIALOG_CONFIG } from '../../core/config/admin-ui.config';
import { CajaMovimientoDialogComponent } from '../../finanzas/caja-movimiento-dialog.component';

@Component({
  selector: 'app-salida-dialog',
  templateUrl: './salida-dialog.component.html',
  styleUrls: ['./salida-dialog.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class SalidaDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  salidaForm: FormGroup;
  loading = false;
  productos: Producto[] = [];
  productosFiltrados: Observable<Producto[]>;
  productoSeleccionado: Producto | null = null;

  /** Motivo `merma` se persiste como tipo de movimiento `merma` (spec 007). */
  motivosSalida = [
    { valor: 'uso_consulta', etiqueta: 'Uso en Consulta' },
    { valor: 'venta_directa', etiqueta: 'Venta Directa' },
    { valor: 'muestra_medica', etiqueta: 'Muestra Médica' },
    { valor: 'merma', etiqueta: 'Merma / Caducado' },
    { valor: 'robo_perdida', etiqueta: 'Robo / Pérdida' },
    { valor: 'otro', etiqueta: 'Otro' }
  ];

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    public dialogRef: MatDialogRef<SalidaDialogComponent>,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService,
    private loadingService: LoadingService
  ) {
    this.salidaForm = this.fb.group({
      producto_busqueda: ['', Validators.required],
      producto_id: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      motivo: ['uso_consulta', Validators.required],
      observaciones: [''],
      registrarEnCaja: [true]
    });

    this.productosFiltrados = this.salidaForm.get('producto_busqueda')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filtrarProductos(value || ''))
    );
  }

  ngOnInit(): void {
    this.cargarProductos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get esMerma(): boolean {
    return this.salidaForm.get('motivo')?.value === 'merma';
  }

  get esVentaDirecta(): boolean {
    return this.salidaForm.get('motivo')?.value === 'venta_directa';
  }

  get montoVentaSugerido(): number {
    if (!this.productoSeleccionado) return 0;
    const qty = Number(this.salidaForm.get('cantidad')?.value) || 0;
    return Math.round((Number(this.productoSeleccionado.precio_venta) || 0) * qty * 100) / 100;
  }

  get costoVentaSugerido(): number {
    if (!this.productoSeleccionado) return 0;
    const qty = Number(this.salidaForm.get('cantidad')?.value) || 0;
    return Math.round((Number(this.productoSeleccionado.precio_compra) || 0) * qty * 100) / 100;
  }

  /** Alias usado en plantilla (compat). */
  get montoSugeridoVenta(): number {
    return this.montoVentaSugerido;
  }

  cargarProductos(): void {
    this.inventarioService.getProductos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (productos) => { this.productos = productos; },
      error: (error) => { this.logger.error('Error al cargar productos:', error); }
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
    this.salidaForm.patchValue({
      producto_id: producto.id
    });

    if (producto.stock_actual <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin Stock',
        text: `El producto "${producto.nombre}" no tiene stock disponible`,
        confirmButtonColor: '#f44336'
      });
    }
  }

  getStockDisponible(): number {
    return this.productoSeleccionado?.stock_actual || 0;
  }

  isStockInsuficiente(): boolean {
    const cantidad = this.salidaForm.get('cantidad')?.value || 0;
    return cantidad > this.getStockDisponible();
  }

  getColorMotivo(): string {
    const motivo = this.salidaForm.get('motivo')?.value;
    const colores: {[key: string]: string} = {
      'uso_consulta': '#2196f3',
      'venta_directa': '#4caf50',
      'muestra_medica': '#ff9800',
      'merma': '#f44336',
      'robo_perdida': '#9c27b0',
      'otro': '#757575'
    };
    return colores[motivo] || '#757575';
  }

  getIconoMotivo(): string {
    const motivo = this.salidaForm.get('motivo')?.value;
    const iconos: {[key: string]: string} = {
      'uso_consulta': 'medical_services',
      'venta_directa': 'shopping_cart',
      'muestra_medica': 'card_giftcard',
      'merma': 'report',
      'robo_perdida': 'warning',
      'otro': 'info'
    };
    return iconos[motivo] || 'info';
  }

  getTextoMotivo(): string {
    const motivo = this.salidaForm.get('motivo')?.value;
    const motivoObj = this.motivosSalida.find(m => m.valor === motivo);
    return motivoObj?.etiqueta || '';
  }

  async guardar(): Promise<void> {
    if (this.salidaForm.invalid || !this.productoSeleccionado) {
      this.salidaForm.markAllAsTouched();
      Swal.fire('Formulario incompleto', 'Completa todos los campos requeridos, incluido el motivo', 'warning');
      return;
    }

    if (this.isStockInsuficiente()) {
      Swal.fire({
        icon: 'error',
        title: 'Stock insuficiente',
        html: `
          Stock disponible: ${this.getStockDisponible()} ${this.productoSeleccionado.unidad_medida}<br>
          Cantidad solicitada: ${this.salidaForm.get('cantidad')?.value}
        `,
        confirmButtonColor: '#f44336'
      });
      return;
    }

    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);

    try {
      const formData = this.salidaForm.value;
      const motivoTexto = this.motivosSalida.find(m => m.valor === formData.motivo)?.etiqueta || formData.motivo;
      const motivoCompleto = `${motivoTexto}. ${formData.observaciones || ''}`.trim();

      let movimientoId: string | undefined;
      if (formData.motivo === 'merma') {
        movimientoId = await this.inventarioService.registrarMerma(
          formData.producto_id,
          formData.cantidad,
          motivoCompleto,
          formData.observaciones
        );
      } else {
        movimientoId = await this.inventarioService.registrarSalida(
          formData.producto_id,
          formData.cantidad,
          motivoCompleto,
          undefined,
          undefined,
          undefined,
          formData.observaciones
        );
      }

      const nuevoStock = this.productoSeleccionado.stock_actual - formData.cantidad;
      const tituloExito = formData.motivo === 'merma' ? 'Merma registrada' : 'Salida registrada';

      this.loadingService.hide();
      this.loading = false;

      if (formData.motivo === 'venta_directa' && formData.registrarEnCaja && movimientoId) {
        await this.abrirCajaTrasVenta(movimientoId, formData.cantidad);
        this.dialogRef.close(true);
        return;
      }

      Swal.fire({
        icon: 'success',
        title: tituloExito,
        html: `
          <strong>${this.productoSeleccionado.nombre}</strong><br>
          Cantidad: ${formData.cantidad} ${this.productoSeleccionado.unidad_medida}<br>
          Stock restante: ${nuevoStock} ${this.productoSeleccionado.unidad_medida}
          ${nuevoStock <= this.productoSeleccionado.stock_minimo ? '<br><span style="color:#f44336;">Stock bajo el mínimo</span>' : ''}
        `,
        timer: 3000,
        showConfirmButton: false
      });

      this.dialogRef.close(true);
    } catch (error) {
      this.logger.error('Error al registrar salida/merma:', error);
      const contexto = this.esMerma ? 'registrar merma' : 'registrar salida';
      Swal.fire('Error', this.errorMessages.getUserMessage(error, contexto), 'error');
      this.loadingService.hide();
      this.loading = false;
    }
  }

  private async abrirCajaTrasVenta(movimientoInventarioId: string, cantidad: number): Promise<void> {
    const producto = this.productoSeleccionado!;
    const costo = this.costoVentaSugerido;
    const ref = this.dialog.open(CajaMovimientoDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '640px',
      disableClose: true,
      data: {
        concepto: `Venta · ${producto.nombre} × ${cantidad}`,
        monto: this.montoVentaSugerido,
        metodoPago: 'efectivo' as const,
        categoria: 'venta_producto' as const,
        costoAsociado: costo > 0 ? costo : undefined,
        movimientoInventarioIds: [movimientoInventarioId],
        notas: producto.iva_aplicable ? 'Producto con IVA aplicable' : ''
      }
    });

    const result = await firstValueFrom(ref.afterClosed());
    const cajaId = result?.movimientoId as string | undefined;
    if (cajaId) {
      try {
        await this.inventarioService.vincularMovimientoACaja(movimientoInventarioId, cajaId);
      } catch (err) {
        this.logger.error('No se pudo vincular salida↔caja:', err);
      }
    } else {
      await Swal.fire({
        icon: 'info',
        title: 'Salida guardada sin cobro en caja',
        text: 'El stock ya se descontó. Puedes registrar el cobro después en Finanzas.',
        confirmButtonText: 'Entendido'
      });
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  hasError(campo: string, error: string): boolean {
    const control = this.salidaForm.get(campo);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }
}
