import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject, firstValueFrom } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ADMIN_DIALOG_CONFIG } from '../core/config/admin-ui.config';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { CajaMovimientoDialogComponent } from '../finanzas/caja-movimiento-dialog.component';
import { ClientePacienteSelection } from '../shared/admin/cliente-paciente-picker.models';
import { ProductoSelection } from '../shared/admin/producto-picker.models';
import { StaffPickerFields } from '../shared/admin/staff-picker.models';
import { Producto } from '../shared/inventario.models';
import { PacientesService } from '../pacientes/pacientes.service';
import { InventarioService } from '../inventario/inventario.service';
import { BaniosService } from '../banios/banios.service';
import { normalizeAlergias } from '../shared/alergias/alergias.util';
import {
  Visita,
  VisitaLinea,
  VisitaLineaCategoria,
  VISITA_ESTADO_LABELS,
  VISITA_LINEA_A_CAJA,
  VISITA_LINEA_CATEGORIA_LABELS
} from './visitas.models';
import { VisitasService } from './visitas.service';
import { hoyLocalIsoDate, nuevaLineaId, recalcularVisita, roundMoney } from './visitas.util';
import {
  BanioPendienteTicket,
  banioYaEnLineas,
  descripcionLineaBanio,
  filtrarBaniosPendientesTicket
} from './pendientes-visita.util';
import {
  CLIENTE_MOSTRADOR_ID,
  CLIENTE_MOSTRADOR_NOMBRE,
  esClienteMostrador,
  esVisitaMostrador
} from './visita-mostrador.util';

interface LineaPreset {
  categoria: VisitaLineaCategoria;
  descripcion: string;
  label: string;
}

