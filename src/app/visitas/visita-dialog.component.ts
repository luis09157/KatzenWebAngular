import { Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject, firstValueFrom } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { filtrarProductos, productoSinStock, productoStockBajo } from '../core/utils/producto-search.util';
import { ADMIN_DIALOG_DETAIL } from '../core/config/admin-ui.config';
import { Cliente, Paciente } from '../core/models';
import { getClienteNombreCompleto } from '../core/utils/cliente-search.util';
import { ClientesService } from '../clientes/clientes.service';
import { ClienteDialogComponent } from '../clientes/cliente-dialog.component';
import { PacienteAdminDialogComponent } from '../pacientes-admin/paciente-admin-dialog.component';
import { ClientePacientePickerComponent } from '../shared/admin/cliente-paciente-picker.component';
import { CajaService } from '../finanzas/caja.service';
import { ClinicConfigService } from '../core/services/clinic-config.service';
import { CLINICA_NOMBRE_DEFAULT } from '../core/utils/clinica-config.util';
import { CajaMetodoPago } from '../finanzas/caja.models';
import {
  PartePagoMixto,
  armarPartesPagoMixto,
  calcularCambioEfectivo,
  mensajePagoInvalido,
  pagoIncluyeEfectivo,
  validarPagoContraSaldo,
} from './pos-pago-mixto.util';
import { generarTextoTicketWhatsApp, telefonoWhatsAppValido, urlWhatsAppTicket } from './pos-ticket-whatsapp.util';
import { Ticket80View, buildTicket80View } from './ticket-80mm.util';
import { puedeDevolverLinea } from './pos-devolucion.util';
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
  serviciosParaRielConsulta,
} from '../servicios-clinica/servicios-clinica.util';
import { normalizeAlergias } from '../shared/alergias/alergias.util';
import {
  Visita,
  VisitaLinea,
  VisitaLineaCategoria,
  VISITA_ESTADO_LABELS,
  VISITA_LINEA_A_CAJA,
  VISITA_LINEA_CATEGORIA_LABELS,
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
  roundMoney,
} from './visitas.util';
import { snapshotEconomiaLinea } from '../core/utils/precio-margen.util';
import { MENSAJE_KIT_SIN_BOM, productoEsKit, resolverVentaKit, stockReservadoEnCarrito } from './pos-kit-bom.util';
import {
  BanioPendienteTicket,
  banioYaEnLineas,
  descripcionLineaBanio,
  filtrarBaniosPendientesTicket,
} from './pendientes-visita.util';
import {
  CLIENTE_MOSTRADOR_ID,
  CLIENTE_MOSTRADOR_NOMBRE,
  esClienteMostrador,
  esVisitaMostrador,
} from './visita-mostrador.util';
import { promptMontoVisita } from './visita-atalho.util';
import { PosRiel, filtrarProductosPorRiel, mensajeRielBloqueado, puedeUsarRiel } from './pos-rieles.util';
import {
  COPY_BANIO_AJUSTABLE,
  COPY_PRECIO_INVENTARIO,
  encontrarProductoConsulta,
  esDecisionPrecioInventario,
  filtrarCatalogoPorCategoria,
  inferirTamanoBanio,
  resolverAtajoConsulta,
  resolverPrecioBanioPos,
} from './pos-precios.util';
import {
  BANNER_CATALOGO_DEMO_POS,
  debeMostrarCatalogoDemoPos,
  esIdProductoDemoPos,
  esProductoDemoPos,
  lineasSinProductosDemo,
  mezclarCatalogoPos,
} from './pos-catalogo-demo.util';
import { iconoPlaceholderPos, kindPlaceholderLinea, kindPlaceholderProducto, urlFotoProducto } from './pos-foto.util';

type SheetModo = 'producto' | 'linea' | 'carrito' | 'scanner';

