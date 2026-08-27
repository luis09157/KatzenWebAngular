import { Component, Inject, OnDestroy, OnInit, Optional, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { Producto } from '../../shared/inventario.models';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { LoggerService } from '../../core/logger.service';
import { LoadingService, LOADING_MESSAGES } from '../../core/loading.service';
import { ADMIN_DIALOG_CONFIG, ADMIN_DIALOG_FORM } from '../../core/config/admin-ui.config';
import { CajaMovimientoDialogComponent } from '../../finanzas/caja-movimiento-dialog.component';
import { VisitasService } from '../../visitas/visitas.service';
import { VisitaDialogComponent } from '../../visitas/visita-dialog.component';
import { promptMontoVisita } from '../../visitas/visita-atalho.util';
import { ClientesService } from '../../clientes/clientes.service';
import { Cliente } from '../../core/models';
import { precioConIva, resolverTasaIva } from '../../core/utils/precio-margen.util';
import { PacientesService } from '../../pacientes/pacientes.service';
import { normalizeAlergias } from '../../shared/alergias/alergias.util';

/** Prefill opcional al abrir desde historial / pensión / vacunas (spec 022). */
export interface SalidaDialogData {
  historialId?: string;
  pacienteId?: string;
  pacienteNombre?: string;
  motivoDefault?: string;
  /** Oculta checkbox venta→caja (consumo clínico). */
  hideRegistrarEnCaja?: boolean;
  /** Prefill producto (ej. comida pensión). */
  productoId?: string;
  cantidad?: number;
  observaciones?: string;
  titulo?: string;
  subtitulo?: string;
  /** Spec 042 — cliente para ticket (opcional si hay paciente). */
  cliente_id?: string;
  clienteNombre?: string;
}

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
  clientesFiltrados: Observable<Cliente[]>;
  productoSeleccionado: Producto | null = null;
  clientes: Cliente[] = [];
  /** Cliente resuelto (prefill o paciente). */
  clienteIdResuelto = '';
  clienteNombreResuelto = '';
  /** Spec 034 — alerta si hay vínculo paciente. */
  alergiasPaciente: string[] = [];

  readonly contextoHistorial: boolean;
  readonly hideRegistrarEnCaja: boolean;
  readonly tituloDialog: string;
  readonly subtituloDialog: string;

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
    private loadingService: LoadingService,
    private pacientesService: PacientesService,
    private clientesService: ClientesService,
    private visitasService: VisitasService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: SalidaDialogData | null
  ) {
    const d = data || {};
    this.contextoHistorial = !!d.historialId;
    this.hideRegistrarEnCaja = !!d.hideRegistrarEnCaja || this.contextoHistorial;
    this.tituloDialog = d.titulo || '';
    this.subtituloDialog = d.subtitulo || '';

    this.salidaForm = this.fb.group({
      producto_busqueda: ['', Validators.required],
      producto_id: ['', Validators.required],
      cantidad: [d.cantidad && d.cantidad > 0 ? d.cantidad : 1, [Validators.required, Validators.min(1)]],
      motivo: [d.motivoDefault || 'uso_consulta', Validators.required],
      observaciones: [d.observaciones || ''],
      destinoCobro: ['caja' as 'caja' | 'visita'],
      cliente_busqueda: [''],
      cliente_id: [d.cliente_id || ''],
      cliente_nombre: [d.clienteNombre || '']
    });

    this.productosFiltrados = this.salidaForm.get('producto_busqueda')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filtrarProductos(value || ''))
    );
    this.clientesFiltrados = this.salidaForm.get('cliente_busqueda')!.valueChanges.pipe(
      startWith(''),
      map((value) => {
        if (typeof value === 'string') return this._filtrarClientes(value);
        if (value && typeof value === 'object') {
          return this._filtrarClientes(this.nombreCliente(value as Cliente));
        }
        return this._filtrarClientes('');
      })
    );
  }

  get requiereSelectorCliente(): boolean {
    return this.esVentaDirecta && this.salidaForm.get('destinoCobro')?.value === 'visita' && !this.clienteIdResuelto;
  }

  get destinoEsVisita(): boolean {
    return this.esVentaDirecta && this.salidaForm.get('destinoCobro')?.value === 'visita';
  }

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarClientes();
    if (this.data?.cliente_id) {
      this.clienteIdResuelto = this.data.cliente_id;
      this.clienteNombreResuelto = this.data.clienteNombre || '';
      this.salidaForm.patchValue({
        cliente_id: this.clienteIdResuelto,
        cliente_nombre: this.clienteNombreResuelto,
        cliente_busqueda: this.clienteNombreResuelto
      });
    }
    const pid = this.data?.pacienteId;
    if (pid) {
      this.pacientesService
        .getPaciente(pid)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (p) => {
            this.alergiasPaciente = normalizeAlergias(p);
            const cid = (p as any)?.cliente_id || (p as any)?.idCliente || '';
            if (cid && !this.clienteIdResuelto) {
              this.clienteIdResuelto = cid;
              this.clienteNombreResuelto =
                (p as any)?.nombreCliente || (p as any)?.cliente || '';
              this.salidaForm.patchValue({
                cliente_id: cid,
                cliente_nombre: this.clienteNombreResuelto
              });
            }
          },
          error: () => {
            this.alergiasPaciente = [];
          }
        });
    }
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

  /** Preview con IVA si el producto lo marca (control interno). */
  get montoVentaConIvaSugerido(): number {
    if (!this.productoSeleccionado) return 0;
    const qty = Number(this.salidaForm.get('cantidad')?.value) || 0;
    const netoUnit = Number(this.productoSeleccionado.precio_venta) || 0;
    const aplica = !!this.productoSeleccionado.iva_aplicable;
    const tasa = this.productoSeleccionado.tasa_iva;
    const unit = precioConIva(netoUnit, aplica, resolverTasaIva(aplica, tasa));
    return Math.round(unit * qty * 100) / 100;
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

  get tituloMostrado(): string {
    if (this.tituloDialog) return this.tituloDialog;
    return this.esMerma ? 'Registrar merma' : 'Registrar salida de productos';
  }

  get subtituloMostrado(): string {
    if (this.subtituloDialog) return this.subtituloDialog;
    if (this.contextoHistorial) {
      const nombre = this.data?.pacienteNombre || 'paciente';
      return `Consumo clínico ligado al historial · ${nombre}`;
    }
    return this.esMerma
      ? 'Registra pérdida o caducidad. No se permite stock negativo y el motivo es obligatorio.'
      : 'Retira unidades del inventario con motivo registrado.';
  }

  cargarProductos(): void {
    this.inventarioService.getProductos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (productos) => {
        this.productos = productos;
        const prefId = this.data?.productoId;
        if (prefId) {
          const p = productos.find((x) => x.id === prefId);
          if (p) {
            this.onProductoSeleccionado(p);
            this.salidaForm.patchValue({ producto_busqueda: p });
          }
        }
      },
      error: (error) => { this.logger.error('Error al cargar productos:', error); }
    });
  }

  cargarClientes(): void {
    this.clientesService
      .getClientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clientes) => {
          this.clientes = (clientes || []).filter((c) => c.activo !== false);
        },
        error: (err) => this.logger.error('Error al cargar clientes:', err)
      });
  }

  private _filtrarClientes(valor: string): Cliente[] {
    const filtro = valor.toLowerCase();
    if (!filtro) return this.clientes.slice(0, 40);
    return this.clientes
      .filter((c) => {
        const nombre = this.nombreCliente(c).toLowerCase();
        const tel = String(c.telefono || '').toLowerCase();
        return nombre.includes(filtro) || tel.includes(filtro);
      })
      .slice(0, 40);
  }

  displayCliente(cliente: Cliente | null): string {
    if (!cliente) return '';
    return this.nombreCliente(cliente);
  }

  onClienteSeleccionado(cliente: Cliente): void {
    if (!cliente?.id) return;
    this.clienteIdResuelto = cliente.id;
    this.clienteNombreResuelto = this.nombreCliente(cliente);
    this.salidaForm.patchValue({
      cliente_id: cliente.id,
      cliente_nombre: this.clienteNombreResuelto
    });
  }

  nombreCliente(cliente: Cliente): string {
    return String(cliente.nombre || (cliente as Record<string, unknown>)['nombre_completo'] || '');
  }

  private resolverClienteId(formData: Record<string, unknown>): string {
    return (
      this.clienteIdResuelto ||
      String(formData['cliente_id'] || '').trim()
    );
  }

  montoVentaFinal(): number {
    if (!this.productoSeleccionado) return 0;
    if (this.productoSeleccionado.iva_aplicable) {
      return this.montoVentaConIvaSugerido;
    }
    return this.montoVentaSugerido;
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

  /** SC-014: producto controlado / con receta exige historial clínico. */
  private requiereHistorialClinico(producto: Producto): boolean {
    return !!(producto.controlado || producto.requiere_receta);
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

    if (this.requiereHistorialClinico(this.productoSeleccionado) && !this.data?.historialId) {
      Swal.fire({
        icon: 'warning',
        title: 'Historial clínico requerido',
        text: 'Este producto es controlado o requiere receta. Ábrelo desde un historial (Consumir inventario).',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const formData = this.salidaForm.value;
    if (
      formData.motivo === 'venta_directa' &&
      formData.destinoCobro === 'visita' &&
      !this.hideRegistrarEnCaja
    ) {
      const clienteId = this.resolverClienteId(formData);
      if (!clienteId) {
        Swal.fire('Cliente requerido', 'Selecciona el cliente dueño del ticket.', 'warning');
        return;
      }
    }

    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);

    try {
      const motivoTexto = this.motivosSalida.find(m => m.valor === formData.motivo)?.etiqueta || formData.motivo;
      const motivoCompleto = `${motivoTexto}. ${formData.observaciones || ''}`.trim();
      const pacienteId = this.data?.pacienteId;
      const historialId = this.data?.historialId;

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
          pacienteId,
          historialId,
          undefined,
          formData.observaciones
        );
      }

      const nuevoStock = this.productoSeleccionado.stock_actual - formData.cantidad;
      const tituloExito = formData.motivo === 'merma' ? 'Merma registrada' : 'Salida registrada';

      this.loadingService.hide();
      this.loading = false;

      if (
        formData.motivo === 'venta_directa' &&
        formData.destinoCobro === 'caja' &&
        !this.hideRegistrarEnCaja &&
        movimientoId
      ) {
        await this.abrirCajaTrasVenta(movimientoId, formData.cantidad);
        this.dialogRef.close({ ok: true, movimientoId });
        return;
      }

      if (
        formData.motivo === 'venta_directa' &&
        formData.destinoCobro === 'visita' &&
        !this.hideRegistrarEnCaja &&
        movimientoId
      ) {
        await this.abrirVisitaTrasVenta(movimientoId, formData.cantidad, formData);
        this.dialogRef.close({ ok: true, movimientoId });
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

      this.dialogRef.close({ ok: true, movimientoId });
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

  /** Spec 042 — venta directa → línea en ticket de visita del día. */
  private async abrirVisitaTrasVenta(
    movimientoInventarioId: string,
    cantidad: number,
    formData: Record<string, unknown>
  ): Promise<void> {
    const producto = this.productoSeleccionado!;
    const clienteId = this.resolverClienteId(formData);
    const clienteNombre =
      this.clienteNombreResuelto ||
      String(formData['cliente_nombre'] || '').trim();
    const pacienteId = this.data?.pacienteId;
    const pacienteNombre = this.data?.pacienteNombre;

    let monto = this.montoVentaFinal();
    monto =
      (await promptMontoVisita(
        'Monto de la venta',
        `¿Cuánto se cobrará por ${producto.nombre} × ${cantidad}?`,
        monto
      )) ?? 0;
    if (!(monto > 0)) {
      await Swal.fire({
        icon: 'info',
        title: 'Salida registrada sin ticket',
        text: 'El stock se descontó. Agrega la venta al ticket manualmente desde Visitas.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const { visitaId } = await this.visitasService.agregarServicioAVisita({
        cliente_id: clienteId,
        cliente: clienteNombre,
        paciente_id: pacienteId,
        paciente: pacienteNombre,
        descripcion: `Venta · ${producto.nombre} × ${cantidad}`,
        monto,
        categoria: 'venta_producto',
        productoId: producto.id,
        movimientoInventarioId
      });
      const visita = await this.visitasService.getVisita(visitaId);
      this.dialog.open(VisitaDialogComponent, {
        ...ADMIN_DIALOG_FORM,
        data: {
          visita: visita || undefined,
          cliente_id: clienteId,
          cliente: clienteNombre
        }
      });
      await Swal.fire({
        icon: 'success',
        title: 'Agregado al ticket',
        timer: 1400,
        showConfirmButton: false
      });
    } catch (err) {
      this.logger.error('No se pudo agregar venta→visita:', err);
      await Swal.fire(
        'Error',
        this.errorMessages.getUserMessage(err, 'agregar venta a visita'),
        'error'
      );
    } finally {
      this.loadingService.hide();
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