@Component({
  selector: 'app-visita-dialog',
  templateUrl: './visita-dialog.component.html',
  styleUrls: ['./visita-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VisitaDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  form: FormGroup;
  lineaForm: FormGroup;
  /** Spec 045 — venta de catálogo dentro del ticket. */
  productoForm: FormGroup;
  loading = false;
  esEdicion = false;
  soloLectura = false;
  visitaId: string | null = null;
  lineas: VisitaLinea[] = [];
  pagado = 0;
  estadoLabel = VISITA_ESTADO_LABELS.abierta;
  alergiasPaciente: string[] = [];
  pendientesBanio: BanioPendienteTicket[] = [];
  mostrandoProducto = false;
  /** Spec 046 — petshop sin cliente registrado. */
  modoMostrador = false;
  productoSel: Producto | null = null;
  readonly staffPickerFields: StaffPickerFields = {
    uidField: 'atendidoPorUid',
    nombreField: 'atendidoPorNombre'
  };

  readonly categoriaLabels = VISITA_LINEA_CATEGORIA_LABELS;
  readonly estadoLabels = VISITA_ESTADO_LABELS;
  readonly categorias: VisitaLineaCategoria[] = [
    'consulta',
    'vacuna',
    'banio',
    'corte',
    'venta_producto',
    'pension',
    'cirugia',
    'otro'
  ];

  readonly lineaPresets: LineaPreset[] = [
    { categoria: 'consulta', descripcion: 'Consulta general', label: 'Consulta' },
    { categoria: 'banio', descripcion: 'Baño / peluquería', label: 'Baño (texto)' },
    { categoria: 'venta_producto', descripcion: 'Producto', label: 'Producto' },
    { categoria: 'vacuna', descripcion: 'Vacuna', label: 'Vacuna' }
  ];

  get totales() {
    return recalcularVisita({ lineas: this.lineas, pagado: this.pagado });
  }

  get cobrarLabel(): string {
    const t = this.totales;
    if (t.saldo <= 0) return 'Cobrar';
    if (t.pagado > 0) {
      return `Cobrar resto ${this.formatMoney(t.saldo)}`;
    }
    return `Cobrar ${this.formatMoney(t.saldo)}`;
  }

  /** Spec 046 — por qué Guardar/Cobrar están bloqueados. */
  get accionBloqueoHint(): string {
    if (this.soloLectura) return '';
    if (!this.modoMostrador && !String(this.form.get('cliente_id')?.value || '').trim()) {
      return 'Elige el dueño, o usa «Venta de mostrador» si es compra sin cliente.';
    }
    if (this.form.invalid && !this.modoMostrador) {
      return 'Completa la fecha y el dueño para continuar.';
    }
    if (!String(this.form.get('fecha')?.value || '').trim()) {
      return 'Indica la fecha de la cuenta.';
    }
    if (!this.lineas.length) {
      return 'Agrega al menos una línea (baño pendiente, producto o consulta) antes de cobrar.';
    }
    if (this.totales.saldo <= 0) {
      return 'No hay saldo pendiente. Puedes guardar o cerrar.';
    }
    return '';
  }

  get guardarBloqueoHint(): string {
    if (this.soloLectura) return 'Ticket cerrado o cancelado';
    if (!this.modoMostrador && !String(this.form.get('cliente_id')?.value || '').trim()) {
      return 'Elige el dueño o activa venta de mostrador';
    }
    if (!this.modoMostrador && this.form.invalid) return 'Completa los datos requeridos';
    if (!String(this.form.get('fecha')?.value || '').trim()) return 'Indica la fecha';
    return 'Guardar cuenta del día';
  }

  get cobrarBloqueoHint(): string {
    if (this.soloLectura) return 'Ticket cerrado o cancelado';
    if (!this.modoMostrador && !String(this.form.get('cliente_id')?.value || '').trim()) {
      return 'Elige el dueño o activa venta de mostrador';
    }
    if (!this.modoMostrador && this.form.invalid) return 'Completa los datos requeridos';
    if (!this.lineas.length) return 'Agrega líneas al ticket';
    if (this.totales.saldo <= 0) return 'No hay saldo por cobrar';
    return 'Abrir cobro en caja';
  }

  /** Spec 048 — productos en ticket descontarán stock al persistir. */
  get inventarioHint(): string {
    if (this.soloLectura) return '';
    if (this.mostrandoProducto) {
      return 'Al guardar o cobrar se registrará la salida de inventario por la cantidad vendida.';
    }
    const productos = this.lineas.filter(l => l.categoria === 'venta_producto');
    if (!productos.length) return '';
    const pendientes = productos.filter(l => !l.movimientoInventarioId);
    if (pendientes.length) {
      return `${pendientes.length} producto(s) en el ticket: al guardar o cobrar se descontará del stock en Inventario.`;
    }
    return 'Los productos de este ticket ya tienen salida registrada en inventario.';
  }

  esLineaProducto(linea: VisitaLinea): boolean {
    return linea.categoria === 'venta_producto';
  }

  origenLineaHint(linea: VisitaLinea): string {
    if (linea.movimientoInventarioId) {
      return 'Origen: salida de inventario (stock ya vinculado).';
    }
    if (linea.banioId) return 'Origen: servicio de baño / peluquería.';
    if (linea.citaId) return 'Origen: cita de consulta.';
    if (linea.vacunaId) return 'Origen: registro de vacuna.';
    if (linea.pensionId) return 'Origen: estancia de pensión.';
    if (linea.historialId) return 'Origen: historial clínico.';
    if (linea.productoId && !linea.movimientoInventarioId) {
      return 'Producto agregado manualmente — al guardar/cobrar se descontará stock.';
    }
    return '';
  }

  get puedeGuardar(): boolean {
    if (this.loading || this.soloLectura) return false;
    if (!String(this.form.get('fecha')?.value || '').trim()) return false;
    if (this.modoMostrador) return true;
    return this.form.valid;
  }

  get puedeCobrar(): boolean {
    return this.puedeGuardar && this.totales.saldo > 0;
  }

  constructor(
    private fb: FormBuilder,
    private visitasService: VisitasService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<VisitaDialogComponent>,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    private pacientesService: PacientesService,
    private baniosService: BaniosService,
    private inventarioService: InventarioService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      visita?: Visita;
      cliente_id?: string;
      cliente?: string;
      paciente_id?: string;
      paciente?: string;
      fecha?: string;
    }
  ) {
    this.form = this.fb.group({
      paciente: [''],
      paciente_id: [''],
      cliente: [''],
      cliente_id: ['', Validators.required],
      fecha: [hoyLocalIsoDate(), Validators.required],
      notas: [''],
      atendidoPorUid: [''],
      atendidoPorNombre: ['']
    });
    this.lineaForm = this.fb.group({
      descripcion: ['', [Validators.required, Validators.minLength(2)]],
      monto: [null, [Validators.required, Validators.min(0.01)]],
      categoria: ['consulta' as VisitaLineaCategoria, Validators.required]
    });
    this.productoForm = this.fb.group({
      producto_id: ['', Validators.required],
      producto_nombre: [''],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    if (this.data?.visita?.id) {
      this.esEdicion = true;
      this.visitaId = this.data.visita.id;
      const v = this.data.visita;
      this.lineas = [...(v.lineas || [])];
      this.pagado = Number(v.pagado) || 0;
      this.estadoLabel = VISITA_ESTADO_LABELS[v.estado] || v.estado;
      this.form.patchValue({
        cliente_id: v.cliente_id,
        cliente: v.cliente || '',
        paciente_id: v.paciente_id || '',
        paciente: v.paciente || '',
        fecha: v.fecha,
        notas: v.notas || '',
        atendidoPorUid: v.atendidoPorUid || '',
        atendidoPorNombre: v.atendidoPorNombre || ''
      });
      if (esVisitaMostrador(v)) {
        this.modoMostrador = true;
        this.form.get('cliente_id')?.clearValidators();
        this.form.get('cliente_id')?.updateValueAndValidity({ emitEvent: false });
      }
      if (v.estado === 'cerrada' || v.estado === 'cancelada') {
        this.soloLectura = true;
        this.form.disable();
        this.lineaForm.disable();
        this.productoForm.disable();
      }
      if (v.paciente_id) {
        void this.cargarAlergias(v.paciente_id);
      }
    } else {
      this.form.patchValue({
        cliente_id: this.data?.cliente_id || '',
        cliente: this.data?.cliente || '',
        paciente_id: this.data?.paciente_id || '',
        paciente: this.data?.paciente || '',
        fecha: this.data?.fecha || hoyLocalIsoDate()
      });
      if (this.data?.paciente_id) {
        void this.cargarAlergias(this.data.paciente_id);
      }
    }

    this.form.get('cliente_id')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => void this.cargarPendientes());
    this.form.get('fecha')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => void this.cargarPendientes());
    this.form.get('paciente_id')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => void this.cargarPendientes());
    void this.cargarPendientes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClientePacienteSelected(sel: ClientePacienteSelection): void {
    if (sel.cliente_id && !esClienteMostrador(sel.cliente_id)) {
      this.modoMostrador = false;
      this.form.get('cliente_id')?.setValidators([Validators.required]);
      this.form.get('cliente_id')?.updateValueAndValidity({ emitEvent: false });
    }
    this.form.patchValue({
      cliente_id: sel.cliente_id || '',
      cliente: sel.cliente || '',
      paciente_id: sel.paciente_id || '',
      paciente: sel.paciente || ''
    });
    const fromSel = normalizeAlergias(sel.pacienteData);
    if (fromSel.length) {
      this.alergiasPaciente = fromSel;
    } else if (sel.paciente_id) {
      void this.cargarAlergias(sel.paciente_id);
    } else {
      this.alergiasPaciente = [];
    }
    void this.cargarPendientes();
  }

  /** Spec 046 — petshop sin dueño registrado. */
  activarVentaMostrador(): void {
    if (this.soloLectura) return;
    this.modoMostrador = true;
    this.form.patchValue({
      cliente_id: CLIENTE_MOSTRADOR_ID,
      cliente: CLIENTE_MOSTRADOR_NOMBRE,
      paciente_id: '',
      paciente: ''
    });
    this.form.get('cliente_id')?.clearValidators();
    this.form.get('cliente_id')?.updateValueAndValidity({ emitEvent: false });
    this.alergiasPaciente = [];
    this.pendientesBanio = [];
  }

  /** Sale del modo mostrador para vincular un cliente real. */
  vincularClienteReal(): void {
    if (this.soloLectura) return;
    this.modoMostrador = false;
    this.form.patchValue({
      cliente_id: '',
      cliente: '',
      paciente_id: '',
      paciente: ''
    });
    this.form.get('cliente_id')?.setValidators([Validators.required]);
    this.form.get('cliente_id')?.updateValueAndValidity({ emitEvent: false });
  }

  private async cargarAlergias(pacienteId: string): Promise<void> {
    try {
      const p = await firstValueFrom(this.pacientesService.getPaciente(pacienteId).pipe(take(1)));
      this.alergiasPaciente = normalizeAlergias(p);
    } catch {
      this.alergiasPaciente = [];
    }
  }

  private async cargarPendientes(): Promise<void> {
    if (this.soloLectura) {
      this.pendientesBanio = [];
      return;
    }
    const clienteId = String(this.form.get('cliente_id')?.value || '').trim();
    const fecha = String(this.form.get('fecha')?.value || '').trim().slice(0, 10);
    if (!clienteId || !fecha) {
      this.pendientesBanio = [];
      return;
    }
    try {
      const banios = await firstValueFrom(this.baniosService.getBanios().pipe(take(1)));
      this.pendientesBanio = filtrarBaniosPendientesTicket(banios || [], {
        clienteId,
        fecha,
        pacienteId: String(this.form.get('paciente_id')?.value || '').trim() || undefined
      }).filter(p => !banioYaEnLineas(this.lineas, p.id));
    } catch {
      this.pendientesBanio = [];
    }
  }

  incluirBanioPendiente(p: BanioPendienteTicket): void {
    if (this.soloLectura || banioYaEnLineas(this.lineas, p.id)) return;
    const monto = Number(p.precio_total) || 0;
    if (!(monto > 0)) {
      void Swal.fire({
        icon: 'question',
        title: 'Monto del baño',
        input: 'number',
        inputLabel: '¿Cuánto se cobrará en el ticket?',
        inputAttributes: { min: '0.01', step: '0.01' },
        showCancelButton: true,
        confirmButtonText: 'Incluir',
        cancelButtonText: 'Cancelar',
        inputValidator: value => (!(Number(value) > 0) ? 'Ingresa un monto mayor a 0' : null)
      }).then(ask => {
        if (!ask.isConfirmed) return;
        this.pushLineaBanio(p, Number(ask.value));
      });
      return;
    }
    this.pushLineaBanio(p, monto);
  }

  private pushLineaBanio(p: BanioPendienteTicket, monto: number): void {
    this.lineas = [
      ...this.lineas,
      {
        id: nuevaLineaId(),
        descripcion: descripcionLineaBanio(p),
        monto: roundMoney(monto),
        categoria: p.categoria,
        banioId: p.id
      }
    ];
    this.pendientesBanio = this.pendientesBanio.filter(x => x.id !== p.id);
  }

  aplicarPreset(preset: LineaPreset): void {
    if (this.soloLectura) return;
    if (preset.categoria === 'venta_producto') {
      this.mostrandoProducto = true;
      this.productoForm.reset({ producto_id: '', producto_nombre: '', cantidad: 1 });
      this.productoSel = null;
      return;
    }
    this.mostrandoProducto = false;
    this.lineaForm.patchValue({
      categoria: preset.categoria,
      descripcion: preset.descripcion
    });
    this.lineaForm.get('monto')?.markAsUntouched();
  }

  onProductoSeleccionado(sel: ProductoSelection): void {
    this.productoSel = sel.producto;
  }

  agregarProductoAlTicket(): void {
    if (this.soloLectura) return;
    if (this.productoForm.invalid || !this.productoSel?.id) {
      this.productoForm.markAllAsTouched();
      Swal.fire('Producto', 'Elige un producto del catálogo y la cantidad.', 'warning');
      return;
    }
    const qty = Math.max(1, Number(this.productoForm.get('cantidad')?.value) || 1);
    const stock = Number(this.productoSel.stock_actual) || 0;
    if (stock < qty) {
      Swal.fire(
        'Sin stock suficiente',
        `"${this.productoSel.nombre}" tiene ${stock} ${this.productoSel.unidad_medida}. No se puede agregar ${qty}.`,
        'warning'
      );
      return;
    }
    const unit = Number(this.productoSel.precio_venta) || 0;
    if (!(unit > 0)) {
      Swal.fire('Sin precio', 'Este producto no tiene precio de venta. Edítalo en Inventario.', 'warning');
      return;
    }
    this.lineas = [
      ...this.lineas,
      {
        id: nuevaLineaId(),
        descripcion: `${this.productoSel.nombre} × ${qty}`,
        monto: roundMoney(unit * qty),
        categoria: 'venta_producto',
        productoId: this.productoSel.id,
        cantidad: qty
      }
    ];
    this.mostrandoProducto = false;
    this.productoSel = null;
    this.productoForm.reset({ producto_id: '', producto_nombre: '', cantidad: 1 });
  }

  cancelarProducto(): void {
    this.mostrandoProducto = false;
    this.productoSel = null;
    this.productoForm.reset({ producto_id: '', producto_nombre: '', cantidad: 1 });
  }

  agregarLineaLocal(): void {
    if (this.soloLectura) return;
    if (this.lineaForm.invalid) {
      this.lineaForm.markAllAsTouched();
      return;
    }
    const v = this.lineaForm.getRawValue();
    this.lineas = [
      ...this.lineas,
      {
        id: nuevaLineaId(),
        descripcion: String(v.descripcion).trim(),
        monto: roundMoney(v.monto),
        categoria: v.categoria
      }
    ];
    this.lineaForm.reset({ descripcion: '', monto: null, categoria: 'consulta' });
  }

  quitarLinea(id: string): void {
    this.lineas = this.lineas.filter(l => l.id !== id);
    void this.cargarPendientes();
  }

  formatMoney(n: number): string {
    return `$${(Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  private async persistir(): Promise<string> {
    if (this.soloLectura) {
      throw new Error('El ticket está cerrado o cancelado.');
    }
    const raw = this.form.getRawValue();
    const esMostrador = this.modoMostrador || esClienteMostrador(raw.cliente_id);
    const clienteId = esMostrador
      ? CLIENTE_MOSTRADOR_ID
      : String(raw.cliente_id || '').trim();
    const clienteNombre = esMostrador
      ? CLIENTE_MOSTRADOR_NOMBRE
      : String(raw.cliente || '').trim();

    if (!esMostrador && !clienteId) {
      throw new Error('Elige el dueño, o activa «Venta de mostrador» para vender sin cliente.');
    }
    if (!String(raw.fecha || '').trim()) {
      throw new Error('La fecha es obligatoria.');
    }

    if (!this.visitaId && !esMostrador) {
      const existente = await this.visitasService.buscarVisitaAbiertaDelDia(
        clienteId,
        raw.fecha || hoyLocalIsoDate()
      );
      if (existente?.id) {
        const conf = await Swal.fire({
          icon: 'question',
          title: 'Ya hay un ticket abierto',
          html: `Cliente <strong>${existente.cliente || clienteNombre}</strong> · ${existente.fecha}<br/>Saldo ${this.formatMoney(existente.saldo)}. ¿Usar ese ticket en lugar de crear otro?`,
          showCancelButton: true,
          confirmButtonText: 'Usar ticket existente',
          cancelButtonText: 'Crear otro'
        });
        if (conf.isConfirmed) {
          this.visitaId = existente.id;
          this.esEdicion = true;
          this.lineas = [...(existente.lineas || []), ...this.lineas];
          this.pagado = Number(existente.pagado) || 0;
          this.estadoLabel = VISITA_ESTADO_LABELS[existente.estado] || existente.estado;
        }
      }
    }

    this.lineas = await this.asegurarSalidasProducto(this.lineas, String(raw.paciente_id || ''));

    if (this.visitaId) {
      await this.visitasService.actualizarVisita(this.visitaId, {
        cliente_id: clienteId,
        cliente: clienteNombre,
        paciente_id: esMostrador ? undefined : raw.paciente_id || undefined,
        paciente: esMostrador ? '' : raw.paciente || '',
        fecha: raw.fecha,
        notas: raw.notas || '',
        atendidoPorUid: raw.atendidoPorUid || undefined,
        atendidoPorNombre: raw.atendidoPorNombre || undefined,
        esMostrador: esMostrador || undefined,
        lineas: this.lineas
      });
      return this.visitaId;
    }
    const id = await this.visitasService.crearVisita({
      cliente_id: clienteId,
      cliente: clienteNombre,
      paciente_id: esMostrador ? undefined : raw.paciente_id || undefined,
      paciente: esMostrador ? '' : raw.paciente || '',
      fecha: raw.fecha,
      notas: raw.notas || '',
      atendidoPorUid: raw.atendidoPorUid || undefined,
      atendidoPorNombre: raw.atendidoPorNombre || undefined,
      esMostrador: esMostrador || undefined,
      lineas: this.lineas
    });
    this.visitaId = id;
    this.esEdicion = true;
    for (const l of this.lineas) {
      if (l.movimientoInventarioId) {
        await this.visitasService.vincularOrigenesDesdeLineas(id, [l]);
      }
    }
    return id;
  }

  private async asegurarSalidasProducto(lineas: VisitaLinea[], pacienteId: string): Promise<VisitaLinea[]> {
    const out: VisitaLinea[] = [];
    for (const linea of lineas) {
      if (linea.categoria === 'venta_producto' && linea.productoId && !linea.movimientoInventarioId) {
        const qty = Math.max(1, Number(linea.cantidad) || 1);
        const movId = await this.inventarioService.registrarSalida(
          linea.productoId,
          qty,
          'venta_directa',
          pacienteId || undefined,
          undefined,
          undefined,
          `Ticket visita · ${linea.descripcion}`,
          this.visitaId || undefined
        );
        out.push({ ...linea, cantidad: qty, movimientoInventarioId: movId });
      } else {
        out.push(linea);
      }
    }
    return out;
  }

  async guardar(): Promise<void> {
    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const id = await this.persistir();
      this.dialogRef.close({ visitaId: id, saved: true });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar visita'), 'error');
    } finally {
      this.loading = false;
      this.loadingService.hide();
    }
  }

  async cobrar(): Promise<void> {
    if (this.soloLectura) return;
    const t = this.totales;
    if (!this.lineas.length) {
      Swal.fire('Sin líneas', 'Agrega al menos un servicio o producto al ticket.', 'warning');
      return;
    }
    if (t.saldo <= 0) {
      Swal.fire('Sin saldo', 'No hay monto pendiente por cobrar.', 'info');
      return;
    }

    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    let visitaId: string;
    try {
      visitaId = await this.persistir();
    } catch (error) {
      this.loading = false;
      this.loadingService.hide();
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar visita'), 'error');
      return;
    }
    this.loading = false;
    this.loadingService.hide();

    const cat = this.lineas.length === 1 ? this.lineas[0].categoria : 'otro';
    const raw = this.form.getRawValue();
    const saldoAntes = t.saldo;
    const ref = this.dialog.open(CajaMovimientoDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '640px',
      disableClose: true,
      data: {
        tipo: 'ingreso' as const,
        fechaDefault: raw.fecha,
        clienteId:
          this.modoMostrador || esClienteMostrador(raw.cliente_id) ? undefined : raw.cliente_id,
        visitaId,
        concepto: `Visita ${raw.fecha} · ${raw.cliente || (this.modoMostrador ? 'Mostrador' : raw.cliente_id)}`,
        monto: t.saldo,
        metodoPago: 'efectivo' as const,
        categoria: VISITA_LINEA_A_CAJA[cat] || 'otro'
      }
    });

    ref
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (result) => {
        const movId = result?.movimientoId as string | undefined;
        if (!movId) return;
        const montoPago = roundMoney(Number(result?.monto) || t.saldo);
        try {
          this.loadingService.show(LOADING_MESSAGES.saving);
          const visita = await this.visitasService.getVisita(visitaId);
          if (!visita) throw new Error('Visita no encontrada');
          if (montoPago > roundMoney(visita.saldo) + 0.001) {
            throw new Error('El monto no puede superar el saldo pendiente');
          }
          const ids = [...(visita.cajaMovimientoIds || [])];
          if (!ids.includes(movId)) ids.push(movId);
          await this.visitasService.actualizarVisita(visitaId, {
            pagado: roundMoney((visita.pagado || 0) + montoPago),
            cajaMovimientoIds: ids
          });
          const esParcial = montoPago < saldoAntes - 0.001;
          Swal.fire({
            icon: 'success',
            title: esParcial ? 'Pago parcial registrado' : 'Visita cobrada al 100%',
            text: esParcial
              ? `Queda saldo pendiente. Puedes cobrar el resto después.`
              : 'Ticket cerrado. Saldo en $0.',
            timer: 2200,
            showConfirmButton: false
          });
          this.dialogRef.close({ visitaId, cobrado: true, parcial: esParcial });
        } catch (error) {
          Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cobrar visita'), 'error');
        } finally {
          this.loadingService.hide();
        }
      });
  }

  imprimir(): void {
    window.print();
  }
}