@Component({
  selector: 'app-visita-dialog',
  templateUrl: './visita-dialog.component.html',
  styleUrls: ['./visita-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
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
  /**
   * Spec 065 — venta rápida: el cliente se pide solo cuando se agrega un servicio clínico.
   * `accionPendiente` guarda el riel al que se vuelve tras resolver dueño + mascota.
   */
  accionPendiente: { riel: PosRiel } | null = null;
  mensajeRequiereCliente = '';
  telefonoCliente = '';
  telefonoWhatsApp = '';
  resultadoCobro: { visitaId: string; cobrado: true; parcial: boolean } | null = null;
  ultimoPago: { partes: PartePagoMixto[]; saldoPendiente: number } | null = null;
  folioTicket = '';
  ultimoRecibido: number | null = null;
  ultimoCambio: number | null = null;
  @ViewChild(ClientePacientePickerComponent) picker?: ClientePacientePickerComponent;
  readonly productoSinStockFn = productoSinStock;
  readonly staffPickerFields: StaffPickerFields = {
    uidField: 'atendidoPorUid',
    nombreField: 'atendidoPorNombre',
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
    'otro',
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
  clinicaNombre = CLINICA_NOMBRE_DEFAULT;

  readonly metodosPago: Array<{ value: CajaMetodoPago; label: string; icon: string }> = [
    { value: 'efectivo', label: 'Efectivo', icon: 'payments' },
    { value: 'tarjeta', label: 'Tarjeta', icon: 'credit_card' },
    { value: 'transferencia', label: 'Transferencia', icon: 'account_balance' },
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
      pacienteId: String(this.form?.get('paciente_id')?.value || ''),
    };
  }

  get productosFiltrados(): Producto[] {
    const base = filtrarProductosPorRiel(this.productosCatalogo, this.posTab);
    return filtrarProductos(base, this.catalogSearch.value);
  }

  get medicamentosFiltrados(): Producto[] {
    return filtrarProductos(
      filtrarCatalogoPorCategoria(filtrarProductosPorRiel(this.productosCatalogo, 'consulta'), 'medicamento'),
      this.catalogSearch.value
    );
  }

  get vacunasFiltradas(): Producto[] {
    return filtrarProductos(
      filtrarCatalogoPorCategoria(filtrarProductosPorRiel(this.productosCatalogo, 'consulta'), 'vacuna'),
      this.catalogSearch.value
    );
  }

  get clinicosOtrosFiltrados(): Producto[] {
    const consultaId = this.atajoConsultaProducto?.id;
    const base = filtrarProductosPorRiel(this.productosCatalogo, 'consulta').filter(
      (p) => p.categoria !== 'medicamento' && p.categoria !== 'vacuna' && p.id !== consultaId
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
    if (this.resultadoCobro) return this.resultadoCobro.parcial ? 'Pago parcial' : 'Venta cobrada';
    if (this.soloLectura) return 'Ticket cerrado';
    return this.esEdicion ? 'Caja' : 'Nueva venta';
  }

  get subtituloPos(): string {
    const cliente = String(this.form.get('cliente')?.value || '').trim();
    const paciente = String(this.form.get('paciente')?.value || '').trim();
    if (this.resultadoCobro) {
      return this.resultadoCobro.parcial ? 'Pago parcial registrado' : 'Venta cobrada · ticket en $0';
    }
    if (this.modoMostrador) return 'Venta rápida · sin cliente (opcional)';
    if (cliente) return paciente ? `${cliente} · ${paciente}` : cliente;
    return 'Elige al dueño o sigue sin cliente';
  }

  get chipClienteLabel(): string {
    if (this.modoMostrador) return 'Sin cliente · ¿Es cliente?';
    const nombre = String(this.form.get('cliente')?.value || '').trim();
    const paciente = String(this.form.get('paciente')?.value || '').trim();
    if (!nombre) return 'Elegir dueño';
    return paciente ? `${nombre} · ${paciente}` : nombre;
  }

  /** Spec 065 — copy del bloque «¿Es cliente / trae mascota?». */
  get hintBloqueCliente(): string {
    if (this.mensajeRequiereCliente) return this.mensajeRequiereCliente;
    return 'Opcional para productos: liga el ticket a un dueño para guardar su historial y saldo. Para consulta, vacuna, baño o pensión sí hace falta dueño y mascota.';
  }

  get tieneClienteReal(): boolean {
    return !this.modoMostrador && !!String(this.form.get('cliente_id')?.value || '').trim();
  }

  get tienePaciente(): boolean {
    return !!String(this.form.get('paciente_id')?.value || '').trim();
  }

  /** Bloque WhatsApp visible tras cobrar (o en ticket cerrado con pagos). */
  get puedeEnviarWhatsApp(): boolean {
    return !!this.visitaId && (!!this.resultadoCobro || (this.soloLectura && this.totales.pagado > 0));
  }

  ticketWhatsAppInput() {
    const raw = this.form.getRawValue();
    const esMostrador = this.modoMostrador || esClienteMostrador(raw.cliente_id);
    const recibido =
      this.ultimoRecibido != null
        ? this.ultimoRecibido
        : this.incluyeEfectivo
          ? Number(this.cobroForm.get('recibidoEfectivo')?.value) || this.montoEfectivoCobro
          : null;
    const cambio =
      this.ultimoCambio != null ? this.ultimoCambio : this.incluyeEfectivo ? this.cambioEfectivo.cambio : null;
    return {
      fecha: String(raw.fecha || hoyLocalIsoDate()),
      visitaId: this.visitaId,
      folio: this.folioTicket || undefined,
      cliente: esMostrador ? '' : String(raw.cliente || ''),
      esMostrador,
      paciente: esMostrador ? '' : String(raw.paciente || ''),
      lineas: this.lineas,
      pagos: this.ultimoPago?.partes || [],
      recibido,
      cambio,
      saldoPendiente: this.ultimoPago?.saldoPendiente ?? this.totales.saldo,
      clinica: this.clinicaNombre,
    };
  }

  get ticket80(): Ticket80View {
    return buildTicket80View(this.ticketWhatsAppInput());
  }

  get whatsappTelefonoValido(): boolean {
    return telefonoWhatsAppValido(this.telefonoWhatsApp);
  }

  get whatsappHint(): string {
    if (this.modoMostrador)
      return 'Venta de mostrador: escribe el teléfono del comprador si quiere su ticket (opcional).';
    if (!this.telefonoCliente)
      return 'Este dueño no tiene teléfono registrado. Escríbelo aquí para enviarle el ticket.';
    return 'Se abre WhatsApp con el ticket ya escrito; solo toca enviar.';
  }

  get cobrarLabel(): string {
    const t = this.totales;
    if (t.saldo <= 0) return 'Cobrar';
    if (t.pagado > 0) {
      return `Cobrar resto ${this.formatMoney(t.saldo)}`;
    }
    return `Cobrar ${this.formatMoney(t.saldo)}`;
  }

  get incluyeEfectivo(): boolean {
    return pagoIncluyeEfectivo(
      this.cobroForm.get('metodoPago')?.value,
      !!this.cobroForm.get('mixto')?.value,
      Number(this.cobroForm.get('montoEfectivo')?.value) || 0
    );
  }

  get montoEfectivoCobro(): number {
    if (this.cobroForm.get('mixto')?.value) {
      return Number(this.cobroForm.get('montoEfectivo')?.value) || 0;
    }
    if (this.cobroForm.get('metodoPago')?.value === 'efectivo') {
      return Number(this.cobroForm.get('monto')?.value) || this.totales.saldo;
    }
    return 0;
  }

  get cambioEfectivo(): { ok: boolean; cambio: number; error?: string } {
    const recibido = Number(this.cobroForm.get('recibidoEfectivo')?.value);
    const rec = Number.isFinite(recibido) && recibido > 0 ? recibido : this.montoEfectivoCobro;
    return calcularCambioEfectivo(rec, this.montoEfectivoCobro);
  }

  get accionBloqueoHint(): string {
    if (this.soloLectura) return '';
    if (this.mensajeRequiereCliente) return this.mensajeRequiereCliente;
    if (!this.modoMostrador && !String(this.form.get('cliente_id')?.value || '').trim()) {
      return 'Elige al dueño, o sigue sin cliente para vender solo productos.';
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
      return 'Elige al dueño o sigue sin cliente';
    }
    if (!this.modoMostrador && this.form.invalid) return 'Completa los datos requeridos';
    if (!String(this.form.get('fecha')?.value || '').trim()) return 'Indica la fecha';
    return 'Guardar sin cobrar';
  }

  get cobrarBloqueoHint(): string {
    if (this.soloLectura) return 'Ticket cerrado o cancelado';
    if (!this.modoMostrador && !String(this.form.get('cliente_id')?.value || '').trim()) {
      return 'Elige al dueño o sigue sin cliente';
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
    const productos = this.lineas.filter((l) => l.categoria === 'venta_producto');
    if (!productos.length) return '';
    const pendientes = productos.filter((l) => !l.movimientoInventarioId);
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
    private clientesService: ClientesService,
    private dialog: MatDialog,
    private router: Router,
    private clinicConfig: ClinicConfigService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      visita?: Visita;
      cliente_id?: string;
      cliente?: string;
      paciente_id?: string;
      paciente?: string;
      fecha?: string;
      ventaMostrador?: boolean;
      /** Spec 070 — salida inventario tipo venta → POS. */
      productoId?: string;
      productoCantidad?: number;
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
      atendidoPorNombre: [''],
    });
    this.lineaForm = this.fb.group({
      descripcion: ['', [Validators.required, Validators.minLength(2)]],
      monto: [null, [Validators.required, Validators.min(0.01)]],
      categoria: ['consulta' as VisitaLineaCategoria, Validators.required],
    });
    this.productoForm = this.fb.group({
      producto_id: ['', Validators.required],
      producto_nombre: [''],
      cantidad: [1, [Validators.required, Validators.min(1)]],
    });
    this.cobroForm = this.fb.group({
      metodoPago: ['efectivo' as CajaMetodoPago, Validators.required],
      monto: [null, [Validators.required, Validators.min(0.01)]],
      mixto: [false],
      montoEfectivo: [0],
      montoTarjeta: [0],
      montoTransferencia: [0],
      recibidoEfectivo: [null as number | null],
    });
  }

  ngOnInit(): void {
    this.clinicConfig
      .nombreClinica$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((nombre) => {
        this.clinicaNombre = nombre || CLINICA_NOMBRE_DEFAULT;
      });
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
      this.folioTicket = String(v.folio || '').trim();
      this.estadoLabel = VISITA_ESTADO_LABELS[v.estado] || v.estado;
      this.form.patchValue({
        cliente_id: v.cliente_id,
        cliente: v.cliente || '',
        paciente_id: v.paciente_id || '',
        paciente: v.paciente || '',
        fecha: v.fecha,
        notas: v.notas || '',
        atendidoPorUid: v.atendidoPorUid || '',
        atendidoPorNombre: v.atendidoPorNombre || '',
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
      if (!esVisitaMostrador(v) && v.cliente_id) {
        void this.cargarTelefonoCliente(v.cliente_id);
      }
    } else {
      this.form.patchValue({
        cliente_id: this.data?.cliente_id || '',
        cliente: this.data?.cliente || '',
        paciente_id: this.data?.paciente_id || '',
        paciente: this.data?.paciente || '',
        fecha: this.data?.fecha || hoyLocalIsoDate(),
      });
      if (this.data?.paciente_id) {
        void this.cargarAlergias(this.data.paciente_id);
      }
      if (this.data?.cliente_id && !esClienteMostrador(this.data.cliente_id)) {
        void this.cargarTelefonoCliente(this.data.cliente_id);
      }
    }

    // Spec 065 — venta rápida por defecto: sin cliente el POS abre en productos (mostrador implícito).
    if (!this.esEdicion && (this.data?.ventaMostrador || !this.tieneDuenoOMostrador)) {
      this.activarVentaMostrador();
    }

    if (this.esEdicion) {
      this.pasoWizard = this.soloLectura ? 3 : 2;
    } else {
      this.pasoWizard = 2;
    }

    this.form
      .get('cliente_id')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => void this.cargarPendientes());
    this.form
      .get('fecha')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => void this.cargarPendientes());
    this.form
      .get('paciente_id')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => void this.cargarPendientes());
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

  irAInventarioProductos(): void {
    this.dialogRef.close(false);
    void this.router.navigate(['/admin/inventario/productos']);
  }

  irACobrar(): void {
    if (!this.puedeIrACobrar) return;
    const saldo = this.totales.saldo;
    if (!this.cobroForm.get('monto')?.value) {
      this.cobroForm.patchValue({ monto: saldo });
    }
    if (this.cobroForm.get('recibidoEfectivo')?.value == null) {
      this.cobroForm.patchValue({ recibidoEfectivo: this.montoEfectivoCobro || saldo });
    }
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
    // Spec 065 — el servicio clínico pide dueño + mascota en ese momento y regresa al riel.
    this.pedirClientePara(riel);
  }

  /** Copy «te falta X» según el servicio que se quiso agregar. */
  mensajeRequiereClientePara(riel: PosRiel): string {
    const faltaMascota = this.tieneClienteReal && !this.tienePaciente;
    const dueno = String(this.form.get('cliente')?.value || '').trim();
    if (riel === 'peluqueria') {
      return faltaMascota
        ? `Elige o agrega la mascota de ${dueno} para registrar el baño.`
        : 'Para registrar un baño necesito saber de qué mascota es. Elige al dueño y la mascota, o créalos aquí.';
    }
    return faltaMascota
      ? `Elige o agrega la mascota de ${dueno} para registrar la consulta.`
      : 'Para registrar una consulta necesito saber de qué paciente es. Elige al dueño y la mascota, o créalos aquí.';
  }

  /** Abre el bloque «¿Es cliente / trae mascota?» con la acción pendiente para reanudar el cobro. */
  pedirClientePara(riel: PosRiel): void {
    if (this.soloLectura) return;
    this.accionPendiente = { riel };
    if (this.modoMostrador) {
      this.vincularClienteReal();
    }
    this.mensajeRequiereCliente = this.mensajeRequiereClientePara(riel);
    this.rielHint = mensajeRielBloqueado(riel, this.contextoRiel);
    this.posTab = riel;
    this.cerrarSheet();
    this.pasoWizard = 1;
  }

  /** Abrir el bloque de cliente sin acción pendiente (chip «¿Es cliente?»). */
  abrirBloqueCliente(): void {
    if (this.soloLectura) return;
    this.mensajeRequiereCliente = '';
    if (this.modoMostrador) {
      this.vincularClienteReal();
    }
    this.cerrarSheet();
    this.pasoWizard = 1;
  }

  /** En servicio clínico la mascota es obligatoria; al ligar el ticket es opcional. */
  get pacienteRequeridoEnPicker(): boolean {
    return !!this.accionPendiente;
  }

  /** «Seguir sin cliente»: vuelve a mostrador y a la caja; descarta la acción clínica pendiente. */
  seguirSinCliente(): void {
    if (this.soloLectura) return;
    this.accionPendiente = null;
    this.mensajeRequiereCliente = '';
    this.rielHint = '';
    this.activarVentaMostrador();
    this.posTab = 'petshop';
    this.irPaso(2);
  }

  /** Cliente ya resuelto (con o sin mascota): volver a la caja; reanuda el riel si ya se puede. */
  continuarACaja(): void {
    if (!this.tieneDuenoOMostrador) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.accionPendiente && !puedeUsarRiel(this.accionPendiente.riel, this.contextoRiel)) {
      this.mensajeRequiereCliente = this.mensajeRequiereClientePara(this.accionPendiente.riel);
      return;
    }
    this.mensajeRequiereCliente = '';
    if (this.accionPendiente) {
      this.posTab = this.accionPendiente.riel;
      this.rielHint = '';
      this.accionPendiente = null;
    }
    this.irPaso(2);
  }

  private reanudarAccionPendiente(): void {
    if (!this.accionPendiente) return;
    const riel = this.accionPendiente.riel;
    if (!puedeUsarRiel(riel, this.contextoRiel)) {
      this.mensajeRequiereCliente = this.mensajeRequiereClientePara(riel);
      return;
    }
    this.accionPendiente = null;
    this.mensajeRequiereCliente = '';
    this.rielHint = '';
    this.posTab = riel;
    this.catalogSearch.setValue('');
    this.pasoWizard = 2;
    const cliente = String(this.form.get('cliente')?.value || '').trim();
    const paciente = String(this.form.get('paciente')?.value || '').trim();
    void Swal.fire({
      toast: true,
      icon: 'success',
      title: `${cliente} · ${paciente}`,
      text: riel === 'peluqueria' ? 'Listo. Ahora agrega el baño.' : 'Listo. Ahora agrega la consulta o el servicio.',
      timer: 2600,
      showConfirmButton: false,
      position: 'top',
    });
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
      forzarDialogo: true,
    });
    if (!(monto != null && monto > 0)) return;
    this.lineas = [
      ...this.lineas,
      {
        id: nuevaLineaId(),
        descripcion: `Baño · ${mascota}`,
        monto: roundMoney(monto),
        categoria: 'banio',
        cantidad: 1,
      },
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
      paciente: sel.paciente || '',
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

    // Spec 065 — teléfono para WhatsApp y reanudar el servicio clínico pendiente.
    const tel = String(sel.clienteData?.telefono || '').trim();
    if (tel) {
      this.telefonoCliente = tel;
    } else if (sel.cliente_id && !esClienteMostrador(sel.cliente_id)) {
      void this.cargarTelefonoCliente(sel.cliente_id);
    } else {
      this.telefonoCliente = '';
    }
    this.reanudarAccionPendiente();
  }

  /** Spec 065 — «Cliente nuevo» desde el picker: alta rápida, selección automática y ¿trae mascota? */
  async crearClienteRapido(prefill = ''): Promise<void> {
    if (this.soloLectura) return;
    const ref = this.dialog.open(ClienteDialogComponent, {
      ...ADMIN_DIALOG_DETAIL,
      autoFocus: '[cdkFocusInitial]',
      data: { modo: 'rapido', prefill },
    });
    const result = (await firstValueFrom(ref.afterClosed())) as (Cliente & { id?: string }) | undefined;
    if (!result) return;

    let cliente: Cliente;
    this.loadingService.show('Guardando cliente…');
    try {
      const id = await this.clientesService.guardarCliente({ ...result, id: '' });
      cliente = { ...result, id, activo: true };
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar cliente'), 'error');
      return;
    } finally {
      this.loadingService.hide();
    }

    this.seleccionarClienteCreado(cliente);
    const nombre = getClienteNombreCompleto(cliente) || 'el cliente';
    const ask = await Swal.fire({
      icon: 'question',
      title: '¿Trae mascota?',
      text: `Puedes registrar la mascota de ${nombre} ahora o después.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar mascota',
      cancelButtonText: 'Ahora no',
    });
    if (ask.isConfirmed) {
      await this.crearMascotaRapida(cliente);
    }
  }

  /** Spec 065 — «Agregar mascota» para el dueño actual: alta rápida y selección automática. */
  async crearMascotaRapida(cliente?: Cliente | null): Promise<void> {
    if (this.soloLectura) return;
    const dueno: Cliente | null = cliente?.id
      ? cliente
      : this.tieneClienteReal
        ? {
            id: String(this.form.get('cliente_id')?.value || ''),
            nombre: String(this.form.get('cliente')?.value || ''),
            telefono: this.telefonoCliente,
          }
        : null;
    if (!dueno?.id) {
      Swal.fire('Falta el dueño', 'Primero elige o crea al dueño de la mascota.', 'info');
      return;
    }
    const ref = this.dialog.open(PacienteAdminDialogComponent, {
      ...ADMIN_DIALOG_DETAIL,
      autoFocus: '[cdkFocusInitial]',
      data: { modo: 'rapido', cliente: dueno },
    });
    const result = (await firstValueFrom(ref.afterClosed())) as Paciente | undefined;
    if (!result) return;

    this.loadingService.show('Guardando mascota…');
    try {
      const id = await this.pacientesService.crearPaciente(result);
      const paciente: Paciente = { ...result, id, activo: true };
      this.seleccionarPacienteCreado(paciente, dueno);
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar paciente'), 'error');
    } finally {
      this.loadingService.hide();
    }
  }

  private seleccionarClienteCreado(cliente: Cliente): void {
    if (this.picker) {
      this.picker.seleccionarClienteExterno(cliente);
      return;
    }
    this.onClientePacienteSelected({
      cliente_id: String(cliente.id || ''),
      cliente: getClienteNombreCompleto(cliente),
      paciente_id: '',
      paciente: '',
      clienteData: cliente,
    });
  }

  private seleccionarPacienteCreado(paciente: Paciente, cliente: Cliente): void {
    if (this.picker) {
      this.picker.seleccionarPacienteExterno(paciente, cliente);
      return;
    }
    this.onClientePacienteSelected({
      cliente_id: String(cliente.id || ''),
      cliente: getClienteNombreCompleto(cliente) || String(cliente.nombre || ''),
      paciente_id: String(paciente.id || ''),
      paciente: String(paciente.nombre || ''),
      clienteData: cliente,
      pacienteData: paciente,
    });
  }

  private async cargarTelefonoCliente(clienteId: string): Promise<void> {
    try {
      const c = await firstValueFrom(this.clientesService.getCliente(clienteId).pipe(take(1)));
      this.telefonoCliente = String(c?.telefono || '').trim();
    } catch {
      this.telefonoCliente = '';
    }
  }

  /** Spec 065 — abre WhatsApp con el ticket ya escrito (`wa.me`). */
  enviarTicketWhatsApp(): void {
    if (!this.puedeEnviarWhatsApp) return;
    const texto = generarTextoTicketWhatsApp(this.ticketWhatsAppInput());
    const url = urlWhatsAppTicket(this.telefonoWhatsApp, texto);
    if (!url) {
      Swal.fire('Teléfono', 'Escribe un teléfono de 10 dígitos para enviar el ticket.', 'warning');
      return;
    }
    window.open(url, '_blank', 'noopener');
  }

  activarVentaMostrador(): void {
    if (this.soloLectura) return;
    this.modoMostrador = true;
    this.form.patchValue({
      cliente_id: CLIENTE_MOSTRADOR_ID,
      cliente: CLIENTE_MOSTRADOR_NOMBRE,
      paciente_id: '',
      paciente: '',
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
      paciente: '',
    });
    this.form.get('cliente_id')?.setValidators([Validators.required]);
    this.form.get('cliente_id')?.updateValueAndValidity({ emitEvent: false });
  }

  cantidadDe(linea: VisitaLinea): number {
    return cantidadLinea(linea);
  }

  qtyEnCarrito(productoId: string | undefined): number {
    if (!productoId) return 0;
    return this.lineas.filter((l) => l.productoId === productoId).reduce((s, l) => s + cantidadLinea(l), 0);
  }

  qtyServicioEnCarrito(servicioId: string | undefined): number {
    if (!servicioId) return 0;
    return this.lineas.filter((l) => l.servicioClinicaId === servicioId).reduce((s, l) => s + cantidadLinea(l), 0);
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
        cantidad: 1,
      },
    ];
  }

  cobrarTodo(): void {
    const saldo = this.totales.saldo;
    if (this.cobroForm.get('mixto')?.value) {
      this.cobroForm.patchValue({
        montoEfectivo: saldo,
        montoTarjeta: 0,
        montoTransferencia: 0,
        monto: saldo,
      });
      return;
    }
    this.cobroForm.patchValue({ monto: saldo, recibidoEfectivo: saldo });
  }

  togglePagoMixto(): void {
    const on = !this.cobroForm.get('mixto')?.value;
    this.cobroForm.patchValue({
      mixto: on,
      montoEfectivo: on ? this.totales.saldo : 0,
      montoTarjeta: 0,
      montoTransferencia: 0,
    });
  }

  puedeDevolver(linea: { id?: string; descripcion?: string; fueDevuelto?: boolean; monto?: number }): boolean {
    return this.soloLectura && !!this.visitaId && puedeDevolverLinea(linea as Pick<VisitaLinea, 'monto'>);
  }

  formatMoney(n: number): string {
    return `$${(Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  cancelar(): void {
    this.dialogRef.close(this.resultadoCobro ?? false);
  }

  incluirBanioPendiente(p: BanioPendienteTicket): void {
    if (this.soloLectura || banioYaEnLineas(this.lineas, p.id)) return;
    const monto = Number(p.precio_total) || 0;
    if (!(monto > 0)) {
      this.recalcularPrecioBanioDefault();
      void promptMontoVisita('Monto del baño', this.copyBanioAjustable, {
        sugerido: this.precioBanioDefault ?? undefined,
        forzarDialogo: true,
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
    this.lineas = this.lineas.filter((l) => l.id !== id);
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
    const mixto = !!this.cobroForm.get('mixto')?.value;
    const partes = mixto
      ? armarPartesPagoMixto({
          efectivo: Number(this.cobroForm.get('montoEfectivo')?.value) || 0,
          tarjeta: Number(this.cobroForm.get('montoTarjeta')?.value) || 0,
          transferencia: Number(this.cobroForm.get('montoTransferencia')?.value) || 0,
        })
      : armarPartesPagoMixto({
          [this.cobroForm.get('metodoPago')?.value || 'efectivo']: Number(this.cobroForm.get('monto')?.value) || 0,
        } as { efectivo?: number; tarjeta?: number; transferencia?: number });
    const valid = validarPagoContraSaldo(partes, t.saldo);
    const pagoErr = mensajePagoInvalido(valid);
    if (pagoErr) {
      this.cobroForm.markAllAsTouched();
      Swal.fire('Monto', pagoErr, 'warning');
      return;
    }
    if (this.incluyeEfectivo && !this.cambioEfectivo.ok) {
      Swal.fire('Efectivo', this.cambioEfectivo.error || 'El efectivo recibido no alcanza.', 'warning');
      return;
    }
    const montoPago = valid.total;

    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const visitaId = await this.persistir();
      const cat = this.lineas.length === 1 ? this.lineas[0].categoria : 'otro';
      const raw = this.form.getRawValue();
      const saldoAntes = t.saldo;
      const movIdsInv = this.lineas.map((l) => l.movimientoInventarioId).filter((id): id is string => !!id);
      const visita = await this.visitasService.getVisita(visitaId);
      if (!visita) throw new Error('Visita no encontrada');
      const ids = [...(visita.cajaMovimientoIds || [])];
      let pagadoAcc = visita.pagado || 0;
      for (const parte of partes) {
        const movId = await this.cajaService.crearMovimiento({
          tipo: 'ingreso',
          concepto: `Ticket ${raw.fecha} · ${raw.cliente || (this.modoMostrador ? 'Mostrador' : raw.cliente_id)}`,
          monto: parte.monto,
          metodoPago: parte.metodo,
          ivaDeclarado: false,
          fecha: raw.fecha,
          visitaId,
          clienteId: this.modoMostrador || esClienteMostrador(raw.cliente_id) ? undefined : raw.cliente_id,
          categoria: VISITA_LINEA_A_CAJA[cat] || 'otro',
          movimientoInventarioIds: movIdsInv.length ? movIdsInv : undefined,
        });
        if (!ids.includes(movId)) ids.push(movId);
        pagadoAcc = roundMoney(pagadoAcc + parte.monto);
      }
      await this.visitasService.actualizarVisita(visitaId, {
        pagado: pagadoAcc,
        cajaMovimientoIds: ids,
      });
      this.folioTicket = await this.visitasService.asignarFolioSiFalta(visitaId);
      const esParcial = montoPago < saldoAntes - 0.001;
      this.ultimoRecibido = this.incluyeEfectivo
        ? Number(this.cobroForm.get('recibidoEfectivo')?.value) || this.montoEfectivoCobro
        : null;
      this.ultimoCambio = this.incluyeEfectivo ? this.cambioEfectivo.cambio : null;
      // Spec 065 — el diálogo se queda abierto para imprimir / enviar por WhatsApp; se cierra con «Cerrar».
      this.pagado = pagadoAcc;
      this.resultadoCobro = { visitaId, cobrado: true, parcial: esParcial };
      this.ultimoPago = { partes, saldoPendiente: roundMoney(Math.max(0, saldoAntes - montoPago)) };
      this.telefonoWhatsApp = this.telefonoCliente || '';
      this.estadoLabel = VISITA_ESTADO_LABELS[this.totales.estado] || this.estadoLabel;
      if (!esParcial) {
        this.soloLectura = true;
        this.form.disable({ emitEvent: false });
        this.lineaForm.disable({ emitEvent: false });
        this.productoForm.disable({ emitEvent: false });
        this.cobroForm.disable({ emitEvent: false });
      } else {
        this.cobroForm.patchValue({ monto: this.totales.saldo, mixto: false });
      }
      this.pasoWizard = 3;
      this.cerrarSheet();
      void Swal.fire({
        toast: true,
        position: 'top',
        icon: 'success',
        title: esParcial ? 'Pago parcial registrado' : 'Venta cobrada',
        text: esParcial
          ? 'Queda saldo. Puedes cobrar el resto después.'
          : 'Ticket en $0. Puedes enviarlo por WhatsApp.',
        timer: 2600,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cobrar visita'), 'error');
    } finally {
      this.loading = false;
      this.loadingService.hide();
    }
  }

  async devolverLinea(linea: {
    id: string;
    descripcion: string;
    fueDevuelto?: boolean;
    monto?: number;
  }): Promise<void> {
    if (!this.visitaId || !this.puedeDevolver(linea)) {
      return;
    }
    const ask = await Swal.fire({
      icon: 'question',
      title: '¿Devolver esta línea?',
      text: `${linea.descripcion}. Se reintegra stock si era producto y se registra un egreso en caja.`,
      showCancelButton: true,
      confirmButtonText: 'Devolver',
      cancelButtonText: 'Cancelar',
    });
    if (!ask.isConfirmed) {
      return;
    }
    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      await this.visitasService.devolverLineas(this.visitaId, [linea.id]);
      const v = await this.visitasService.getVisita(this.visitaId);
      if (v) {
        this.lineas = [...(v.lineas || [])];
        this.pagado = Number(v.pagado) || 0;
        this.estadoLabel = VISITA_ESTADO_LABELS[v.estado] || v.estado;
      }
      Swal.fire({ icon: 'success', title: 'Devolución registrada', timer: 1800, showConfirmButton: false });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'devolver visita'), 'error');
    } finally {
      this.loading = false;
      this.loadingService.hide();
    }
  }

  imprimir(): void {
    document.body.classList.add('visita-printing');
    const cleanup = () => {
      document.body.classList.remove('visita-printing');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
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
    const existente = this.lineas.find((l) => l.servicioClinicaId === s.id && !l.movimientoInventarioId);
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
          cantidad: 1,
        }),
      },
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
        },
      });
  }

  /** Lectura de catálogo. El POS no crea/edita/borra productos. Demo solo con flag. */
  private cargarCatalogo(): void {
    this.muestraCatalogoDemo = debeMostrarCatalogoDemoPos(environment);
    this.inventarioService
      .getProductos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          const rtdb = (rows || []).filter((p) => p && p.activo !== false);
          this.productosCatalogo = mezclarCatalogoPos(rtdb, MOCK_PRODUCTOS_POS, this.muestraCatalogoDemo);
          this.recalcularPrecioBanioDefault();
          this.cargandoCatalogo = false;
          this.aplicarProductoPrecargado();
        },
        error: () => {
          this.productosCatalogo = mezclarCatalogoPos([], MOCK_PRODUCTOS_POS, this.muestraCatalogoDemo);
          this.recalcularPrecioBanioDefault();
          this.cargandoCatalogo = false;
          this.aplicarProductoPrecargado();
        },
      });
  }

  private aplicarProductoPrecargado(): void {
    const pid = String(this.data?.productoId || '').trim();
    if (!pid || this.soloLectura) return;
    if (this.lineas.some((l) => l.productoId === pid && l.categoria === 'venta_producto')) return;
    const p = this.productosCatalogo.find((row) => row.id === pid);
    if (!p) return;
    this.pushProducto(p, Math.max(1, Number(this.data?.productoCantidad) || 1));
  }

  private pushProducto(p: Producto, qty: number): void {
    if (this.soloLectura || !p?.id) return;
    const cantidad = Math.max(1, Number(qty) || 1);
    const ya = this.qtyEnCarrito(p.id);
    if (productoEsKit(p)) {
      const otras = this.lineas.filter((l) => l.productoId !== p.id);
      const reserved = stockReservadoEnCarrito(otras, this.productosCatalogo);
      const kit = resolverVentaKit(p, ya + cantidad, this.productosCatalogo, reserved);
      if (!kit.ok) {
        const titulo = kit.motivo === 'sin_bom' ? MENSAJE_KIT_SIN_BOM : 'No se puede vender el paquete';
        Swal.fire(titulo, kit.mensaje, 'warning');
        return;
      }
    } else {
      const stock = Number(p.stock_actual) || 0;
      if (stock < ya + cantidad) {
        Swal.fire('Sin stock suficiente', `"${p.nombre}" tiene ${stock} ${p.unidad_medida}.`, 'warning');
        return;
      }
    }
    const unit = Number(p.precio_venta) || 0;
    if (!(unit > 0)) {
      Swal.fire('Sin precio', 'Este producto no tiene precio de venta. Edítalo en Inventario.', 'warning');
      return;
    }
    const existente = this.lineas.find(
      (l) => l.productoId === p.id && l.categoria === 'venta_producto' && !l.movimientoInventarioId
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
          cantidad,
        }),
      },
    ];
    if (productoStockBajo(p)) {
      void Swal.fire({
        toast: true,
        icon: 'info',
        title: 'Stock bajo',
        text: `"${p.nombre}" está por debajo del mínimo (${p.stock_minimo}). El precio viene del inventario.`,
        timer: 2400,
        showConfirmButton: false,
        position: 'top',
      });
    }
  }

  private aplicarDeltaLinea(id: string, delta: number): void {
    if (this.pagado > 0) return;
    const actual = this.lineas.find((l) => l.id === id);
    if (!actual || actual.movimientoInventarioId) return;
    if (delta > 0 && actual.productoId) {
      const p = this.productosCatalogo.find((x) => x.id === actual.productoId);
      if (p) {
        const nextQty = (Number(actual.cantidad) || 1) + delta;
        if (productoEsKit(p)) {
          const otras = this.lineas.filter((l) => l.id !== id);
          const reserved = stockReservadoEnCarrito(otras, this.productosCatalogo);
          const kit = resolverVentaKit(p, nextQty, this.productosCatalogo, reserved);
          if (!kit.ok) {
            Swal.fire(
              kit.motivo === 'sin_bom' ? MENSAJE_KIT_SIN_BOM : 'No se puede vender el paquete',
              kit.mensaje,
              'warning'
            );
            return;
          }
        } else if ((Number(p.stock_actual) || 0) < nextQty) {
          Swal.fire('Sin stock suficiente', `"${p.nombre}" tiene ${p.stock_actual} ${p.unidad_medida}.`, 'warning');
          return;
        }
      }
    }
    const next = ajustarCantidadLinea(actual, delta);
    if (!next) {
      this.quitarLinea(id);
      return;
    }
    this.lineas = this.lineas.map((l) => (l.id === id ? next : l));
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
    const fecha = String(this.form.get('fecha')?.value || '')
      .trim()
      .slice(0, 10);
    if (!clienteId || !fecha) {
      this.pendientesBanio = [];
      return;
    }
    try {
      const banios = await firstValueFrom(this.baniosService.getBanios().pipe(take(1)));
      this.pendientesBanio = filtrarBaniosPendientesTicket(banios || [], {
        clienteId,
        fecha,
        pacienteId: String(this.form.get('paciente_id')?.value || '').trim() || undefined,
      }).filter((p) => !banioYaEnLineas(this.lineas, p.id));
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
      catalogoInventario: this.productosCatalogo,
    }).precio;
  }

  /** Lectura de tarifas 022 / plantillas / peluquería. El POS no escribe maestros. */
  private async cargarTarifasBanioPos(): Promise<void> {
    try {
      const [defaults, plantillas, tipos, peluqueria] = await Promise.all([
        this.defaultsBanioService.getDefaultsOnce().catch(() => emptyDefaultsBanio()),
        firstValueFrom(this.plantillaCostoService.getPlantillas().pipe(take(1))).catch(() => [] as PlantillaCosto[]),
        firstValueFrom(this.baniosService.getTiposServicios().pipe(take(1))).catch(() => [] as TipoServicio[]),
        firstValueFrom(this.baniosService.getProductos().pipe(take(1))).catch(() => [] as ProductoPeluqueria[]),
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
          cantidad: 1,
        }),
      },
    ];
    this.pendientesBanio = this.pendientesBanio.filter((x) => x.id !== p.id);
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
      const existente = await this.visitasService.buscarVisitaAbiertaDelDia(clienteId, raw.fecha || hoyLocalIsoDate());
      if (existente?.id) {
        const conf = await Swal.fire({
          icon: 'question',
          title: 'Ya hay un ticket abierto',
          html: `Cliente <strong>${existente.cliente || clienteNombre}</strong> · ${existente.fecha}<br/>Saldo ${this.formatMoney(existente.saldo)}. ¿Usar ese ticket en lugar de crear otro?`,
          showCancelButton: true,
          confirmButtonText: 'Usar ticket existente',
          cancelButtonText: 'Crear otro',
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
      throw new Error('El catálogo de muestra no se cobra ni se guarda. Agrega productos reales del inventario.');
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
        lineas: this.lineas,
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
      lineas: this.lineas,
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
          esProductoDemoPos(this.productosCatalogo.find((p) => p.id === linea.productoId))
        ) {
          continue;
        }
        const qty = Math.max(1, Number(linea.cantidad) || 1);
        const prod = this.productosCatalogo.find((p) => p.id === linea.productoId);
        if (productoEsKit(prod)) {
          const kit = resolverVentaKit(prod!, qty, this.productosCatalogo, {});
          if (!kit.ok) {
            throw new Error(kit.mensaje || MENSAJE_KIT_SIN_BOM);
          }
          let firstId = '';
          for (const s of kit.salidas) {
            const movId = await this.inventarioService.registrarSalida(
              s.productoId,
              s.cantidad,
              'venta_directa',
              pacienteId || '',
              '',
              '',
              `Ticket visita · kit ${prod!.nombre} · ${s.nombre} × ${s.cantidad}`,
              this.visitaId || ''
            );
            if (!firstId) firstId = movId;
          }
          out.push({ ...linea, cantidad: qty, movimientoInventarioId: firstId });
        } else {
          const movId = await this.inventarioService.registrarSalida(
            linea.productoId,
            qty,
            'venta_directa',
            pacienteId || '',
            '',
            '',
            `Ticket visita · ${linea.descripcion}`,
            this.visitaId || ''
          );
          out.push({ ...linea, cantidad: qty, movimientoInventarioId: movId });
        }
      } else {
        out.push(linea);
      }
    }
    return out;
  }
}
