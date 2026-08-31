import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, firstValueFrom } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { filtrarProductos, productoSinStock, productoStockBajo } from '../core/utils/producto-search.util';
import { CajaService } from '../finanzas/caja.service';
import { CajaMetodoPago } from '../finanzas/caja.models';
import { DefaultsBanioService } from '../finanzas/defaults-banio.service';
import { emptyDefaultsBanio, DefaultsBanioPorTamano, TamanoPerroBanio } from '../finanzas/defaults-banio.models';
import { PlantillaCostoService } from '../finanzas/plantilla-costo.service';
import { PlantillaCosto } from '../finanzas/plantilla-costo.models';
import { ProductoPeluqueria, TipoServicio } from '../shared/banio.model';
import { ClientePacienteSelection } from '../shared/admin/cliente-paciente-picker.models';
import { StaffPickerFields } from '../shared/admin/staff-picker.models';
import { environment } from '../../environments/environment';
import { MOCK_PRODUCTOS_POS } from './pos-catalogo-demo.data';
import { Producto } from '../shared/inventario.models';
import { PacientesService } from '../pacientes/pacientes.service';
import { InventarioService } from '../inventario/inventario.service';
import { BaniosService } from '../banios/banios.service';
import { ServicioClinica } from '../servicios-clinica/servicios-clinica.models';
import { ServiciosClinicaService } from '../servicios-clinica/servicios-clinica.service';
import {
  COPY_BANIO_EN_FINANZAS,
  COPY_PRECIO_SERVICIO,
  categoriaLineaDesdeTipoServicio,
  esDecisionPrecioServicio,
  hayServicioConsultaConPrecio,
  iconoTipoServicioClinica,
  labelTipoServicioClinica,
  resolverLineaServicioClinica,
  serviciosParaRielConsulta
} from '../servicios-clinica/servicios-clinica.util';
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
import {
  ajustarCantidadLinea,
  cantidadLinea,
  contarArticulos,
  hoyLocalIsoDate,
  nuevaLineaId,
  precioUnitarioLinea,
  recalcularVisita,
  roundMoney
} from './visitas.util';
import { snapshotEconomiaLinea } from '../core/utils/precio-margen.util';
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
import { promptMontoVisita } from './visita-atalho.util';
import {
  PosRiel,
  filtrarProductosPorRiel,
  mensajeRielBloqueado,
  puedeUsarRiel
} from './pos-rieles.util';
import {
  COPY_BANIO_AJUSTABLE,
  COPY_PRECIO_INVENTARIO,
  encontrarProductoConsulta,
  esDecisionPrecioInventario,
  filtrarCatalogoPorCategoria,
  inferirTamanoBanio,
  resolverAtajoConsulta,
  resolverPrecioBanioPos
} from './pos-precios.util';
import {
  BANNER_CATALOGO_DEMO_POS,
  debeMostrarCatalogoDemoPos,
  esIdProductoDemoPos,
  esProductoDemoPos,
  lineasSinProductosDemo,
  mezclarCatalogoPos
} from './pos-catalogo-demo.util';
import {
  iconoPlaceholderPos,
  kindPlaceholderLinea,
  kindPlaceholderProducto,
  urlFotoProducto
} from './pos-foto.util';

type SheetModo = 'producto' | 'linea' | 'carrito' | 'scanner';

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
  productoForm: FormGroup;
  cobroForm: FormGroup;
  readonly catalogSearch = new FormControl('');
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
  modoMostrador = false;
  pasoWizard = 1;
  productoSel: Producto | null = null;
  mostrarDetalles = false;
  posTab: PosRiel = 'petshop';
  rielHint = '';
  productosCatalogo: Producto[] = [];
  serviciosCatalogo: ServicioClinica[] = [];
  cargandoCatalogo = true;
  muestraCatalogoDemo = false;
  readonly bannerCatalogoDemo = BANNER_CATALOGO_DEMO_POS;
  sheetModo: SheetModo = 'producto';
  sheetAbierta = false;
  sheetProducto: Producto | null = null;
  sheetLinea: VisitaLinea | null = null;
  sheetQty = 1;
  scannerCodigo = '';
  readonly productoSinStockFn = productoSinStock;
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

  readonly copyPrecioInventario = COPY_PRECIO_INVENTARIO;
  readonly copyPrecioServicio = COPY_PRECIO_SERVICIO;
  readonly copyBanioAjustable = COPY_BANIO_AJUSTABLE;
  readonly copyBanioEnFinanzas = COPY_BANIO_EN_FINANZAS;
  private defaultsBanio: DefaultsBanioPorTamano = emptyDefaultsBanio();
  private plantillasCosto: PlantillaCosto[] = [];
  private tiposServicio: TipoServicio[] = [];
  private productosPeluqueria: ProductoPeluqueria[] = [];
  tamanoPaciente: TamanoPerroBanio | '' = '';
  precioBanioDefault: number | null = null;

  readonly metodosPago: Array<{ value: CajaMetodoPago; label: string; icon: string }> = [
    { value: 'efectivo', label: 'Efectivo', icon: 'payments' },
    { value: 'tarjeta', label: 'Tarjeta', icon: 'credit_card' },
    { value: 'transferencia', label: 'Transferencia', icon: 'account_balance' }
  ];

  get totales() {
    return recalcularVisita({ lineas: this.lineas, pagado: this.pagado });
  }

  get artsCount(): number {
    return contarArticulos(this.lineas);
  }

  get contextoRiel() {
    return {
      modoMostrador: this.modoMostrador,
      clienteId: String(this.form?.get('cliente_id')?.value || ''),
      pacienteId: String(this.form?.get('paciente_id')?.value || '')
    };
  }

  get productosFiltrados(): Producto[] {
    const base = filtrarProductosPorRiel(this.productosCatalogo, this.posTab);
    return filtrarProductos(base, this.catalogSearch.value);
  }

  get medicamentosFiltrados(): Producto[] {
    return filtrarProductos(
      filtrarCatalogoPorCategoria(
        filtrarProductosPorRiel(this.productosCatalogo, 'consulta'),
        'medicamento'
      ),
      this.catalogSearch.value
    );
  }

  get vacunasFiltradas(): Producto[] {
    return filtrarProductos(
      filtrarCatalogoPorCategoria(
        filtrarProductosPorRiel(this.productosCatalogo, 'consulta'),
        'vacuna'
      ),
      this.catalogSearch.value
    );
  }

  get clinicosOtrosFiltrados(): Producto[] {
    const consultaId = this.atajoConsultaProducto?.id;
    const base = filtrarProductosPorRiel(this.productosCatalogo, 'consulta').filter(
      (p) =>
        p.categoria !== 'medicamento' &&
        p.categoria !== 'vacuna' &&
        p.id !== consultaId
    );
    return filtrarProductos(base, this.catalogSearch.value);
  }

  get atajoConsultaProducto(): Producto | null {
    return encontrarProductoConsulta(this.productosCatalogo);
  }

  get atajoConsultaPrecio(): number | null {
    const d = resolverAtajoConsulta(this.productosCatalogo);
    return esDecisionPrecioInventario(d) ? d.monto : null;
  }

  get atajoConsultaPideMonto(): boolean {
    return this.atajoConsultaPrecio == null;
  }

  get hayConsultaCatalogo(): boolean {
    return hayServicioConsultaConPrecio(this.serviciosCatalogo);
  }

  get serviciosConsultaFiltrados(): ServicioClinica[] {
    return serviciosParaRielConsulta(this.serviciosCatalogo, this.catalogSearch.value);
  }

  get tituloPos(): string {
    if (this.soloLectura) return 'Ticket cerrado';
    return this.esEdicion ? 'Caja' : 'Nueva venta';
  }

  get subtituloPos(): string {
    const cliente = String(this.form.get('cliente')?.value || '').trim();
    if (this.modoMostrador) return 'Mostrador · sin cliente registrado';
    if (cliente) return cliente;
    return 'Cliente → caja → cobrar';
  }

  get chipClienteLabel(): string {
    if (this.modoMostrador) return 'Mostrador';
    const nombre = String(this.form.get('cliente')?.value || '').trim();
    return nombre || 'Elegir cliente';
  }

  get cobrarLabel(): string {
    const t = this.totales;
    if (t.saldo <= 0) return 'Cobrar';
    if (t.pagado > 0) {
      return `Cobrar resto ${this.formatMoney(t.saldo)}`;
    }
    return `Cobrar ${this.formatMoney(t.saldo)}`;
  }

  get accionBloqueoHint(): string {
    if (this.soloLectura) return '';
    if (!this.modoMostrador && !String(this.form.get('cliente_id')?.value || '').trim()) {
      return 'Elige el dueño, o usa venta de mostrador.';
    }
    if (this.form.invalid && !this.modoMostrador) {
      return 'Completa la fecha y el dueño para continuar.';
    }
    if (!String(this.form.get('fecha')?.value || '').trim()) {
      return 'Indica la fecha de la cuenta.';
    }
    if (!this.lineas.length) {
      return 'Agrega un producto o servicio antes de cobrar.';
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
    return 'Guardar sin cobrar';
  }

  get cobrarBloqueoHint(): string {
    if (this.soloLectura) return 'Ticket cerrado o cancelado';
    if (!this.modoMostrador && !String(this.form.get('cliente_id')?.value || '').trim()) {
      return 'Elige el dueño o activa venta de mostrador';
    }
    if (!this.modoMostrador && this.form.invalid) return 'Completa los datos requeridos';
    if (!this.lineas.length) return 'Agrega líneas al ticket';
    if (this.totales.saldo <= 0) return 'No hay saldo por cobrar';
    return 'Confirmar cobro';
  }

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

  get puedeGuardar(): boolean {
    if (this.loading || this.soloLectura) return false;
    if (!String(this.form.get('fecha')?.value || '').trim()) return false;
    if (this.modoMostrador) return true;
    return this.form.valid;
  }

  get puedeCobrar(): boolean {
    return this.puedeGuardar && this.totales.saldo > 0;
  }

  get puedeIrACobrar(): boolean {
    return this.puedeCobrar;
  }

  get tieneDuenoOMostrador(): boolean {
    if (this.modoMostrador) return true;
    return !!String(this.form.get('cliente_id')?.value || '').trim();
  }

  get sheetTitulo(): string {
    if (this.sheetModo === 'scanner') return 'Código o QR';
    if (this.sheetModo === 'linea') return this.sheetLinea?.descripcion || 'Línea';
    return this.sheetProducto?.nombre || 'Producto';
  }

  get sheetMontoPreview(): number {
    if (this.sheetModo === 'linea' && this.sheetLinea) {
      return roundMoney(precioUnitarioLinea(this.sheetLinea) * this.sheetQty);
    }
    if (this.sheetProducto) {
      return roundMoney((Number(this.sheetProducto.precio_venta) || 0) * this.sheetQty);
    }
    return 0;
  }

  get puedeQuitarSheet(): boolean {
    return this.pagado <= 0 && !this.sheetLinea?.movimientoInventarioId;
  }

  constructor(
    private fb: FormBuilder,
    private visitasService: VisitasService,
    private dialogRef: MatDialogRef<VisitaDialogComponent>,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    private pacientesService: PacientesService,
    private baniosService: BaniosService,
    private inventarioService: InventarioService,
    private serviciosClinica: ServiciosClinicaService,
    private defaultsBanioService: DefaultsBanioService,
    private plantillaCostoService: PlantillaCostoService,
    private cajaService: CajaService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      visita?: Visita;
      cliente_id?: string;
      cliente?: string;
      paciente_id?: string;
      paciente?: string;
      fecha?: string;
      ventaMostrador?: boolean;
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
    this.cobroForm = this.fb.group({
      metodoPago: ['efectivo' as CajaMetodoPago, Validators.required],
      monto: [null, [Validators.required, Validators.min(0.01)]]
    });
  }

  ngOnInit(): void {
    this.dialogRef.addPanelClass('admin-dialog-panel--pos');
    if (typeof window !== 'undefined' && window.innerWidth < 721) {
      this.dialogRef.updateSize('100vw', '100vh');
    } else {
      this.dialogRef.updateSize('min(1120px, 98vw)', 'min(92vh, 900px)');
    }

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
        this.cobroForm.disable();
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

    if (this.data?.ventaMostrador && !this.esEdicion) {
      this.activarVentaMostrador();
    }

    if (this.esEdicion) {
      this.pasoWizard = this.soloLectura ? 3 : 2;
    } else if (this.tieneDuenoOMostrador) {
      this.pasoWizard = 2;
    }

    this.form.get('cliente_id')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => void this.cargarPendientes());
    this.form.get('fecha')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => void this.cargarPendientes());
    this.form.get('paciente_id')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => void this.cargarPendientes());
    void this.cargarPendientes();
    this.cargarCatalogo();
    this.cargarServiciosClinica();
    void this.cargarTarifasBanioPos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  irPaso(paso: number): void {
    if (paso < 1 || paso > 3) return;
    if (paso > 1 && !this.tieneDuenoOMostrador) {
      this.form.markAllAsTouched();
      this.pasoWizard = 1;
      return;
    }
    this.pasoWizard = paso;
    this.cerrarSheet();
    if (paso === 3) {
      this.cobroForm.patchValue({ monto: this.totales.saldo });
    }
  }

  siguientePaso(): void {
    this.irPaso(this.pasoWizard + 1);
  }

  atrasPaso(): void {
    this.irPaso(this.pasoWizard - 1);
  }

  irACobrar(): void {
    if (!this.puedeIrACobrar) return;
    this.irPaso(3);
  }

  elegirRiel(riel: PosRiel): void {
    if (puedeUsarRiel(riel, this.contextoRiel)) {
      this.rielHint = '';
      this.posTab = riel;
      if (riel !== 'petshop') {
        this.catalogSearch.setValue('');
      }
      return;
    }
    this.rielHint = mensajeRielBloqueado(riel, this.contextoRiel);
    this.posTab = riel;
  }

  async nuevoBanioEnTicket(): Promise<void> {
    if (this.soloLectura || !puedeUsarRiel('peluqueria', this.contextoRiel)) {
      this.elegirRiel('peluqueria');
      return;
    }
    const mascota = String(this.form.get('paciente')?.value || 'mascota').trim();
    this.recalcularPrecioBanioDefault();
    const monto = await promptMontoVisita('Nuevo baño', this.copyBanioAjustable, {
      sugerido: this.precioBanioDefault ?? undefined,
      forzarDialogo: true
    });
    if (!(monto != null && monto > 0)) return;
    this.lineas = [
      ...this.lineas,
      {
        id: nuevaLineaId(),
        descripcion: `Baño · ${mascota}`,
        monto: roundMoney(monto),
        categoria: 'banio',
        cantidad: 1
      }
    ];
  }

  elegirClienteClinica(): void {
    if (this.modoMostrador) {
      this.vincularClienteReal();
    }
  }

  ventaMostradorUnTap(): void {
    this.activarVentaMostrador();
    this.irPaso(2);
    this.posTab = 'petshop';
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
    this.tamanoPaciente = inferirTamanoBanio(
      sel.pacienteData as { tamano_perro?: string; tamano?: string } | undefined
    );
    this.recalcularPrecioBanioDefault();
    void this.cargarPendientes();
  }

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
    this.tamanoPaciente = '';
    this.recalcularPrecioBanioDefault();
    this.pendientesBanio = [];
  }

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

  cantidadDe(linea: VisitaLinea): number {
    return cantidadLinea(linea);
  }

  qtyEnCarrito(productoId: string | undefined): number {
    if (!productoId) return 0;
    return this.lineas
      .filter(l => l.productoId === productoId)
      .reduce((s, l) => s + cantidadLinea(l), 0);
  }

  qtyServicioEnCarrito(servicioId: string | undefined): number {
    if (!servicioId) return 0;
    return this.lineas
      .filter((l) => l.servicioClinicaId === servicioId)
      .reduce((s, l) => s + cantidadLinea(l), 0);
  }

  esLineaProducto(linea: VisitaLinea): boolean {
    if (esIdProductoDemoPos(linea.productoId)) return false;
    return linea.categoria === 'venta_producto';
  }

  esProductoDemo(producto: Producto | null | undefined): boolean {
    return esProductoDemoPos(producto);
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

  abrirSheetProducto(p: Producto): void {
    if (this.soloLectura || productoSinStock(p)) return;
    this.sheetModo = 'producto';
    this.sheetProducto = p;
    this.sheetLinea = null;
    this.sheetQty = 1;
    this.sheetAbierta = true;
  }

  abrirSheetLinea(l: VisitaLinea): void {
    if (this.soloLectura) return;
    this.sheetModo = 'linea';
    this.sheetLinea = l;
    this.sheetProducto = null;
    this.sheetQty = cantidadLinea(l);
    this.sheetAbierta = true;
  }

  abrirSheetCarrito(): void {
    this.sheetModo = 'carrito';
    this.sheetProducto = null;
    this.sheetLinea = null;
    this.sheetAbierta = true;
  }

  abrirScanner(): void {
    if (this.soloLectura) return;
    this.posTab = 'petshop';
    this.sheetModo = 'scanner';
    this.sheetProducto = null;
    this.sheetLinea = null;
    this.scannerCodigo = String(this.catalogSearch.value || '').trim();
    this.sheetAbierta = true;
  }

  aplicarCodigoEscaneado(): void {
    const q = String(this.scannerCodigo || this.catalogSearch.value || '').trim();
    if (!q) return;
    this.catalogSearch.setValue(q);
    this.posTab = 'petshop';
    const hits = filtrarProductos(this.productosCatalogo, q);
    const exact =
      hits.find((p) => String(p.codigo_barras || '').toLowerCase() === q.toLowerCase()) ||
      (hits.length === 1 ? hits[0] : null);
    if (!exact) {
      this.cerrarSheet();
      return;
    }
    this.agregarProductoRapido(exact);
    this.catalogSearch.setValue('');
    this.scannerCodigo = '';
    this.cerrarSheet();
  }

  fotoDeProducto(p: Producto | null | undefined): string {
    return urlFotoProducto(p);
  }

  fotoDeLinea(linea: VisitaLinea): string {
    if (!linea.productoId) return '';
    const prod = this.productosCatalogo.find((p) => p.id === linea.productoId);
    return urlFotoProducto(prod);
  }

  iconoProducto(p: Producto | null | undefined): string {
    return iconoPlaceholderPos(kindPlaceholderProducto(p?.categoria));
  }

  iconoLinea(linea: VisitaLinea): string {
    return iconoPlaceholderPos(kindPlaceholderLinea(linea.categoria, !!linea.productoId));
  }

  iconoConsultaAtajo(): string {
    return iconoPlaceholderPos('consulta');
  }

  iconoServicioClinica(s: ServicioClinica): string {
    return iconoTipoServicioClinica(s.tipo);
  }

  labelTipoServicio(s: ServicioClinica): string {
    return labelTipoServicioClinica(s.tipo);
  }

  lineaDeProducto(productoId: string | undefined): VisitaLinea | undefined {
    if (!productoId) return undefined;
    return this.lineas.find(
      (l) => l.productoId === productoId && l.categoria === 'venta_producto' && !l.movimientoInventarioId
    );
  }

  puedeAjustarProducto(p: Producto): boolean {
    const linea = this.lineaDeProducto(p.id);
    return !!linea && this.puedeAjustarLinea(linea);
  }

  tapProducto(p: Producto, event?: Event): void {
    this.agregarProductoRapido(p, event);
  }

  ajustarProductoEnCarrito(p: Producto, delta: number, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const linea = this.lineaDeProducto(p.id);
    if (!linea) {
      if (delta > 0) this.agregarProductoRapido(p);
      return;
    }
    this.ajustarLineaCarrito(linea, delta);
  }

  quitarProductoDelCarrito(p: Producto, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const linea = this.lineaDeProducto(p.id);
    if (linea && this.puedeAjustarLinea(linea)) {
      this.quitarLinea(linea.id);
    }
  }

  quitarLineaGrande(linea: VisitaLinea, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.pagado > 0) return;
    this.quitarLinea(linea.id);
  }

  puedeAjustarLinea(linea: VisitaLinea): boolean {
    return !this.soloLectura && this.pagado <= 0 && !linea.movimientoInventarioId;
  }

  ajustarLineaCarrito(linea: VisitaLinea, delta: number, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (!this.puedeAjustarLinea(linea)) {
      this.abrirSheetLinea(linea);
      return;
    }
    this.aplicarDeltaLinea(linea.id, delta);
  }

  cerrarSheet(): void {
    this.sheetAbierta = false;
    this.sheetProducto = null;
    this.sheetLinea = null;
  }

  sheetMas(): void {
    this.sheetQty += 1;
  }

  sheetMenos(): void {
    if (this.sheetQty > 1) this.sheetQty -= 1;
  }

  confirmarSheet(): void {
    if (this.sheetModo === 'producto' && this.sheetProducto) {
      this.pushProducto(this.sheetProducto, this.sheetQty);
      this.cerrarSheet();
      return;
    }
    if (this.sheetModo === 'linea' && this.sheetLinea) {
      const actual = cantidadLinea(this.sheetLinea);
      const delta = this.sheetQty - actual;
      if (delta === 0) {
        this.cerrarSheet();
        return;
      }
      this.aplicarDeltaLinea(this.sheetLinea.id, delta);
      this.cerrarSheet();
    }
  }

  borrarSheet(): void {
    if (!this.sheetLinea || !this.puedeQuitarSheet) return;
    this.quitarLinea(this.sheetLinea.id);
    this.cerrarSheet();
  }

  agregarProductoRapido(p: Producto, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.pushProducto(p, 1);
  }

  async agregarConsultaAtajo(): Promise<void> {
    if (this.soloLectura) return;
    if (!puedeUsarRiel('consulta', this.contextoRiel)) {
      this.elegirRiel('consulta');
      return;
    }
    const desdeCatalogo = this.serviciosCatalogo.find(
      (s) => s.tipo === 'consulta' && Number(s.precio_venta) > 0 && s.activo !== false
    );
    if (desdeCatalogo) {
      await this.tapServicioClinica(desdeCatalogo);
      return;
    }
    const decision = resolverAtajoConsulta(this.productosCatalogo);
    if (esDecisionPrecioInventario(decision) && decision.producto) {
      this.pushProducto(decision.producto, 1);
      return;
    }
    const monto = await promptMontoVisita('Consulta', '¿Cuánto se cobra por consulta?');
    if (!(monto != null && monto > 0)) return;
    this.lineas = [
      ...this.lineas,
      {
        id: nuevaLineaId(),
        descripcion: 'Consulta general',
        monto: roundMoney(monto),
        categoria: 'consulta',
        cantidad: 1
      }
    ];
  }

  cobrarTodo(): void {
    this.cobroForm.patchValue({ monto: this.totales.saldo });
  }

  formatMoney(n: number): string {
    return `$${(Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  incluirBanioPendiente(p: BanioPendienteTicket): void {
    if (this.soloLectura || banioYaEnLineas(this.lineas, p.id)) return;
    const monto = Number(p.precio_total) || 0;
    if (!(monto > 0)) {
      this.recalcularPrecioBanioDefault();
      void promptMontoVisita('Monto del baño', this.copyBanioAjustable, {
        sugerido: this.precioBanioDefault ?? undefined,
        forzarDialogo: true
      }).then((asked) => {
        if (!(asked != null && asked > 0)) return;
        this.pushLineaBanio(p, asked);
      });
      return;
    }
    this.pushLineaBanio(p, monto);
  }

  quitarLinea(id: string): void {
    if (this.pagado > 0) return;
    this.lineas = this.lineas.filter(l => l.id !== id);
    void this.cargarPendientes();
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

  async confirmarCobro(): Promise<void> {
    if (this.soloLectura || !this.puedeCobrar) return;
    const t = this.totales;
    if (!this.lineas.length) {
      Swal.fire('Sin líneas', 'Agrega al menos un servicio o producto al ticket.', 'warning');
      return;
    }
    const montoPago = roundMoney(Number(this.cobroForm.get('monto')?.value) || 0);
    const metodo = this.cobroForm.get('metodoPago')?.value as CajaMetodoPago;
    if (!(montoPago > 0)) {
      this.cobroForm.markAllAsTouched();
      Swal.fire('Monto', 'Indica cuánto se cobra.', 'warning');
      return;
    }
    if (montoPago > t.saldo + 0.001) {
      Swal.fire('Monto', 'El cobro no puede ser mayor al saldo del ticket.', 'warning');
      return;
    }

    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const visitaId = await this.persistir();
      const cat = this.lineas.length === 1 ? this.lineas[0].categoria : 'otro';
      const raw = this.form.getRawValue();
      const saldoAntes = t.saldo;
      const movIdsInv = this.lineas
        .map(l => l.movimientoInventarioId)
        .filter((id): id is string => !!id);
      const movId = await this.cajaService.crearMovimiento({
        tipo: 'ingreso',
        concepto: `Ticket ${raw.fecha} · ${raw.cliente || (this.modoMostrador ? 'Mostrador' : raw.cliente_id)}`,
        monto: montoPago,
        metodoPago: metodo || 'efectivo',
        ivaDeclarado: false,
        fecha: raw.fecha,
        visitaId,
        clienteId: this.modoMostrador || esClienteMostrador(raw.cliente_id) ? undefined : raw.cliente_id,
        categoria: VISITA_LINEA_A_CAJA[cat] || 'otro',
        movimientoInventarioIds: movIdsInv.length ? movIdsInv : undefined
      });
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
        title: esParcial ? 'Pago parcial registrado' : 'Venta cobrada',
        text: esParcial ? 'Queda saldo. Puedes cobrar el resto después.' : 'Ticket en $0.',
        timer: 2200,
        showConfirmButton: false
      });
      this.dialogRef.close({ visitaId, cobrado: true, parcial: esParcial });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cobrar visita'), 'error');
    } finally {
      this.loading = false;
      this.loadingService.hide();
    }
  }

  imprimir(): void {
    window.print();
  }

  async tapServicioClinica(s: ServicioClinica, event?: Event): Promise<void> {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.soloLectura || !s?.id) return;
    if (!puedeUsarRiel('consulta', this.contextoRiel)) {
      this.elegirRiel('consulta');
      return;
    }
    const decision = resolverLineaServicioClinica(s);
    if ('error' in decision) return;
    let monto = 0;
    if (decision.pedirMonto) {
      const asked = await promptMontoVisita(s.nombre, '¿Cuánto se cobra por este servicio?');
      if (!(asked != null && asked > 0)) return;
      monto = asked;
    } else if (esDecisionPrecioServicio(decision)) {
      monto = decision.monto;
    }
    if (!(monto > 0)) return;
    const existente = this.lineas.find(
      (l) => l.servicioClinicaId === s.id && !l.movimientoInventarioId
    );
    if (existente) {
      this.aplicarDeltaLinea(existente.id, 1);
      return;
    }
    this.lineas = [
      ...this.lineas,
      {
        id: nuevaLineaId(),
        descripcion: s.nombre,
        monto: roundMoney(monto),
        categoria: categoriaLineaDesdeTipoServicio(s.tipo),
        cantidad: 1,
        servicioClinicaId: s.id,
        ...snapshotEconomiaLinea({
          precioVenta: monto,
          costo: s.precio_costo,
          aplicaIva: s.aplicaIva === true,
          tasaIva: s.tasaIva,
          cantidad: 1
        })
      }
    ];
  }

  ajustarServicioEnCarrito(s: ServicioClinica, delta: number, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const linea = this.lineas.find((l) => l.servicioClinicaId === s.id);
    if (!linea || this.pagado > 0) return;
    this.aplicarDeltaLinea(linea.id, delta);
  }

  quitarServicioDelCarrito(s: ServicioClinica, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const linea = this.lineas.find((l) => l.servicioClinicaId === s.id);
    if (!linea) return;
    this.quitarLinea(linea.id);
  }

  private cargarServiciosClinica(): void {
    this.serviciosClinica
      .getServicios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.serviciosCatalogo = (rows || []).filter((s) => s && s.activo !== false);
        },
        error: () => {
          this.serviciosCatalogo = [];
        }
      });
  }

  /** Lectura de catálogo. El POS no crea/edita/borra productos. Demo solo con flag. */
  private cargarCatalogo(): void {
    this.muestraCatalogoDemo = debeMostrarCatalogoDemoPos(environment);
    this.inventarioService
      .getProductos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: rows => {
          const rtdb = (rows || []).filter(p => p && p.activo !== false);
          this.productosCatalogo = mezclarCatalogoPos(
            rtdb,
            MOCK_PRODUCTOS_POS,
            this.muestraCatalogoDemo
          );
          this.recalcularPrecioBanioDefault();
          this.cargandoCatalogo = false;
        },
        error: () => {
          this.productosCatalogo = mezclarCatalogoPos(
            [],
            MOCK_PRODUCTOS_POS,
            this.muestraCatalogoDemo
          );
          this.recalcularPrecioBanioDefault();
          this.cargandoCatalogo = false;
        }
      });
  }

  private pushProducto(p: Producto, qty: number): void {
    if (this.soloLectura || !p?.id) return;
    const cantidad = Math.max(1, Number(qty) || 1);
    const stock = Number(p.stock_actual) || 0;
    const ya = this.qtyEnCarrito(p.id);
    if (stock < ya + cantidad) {
      Swal.fire(
        'Sin stock suficiente',
        `"${p.nombre}" tiene ${stock} ${p.unidad_medida}.`,
        'warning'
      );
      return;
    }
    const unit = Number(p.precio_venta) || 0;
    if (!(unit > 0)) {
      Swal.fire('Sin precio', 'Este producto no tiene precio de venta. Edítalo en Inventario.', 'warning');
      return;
    }
    const existente = this.lineas.find(
      l => l.productoId === p.id && l.categoria === 'venta_producto' && !l.movimientoInventarioId
    );
    if (existente) {
      this.aplicarDeltaLinea(existente.id, cantidad);
      return;
    }
    this.lineas = [
      ...this.lineas,
      {
        id: nuevaLineaId(),
        descripcion: `${p.nombre} × ${cantidad}`,
        monto: roundMoney(unit * cantidad),
        categoria: 'venta_producto',
        productoId: p.id,
        cantidad,
        ...snapshotEconomiaLinea({
          precioVenta: unit,
          costo: p.precio_compra,
          aplicaIva: !!p.iva_aplicable,
          tasaIva: p.tasa_iva,
          cantidad
        })
      }
    ];
    if (productoStockBajo(p)) {
      void Swal.fire({
        toast: true,
        icon: 'info',
        title: 'Stock bajo',
        text: `"${p.nombre}" está por debajo del mínimo (${p.stock_minimo}). El precio viene del inventario.`,
        timer: 2400,
        showConfirmButton: false,
        position: 'top'
      });
    }
  }

  private aplicarDeltaLinea(id: string, delta: number): void {
    if (this.pagado > 0) return;
    const actual = this.lineas.find(l => l.id === id);
    if (!actual || actual.movimientoInventarioId) return;
    const next = ajustarCantidadLinea(actual, delta);
    if (!next) {
      this.quitarLinea(id);
      return;
    }
    this.lineas = this.lineas.map(l => (l.id === id ? next : l));
  }

  private async cargarAlergias(pacienteId: string): Promise<void> {
    try {
      const p = await firstValueFrom(this.pacientesService.getPaciente(pacienteId).pipe(take(1)));
      this.alergiasPaciente = normalizeAlergias(p);
      this.tamanoPaciente = inferirTamanoBanio(p as { tamano_perro?: string; tamano?: string });
      this.recalcularPrecioBanioDefault();
    } catch {
      this.alergiasPaciente = [];
      this.tamanoPaciente = '';
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

  private recalcularPrecioBanioDefault(): void {
    this.precioBanioDefault = resolverPrecioBanioPos({
      tamano: this.tamanoPaciente || 'mediano',
      defaults: this.defaultsBanio,
      plantillas: this.plantillasCosto,
      tiposServicio: this.tiposServicio,
      productosPeluqueria: this.productosPeluqueria,
      catalogoInventario: this.productosCatalogo
    }).precio;
  }

  /** Lectura de tarifas 022 / plantillas / peluquería. El POS no escribe maestros. */
  private async cargarTarifasBanioPos(): Promise<void> {
    try {
      const [defaults, plantillas, tipos, peluqueria] = await Promise.all([
        this.defaultsBanioService.getDefaultsOnce().catch(() => emptyDefaultsBanio()),
        firstValueFrom(this.plantillaCostoService.getPlantillas().pipe(take(1))).catch(
          () => [] as PlantillaCosto[]
        ),
        firstValueFrom(this.baniosService.getTiposServicios().pipe(take(1))).catch(
          () => [] as TipoServicio[]
        ),
        firstValueFrom(this.baniosService.getProductos().pipe(take(1))).catch(
          () => [] as ProductoPeluqueria[]
        )
      ]);
      this.defaultsBanio = defaults || emptyDefaultsBanio();
      this.plantillasCosto = plantillas || [];
      this.tiposServicio = tipos || [];
      this.productosPeluqueria = peluqueria || [];
    } catch {
      this.defaultsBanio = emptyDefaultsBanio();
    }
    this.recalcularPrecioBanioDefault();
  }

  private pushLineaBanio(p: BanioPendienteTicket, monto: number): void {
    this.lineas = [
      ...this.lineas,
      {
        id: nuevaLineaId(),
        descripcion: descripcionLineaBanio(p),
        monto: roundMoney(monto),
        categoria: p.categoria,
        banioId: p.id,
        cantidad: 1,
        ...snapshotEconomiaLinea({
          precioVenta: monto,
          costo: p.costoEstimado,
          aplicaIva: false,
          cantidad: 1
        })
      }
    ];
    this.pendientesBanio = this.pendientesBanio.filter(x => x.id !== p.id);
  }

  private async persistir(): Promise<string> {
    if (this.soloLectura) {
      throw new Error('El ticket está cerrado o cancelado.');
    }
    const raw = this.form.getRawValue();
    const esMostrador = this.modoMostrador || esClienteMostrador(raw.cliente_id);
    const clienteId = esMostrador ? CLIENTE_MOSTRADOR_ID : String(raw.cliente_id || '').trim();
    const clienteNombre = esMostrador ? CLIENTE_MOSTRADOR_NOMBRE : String(raw.cliente || '').trim();

    if (!esMostrador && !clienteId) {
      throw new Error('Elige el dueño, o activa venta de mostrador para vender sin cliente.');
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

    const persistibles = lineasSinProductosDemo(this.lineas, this.productosCatalogo);
    if (!persistibles.length) {
      throw new Error(
        'El catálogo de muestra no se cobra ni se guarda. Agrega productos reales del inventario.'
      );
    }
    this.lineas = await this.asegurarSalidasProducto(persistibles, String(raw.paciente_id || ''));

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
        if (
          esIdProductoDemoPos(linea.productoId) ||
          esProductoDemoPos(this.productosCatalogo.find(p => p.id === linea.productoId))
        ) {
          continue;
        }
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
}
