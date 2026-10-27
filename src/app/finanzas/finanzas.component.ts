import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ADMIN_DIALOG_CONFIG } from '../core/config/admin-ui.config';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { LoggerService } from '../core/logger.service';
import { CajaMovimientoDialogComponent } from './caja-movimiento-dialog.component';
import { CajaCorteDialogComponent } from './caja-corte-dialog.component';
import { PlantillaCostoDialogComponent } from './plantilla-costo-dialog.component';
import { CajaService } from './caja.service';
import { PlantillaCostoService } from './plantilla-costo.service';
import { DefaultsBanioService } from './defaults-banio.service';
import { DefaultsPensionService } from './defaults-pension.service';
import {
  DefaultsBanioPorTamano,
  TAMANO_PERRO_LABELS,
  TAMANOS_PERRO_ORDEN,
  TamanoPerroBanio,
  emptyDefaultsBanio,
} from './defaults-banio.models';
import {
  DefaultsPensionPorTamano,
  TAMANO_PENSION_DEFAULT_LABELS,
  TAMANOS_PENSION_ORDEN,
  TamanoMascotaPensionDefault,
  emptyDefaultsPension,
} from './defaults-pension.models';
import {
  CAJA_CATEGORIA_LABELS,
  CajaCategoria,
  CajaChartBar,
  CajaDiaKpis,
  CajaEgresoDesglose,
  CajaIngresoDesglose,
  CajaMovimiento,
  CajaPeriodoModo,
  BanioIngresoRefuerzo,
  ServiciosSinCajaResumen,
} from './caja.models';
import { PlantillaCosto, PLANTILLA_TIPO_LABELS } from './plantilla-costo.models';
import { BaniosService } from '../banios/banios.service';
import { Banio } from '../shared/banio.model';
import { PensionService } from '../pension/pension.service';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { VisitasService } from '../visitas/visitas.service';
import { ClientesService } from '../clientes/clientes.service';
import { agruparVentasPorVeterinaria, resumenCxcClientes, VentaPorVeterinaria } from './ventas-por-veterinaria.util';

import { TarifasPeluqueriaService } from './tarifas-peluqueria.service';
import {
  FILAS_TARIFA_PELUQUERIA,
  FILA_TARIFA_PELUQUERIA_LABELS,
  FilaTarifaPeluqueria,
  TarifasPeluqueria,
  tarifasPeluqueriaVacias,
} from './tarifas-peluqueria.util';
@Component({
  selector: 'app-finanzas',
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.scss'],
})
export class FinanzasComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  readonly pageSize = 50;

  selectedTab = 0;
  periodoModo: CajaPeriodoModo = 'dia';
  fechaFiltro = '';
  mesFiltro = '';

  ventasVetHoy: VentaPorVeterinaria[] = [];
  ventasVetColumns = ['nombre', 'tickets', 'pagado', 'total'];
  cxcTotal = 0;
  cxcDeudores = 0;

  ingresosServicioColumns = ['label', 'count', 'total', 'pct'];
  displayedColumns = ['fecha', 'concepto', 'categoria', 'tipo', 'metodo', 'iva', 'monto', 'margen', 'acciones'];
  /** Celular: concepto (con fecha, categoría y método) · monto · acciones. */
  readonly columnasCajaMovil = ['concepto', 'monto', 'acciones'];
  esAngosto = typeof window !== 'undefined' && window.innerWidth < 700;
  /** Pestaña «Cobros y gastos»: qué mostrar (2026-10-26, fase 2). */
  filtroTipoCaja: 'todos' | 'ingreso' | 'egreso' = 'todos';
  readonly tiposCaja: ReadonlyArray<{ id: 'todos' | 'ingreso' | 'egreso'; label: string }> = [
    { id: 'todos', label: 'Todo' },
    { id: 'ingreso', label: 'Lo que entró' },
    { id: 'egreso', label: 'Gastos' },
  ];
  private cajaPeriodo: CajaMovimiento[] = [];

  get columnasCaja(): string[] {
    return this.esAngosto ? this.columnasCajaMovil : this.displayedColumns;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.esAngosto = window.innerWidth < 700;
  }

  cuentaTipoCaja(tipo: 'todos' | 'ingreso' | 'egreso'): number {
    return tipo === 'todos' ? this.cajaPeriodo.length : this.cajaPeriodo.filter((m) => m.tipo === tipo).length;
  }

  setFiltroTipoCaja(tipo: 'todos' | 'ingreso' | 'egreso'): void {
    this.filtroTipoCaja = tipo;
    this.dataSource.data = this.filtrarTipoCaja(this.cajaPeriodo);
    this.dataSource.paginator?.firstPage();
  }

  private filtrarTipoCaja(rows: CajaMovimiento[]): CajaMovimiento[] {
    return this.filtroTipoCaja === 'todos' ? rows : rows.filter((m) => m.tipo === this.filtroTipoCaja);
  }
  dataSource = new MatTableDataSource<CajaMovimiento>([]);
  plantillasColumns = ['nombre', 'tipo', 'costo', 'precio', 'margen', 'acciones'];
  plantillasDataSource = new MatTableDataSource<PlantillaCosto>([]);

  loading = true;
  loadingPlantillas = true;
  savingDefaults = false;
  /** Tarifas de peluquería (2026-10-26). */
  tarifasPeluForm!: FormGroup;
  savingTarifasPelu = false;
  readonly filasTarifaPelu = FILAS_TARIFA_PELUQUERIA;
  readonly filaTarifaPeluLabels = FILA_TARIFA_PELUQUERIA_LABELS;
  savingDefaultsPension = false;
  isAdmin = false;
  kpis: CajaDiaKpis = this.emptyKpis();
  chartResumen: CajaChartBar[] = [];
  chartEgresos: CajaEgresoDesglose[] = [];
  chartIngresosServicio: CajaIngresoDesglose[] = [];
  totalIngresosServicio = 0;
  ingresosServicioMax = 1;
  chartSerie: { fecha: string; ingresos: number; egresos: number; ganancia: number }[] = [];
  chartMax = 1;
  serieMax = 1;

  defaultsForm: FormGroup;
  defaultsPensionForm: FormGroup;
  readonly tamanosBanio = TAMANOS_PERRO_ORDEN;
  readonly tamanoLabels = TAMANO_PERRO_LABELS;
  readonly tamanosPension = TAMANOS_PENSION_ORDEN;
  readonly tamanoPensionLabels = TAMANO_PENSION_DEFAULT_LABELS;

  private todos: CajaMovimiento[] = [];
  private todosBanios: Banio[] = [];
  /** Baños/pensiones del periodo que no pasaron por caja (se muestran aparte, no como ingreso). */
  serviciosSinCaja: ServiciosSinCajaResumen = {
    pagadosFueraDeCaja: { total: 0, count: 0 },
    porCobrar: { total: 0, count: 0 },
  };
  private plantillas: PlantillaCosto[] = [];
  private todosPension: Array<{
    precio_total?: number;
    fecha_ingreso?: string;
    estado?: string;
    cajaMovimientoId?: string;
    activo?: boolean;
  }> = [];

  get plantillasBanio(): PlantillaCosto[] {
    return this.plantillas.filter(
      (p) => p.activo !== false && (p.tipoServicio === 'banio' || p.tipoServicio === 'corte')
    );
  }

  readonly categoriaLabels = CAJA_CATEGORIA_LABELS;
  readonly plantillaTipoLabels = PLANTILLA_TIPO_LABELS;

  constructor(
    private cajaService: CajaService,
    private plantillaService: PlantillaCostoService,
    private defaultsBanioService: DefaultsBanioService,
    private defaultsPensionService: DefaultsPensionService,
    private tarifasPeluqueriaService: TarifasPeluqueriaService,
    private baniosService: BaniosService,
    private pensionService: PensionService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    private logger: LoggerService,
    private authProfileService: AuthProfileService,
    private visitasService: VisitasService,
    private clientesService: ClientesService
  ) {
    this.fechaFiltro = this.cajaService.hoyLocalIsoDate();
    this.mesFiltro = this.cajaService.mesLocalIso();
    this.defaultsForm = this.buildDefaultsForm(emptyDefaultsBanio());
    this.tarifasPeluForm = this.buildTarifasPeluForm(tarifasPeluqueriaVacias());
    this.defaultsPensionForm = this.buildDefaultsPensionForm(emptyDefaultsPension());
  }

  ngOnInit(): void {
    this.authProfileService.getAccessibleModules().then((modules) => {
      this.isAdmin = modules.includes('usuarios');
    });
    this.cargar();
    this.cargarBanios();
    this.cargarPension();
    this.cargarPlantillas();
    this.cargarDefaultsBanio();
    this.cargarDefaultsPension();
    void this.cargarTarifasPelu();
    this.cargarVentasHoy();
    this.cargarCxc();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private emptyKpis(): CajaDiaKpis {
    return {
      totalIngresos: 0,
      totalEgresos: 0,
      neto: 0,
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      ivaDeclarado: 0,
      ivaNoDeclarado: 0,
      movimientosActivos: 0,
      totalCostosAsociados: 0,
      margenEstimado: 0,
      ingresosConCosto: 0,
      ingresosSinCosto: 0,
    };
  }

  cargarVentasHoy(): void {
    this.visitasService
      .getVisitas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.ventasVetHoy = agruparVentasPorVeterinaria(rows || [], this.cajaService.hoyLocalIsoDate());
        },
        error: (error) => {
          this.logger.error('Error al cargar ventas por veterinaria:', error);
          this.ventasVetHoy = [];
        },
      });
  }

  cargarCxc(): void {
    this.clientesService
      .getClientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          const r = resumenCxcClientes(rows || []);
          this.cxcTotal = r.total;
          this.cxcDeudores = r.deudores;
        },
        error: (error) => {
          this.logger.error('Error al cargar CxC:', error);
          this.cxcTotal = 0;
          this.cxcDeudores = 0;
        },
      });
  }

  cargarBanios(): void {
    this.baniosService
      .getBanios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.todosBanios = rows;
          this.aplicarFiltroPeriodo();
        },
        error: (error) => {
          this.logger.error('Error al cargar baños para ingresos:', error);
          this.todosBanios = [];
        },
      });
  }

  cargarPension(): void {
    this.pensionService
      .getEstancias()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.todosPension = rows || [];
          this.aplicarFiltroPeriodo();
        },
        error: (error) => {
          this.logger.error('Error al cargar pensión para ingresos:', error);
          this.todosPension = [];
        },
      });
  }

  cargar(): void {
    this.loading = true;
    this.cajaService
      .getMovimientos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.todos = rows;
          this.aplicarFiltroPeriodo();
          this.loading = false;
          setTimeout(() => {
            if (this.paginator) this.dataSource.paginator = this.paginator;
          }, 0);
        },
        error: (error) => {
          this.logger.error('Error al cargar caja:', error);
          this.loading = false;
          Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cargar caja'), 'error');
        },
      });
  }

  cargarPlantillas(): void {
    this.loadingPlantillas = true;
    this.plantillaService
      .getPlantillas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.plantillas = rows;
          this.plantillasDataSource.data = rows;
          this.loadingPlantillas = false;
        },
        error: (error) => {
          this.logger.error('Error al cargar plantillas:', error);
          this.plantillas = [];
          this.plantillasDataSource.data = [];
          this.loadingPlantillas = false;
        },
      });
  }

  get periodoValor(): string {
    if (this.periodoModo === 'mes') return this.mesFiltro;
    return this.fechaFiltro;
  }

  /** Periodo en palabras: «Hoy, lunes 26 de octubre», «Semana del 19 al 25 de octubre», «Octubre 2026». */
  get periodoLabel(): string {
    const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const parse = (iso: string) => {
      const [y, m, d] = String(iso || '').split('-').map(Number);
      return y && m && d ? new Date(y, m - 1, d) : null;
    };
    if (this.periodoModo === 'mes') {
      const [y, m] = String(this.mesFiltro || '').split('-').map(Number);
      const mes = MESES.at((m || 1) - 1) || '';
      return y ? `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${y}` : `Mes ${this.mesFiltro}`;
    }
    if (this.periodoModo === 'semana') {
      const r = this.cajaService.rangoPeriodo('semana', this.fechaFiltro);
      const a = r ? parse(r.desde) : null;
      const b = r ? parse(r.hasta) : null;
      if (a && b) {
        return a.getMonth() === b.getMonth()
          ? `Semana del ${a.getDate()} al ${b.getDate()} de ${MESES.at(b.getMonth())}`
          : `Semana del ${a.getDate()} de ${MESES.at(a.getMonth())} al ${b.getDate()} de ${MESES.at(b.getMonth())}`;
      }
      return `Semana ${this.fechaFiltro}`;
    }
    const d = parse(this.fechaFiltro);
    if (!d) return `Día ${this.fechaFiltro}`;
    const texto = `${DIAS.at(d.getDay())} ${d.getDate()} de ${MESES.at(d.getMonth())}`;
    return this.fechaFiltro === this.cajaService.hoyLocalIsoDate() ? `Hoy, ${texto}` : texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  aplicarFiltroPeriodo(): void {
    const valor = this.periodoValor || this.cajaService.hoyLocalIsoDate();
    const filtrados = this.cajaService.filtrarPorPeriodo(this.todos, this.periodoModo, valor);
    this.cajaPeriodo = filtrados;
    this.dataSource.data = this.filtrarTipoCaja(filtrados);
    this.kpis = this.cajaService.calcularKpisPeriodo(this.todos, this.periodoModo, valor);
    this.chartResumen = this.cajaService.chartResumen(this.kpis);
    this.chartEgresos = this.cajaService.desgloseEgresos(this.todos, this.periodoModo, valor);
    // Solo lo que entró por caja (2026-10-26). Baños/pensiones sin caja van aparte en `serviciosSinCaja`.
    this.chartIngresosServicio = this.cajaService.desgloseIngresosPorServicio(this.todos, this.periodoModo, valor);
    this.serviciosSinCaja = this.cajaService.serviciosSinCajaDelPeriodo(
      this.periodoModo,
      valor,
      this.todosBanios as unknown as BanioIngresoRefuerzo[],
      this.todosPension
    );
    this.totalIngresosServicio = this.chartIngresosServicio.reduce((acc, row) => acc + (Number(row.total) || 0), 0);
    this.ingresosServicioMax = Math.max(1, ...this.chartIngresosServicio.map((row) => row.total));
    this.chartSerie = this.cajaService.serieDiaria(this.todos, this.periodoModo, valor);
    this.chartMax = Math.max(
      1,
      ...this.chartResumen.map((b) => Math.abs(b.value)),
      ...this.chartEgresos.map((e) => e.total)
    );
    this.serieMax = Math.max(1, ...this.chartSerie.flatMap((d) => [d.ingresos, d.egresos, Math.abs(d.ganancia)]));
    // El paginador aparece con *ngIf cuando hay datos: enlazarlo en el siguiente tick (antes mostraba «0 of 0»).
    setTimeout(() => {
      if (this.paginator && this.dataSource.paginator !== this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      this.dataSource.paginator?.firstPage();
    });
  }

  onPeriodoModoChange(modo: CajaPeriodoModo): void {
    this.periodoModo = modo;
    this.aplicarFiltroPeriodo();
  }

  onFechaFiltroChange(iso: string | null): void {
    this.fechaFiltro = String(iso || '').trim() || this.cajaService.hoyLocalIsoDate();
    this.aplicarFiltroPeriodo();
  }

  onMesChange(event: Event): void {
    this.mesFiltro = (event.target as HTMLInputElement).value;
    this.aplicarFiltroPeriodo();
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = value;
  }

  /** Altura relativa de barra (0–100%). */
  barPct(value: number, max = this.chartMax): number {
    if (!max) return 0;
    return Math.min(100, Math.round((Math.abs(value) / max) * 100));
  }

  formatChartFecha(iso: string): string {
    if (!iso || iso.length < 10) return iso;
    return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
  }

  abrirCorteCaja(): void {
    this.dialog.open(CajaCorteDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '520px',
      data: { fecha: this.fechaFiltro, movimientos: this.todos },
    });
  }

  nuevoMovimiento(): void {
    const ref = this.dialog.open(CajaMovimientoDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '640px',
      disableClose: true,
      // Aquí se registran gastos; los cobros van en Cobrar (2026-10-26). El tipo se puede cambiar en el diálogo.
      data: { fechaDefault: this.fechaFiltro, tipo: 'egreso' },
    });
    ref
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        /* snapshot refresca */
      });
  }

  nuevaPlantilla(): void {
    const ref = this.dialog.open(PlantillaCostoDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '720px',
      maxWidth: '96vw',
      disableClose: true,
      data: {},
    });
    ref
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        /* snapshot refresca */
      });
  }

  editarPlantilla(p: PlantillaCosto): void {
    const ref = this.dialog.open(PlantillaCostoDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '720px',
      maxWidth: '96vw',
      disableClose: true,
      data: { plantilla: p },
    });
    ref
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        /* snapshot refresca */
      });
  }

  exportarCsv(): void {
    const rows = this.dataSource.filteredData?.length ? this.dataSource.filteredData : this.dataSource.data;
    if (!rows.length) {
      Swal.fire('Sin datos', 'No hay movimientos para exportar en este período.', 'info');
      return;
    }
    const header = [
      'fecha',
      'concepto',
      'tipo',
      'categoria',
      'metodo',
      'iva',
      'monto',
      'costoAsociado',
      'margenEstimado',
      'notas',
      'banioId',
    ];
    const escape = (v: unknown) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      header.join(','),
      ...rows.map((m) =>
        [
          m.fecha,
          m.concepto,
          m.tipo,
          m.categoria || '',
          this.labelMetodo(m),
          m.ivaDeclarado ? 'declarado' : 'no_declarado',
          Number(m.monto).toFixed(2),
          m.costoAsociado != null ? Number(m.costoAsociado).toFixed(2) : '',
          m.margenEstimado != null ? Number(m.margenEstimado).toFixed(2) : '',
          m.notas || '',
          m.banioId || '',
        ]
          .map(escape)
          .join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caja-${this.periodoValor || 'periodo'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async borrar(mov: CajaMovimiento): Promise<void> {
    if (!mov.id) return;
    const result = await Swal.fire({
      title: '¿Borrar este movimiento?',
      text: `${mov.concepto} · $${Number(mov.monto).toFixed(2)}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });
    if (!result.isConfirmed) return;

    this.loadingService.show(LOADING_MESSAGES.deleting);
    try {
      await this.cajaService.bajaLogicaMovimiento(mov.id);
      Swal.fire({
        icon: 'success',
        title: 'Borrado',
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'borrar movimiento de caja'), 'error');
    } finally {
      this.loadingService.hide();
    }
  }

  async borrarPlantilla(p: PlantillaCosto): Promise<void> {
    if (!p.id) return;
    const result = await Swal.fire({
      title: '¿Borrar esta plantilla?',
      text: p.nombre,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });
    if (!result.isConfirmed) return;

    this.loadingService.show(LOADING_MESSAGES.deleting);
    try {
      await this.plantillaService.bajaLogicaPlantilla(p.id);
      Swal.fire({
        icon: 'success',
        title: 'Borrado',
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'borrar plantilla de costo'), 'error');
    } finally {
      this.loadingService.hide();
    }
  }

  labelMetodo(m: CajaMovimiento): string {
    const map: Record<string, string> = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transferencia: 'Transferencia',
    };
    return map[m.metodoPago] || m.metodoPago;
  }

  labelCategoria(cat?: CajaCategoria): string {
    if (!cat) return 'Sin categoría';
    return this.categoriaLabels[cat] || cat;
  }

  formatMoney(n: number): string {
    return `$${(Number(n) || 0).toFixed(2)}`;
  }

  margenPlantilla(p: PlantillaCosto): string {
    if (p.precioSugeridoCliente == null) return '—';
    const m = Number(p.precioSugeridoCliente) - Number(p.costoTotalEstimado || 0);
    return this.formatMoney(m);
  }

  private buildDefaultsForm(data: DefaultsBanioPorTamano): FormGroup {
    const row = (t: TamanoPerroBanio) =>
      this.fb.group({
        costoDefault: [data[t]?.costoDefault ?? 0, [Validators.min(0)]],
        precioSugerido: [data[t]?.precioSugerido ?? null, [Validators.min(0)]],
        plantillaCostoId: [data[t]?.plantillaCostoId ?? ''],
      });
    return this.fb.group({
      pequeno: row('pequeno'),
      mediano: row('mediano'),
      grande: row('grande'),
      xl: row('xl'),
    });
  }

  private buildDefaultsPensionForm(data: DefaultsPensionPorTamano): FormGroup {
    const row = (t: TamanoMascotaPensionDefault) =>
      this.fb.group({
        precioDia: [data[t]?.precioDia ?? 0, [Validators.min(0)]],
        costoDia: [data[t]?.costoDia ?? null, [Validators.min(0)]],
        productoComidaId: [data[t]?.productoComidaId ?? ''],
        cantidadComidaPorDia: [data[t]?.cantidadComidaPorDia ?? null, [Validators.min(0)]],
      });
    return this.fb.group({
      pequeno: row('pequeno'),
      mediano: row('mediano'),
      grande: row('grande'),
      gigante: row('gigante'),
    });
  }

  private buildTarifasPeluForm(t: TarifasPeluqueria): FormGroup {
    const grupo: Record<string, FormGroup> = {};
    for (const f of FILAS_TARIFA_PELUQUERIA) {
      const fila = t.filas[f] || {};
      grupo[f] = this.fb.group({
        corto: [fila.corto ?? null, [Validators.min(0)]],
        largo: [fila.largo ?? null, [Validators.min(0)]],
        conCorte: [f === 'gato' ? null : (fila.conCorte ?? null), [Validators.min(0)]],
      });
    }
    return this.fb.group(grupo);
  }

  async cargarTarifasPelu(): Promise<void> {
    try {
      this.tarifasPeluForm = this.buildTarifasPeluForm(await this.tarifasPeluqueriaService.getOnce());
    } catch (err) {
      this.logger.error('Error tarifas peluquería:', err);
    }
  }

  async guardarTarifasPelu(): Promise<void> {
    if (this.tarifasPeluForm.invalid) {
      this.tarifasPeluForm.markAllAsTouched();
      return;
    }
    this.savingTarifasPelu = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const raw = this.tarifasPeluForm.getRawValue() as Record<FilaTarifaPeluqueria, Record<string, unknown>>;
      await this.tarifasPeluqueriaService.guardar({ filas: raw as TarifasPeluqueria['filas'] });
      Swal.fire({ icon: 'success', title: 'Tarifas de peluquería guardadas', timer: 1600, showConfirmButton: false });
    } catch (error) {
      this.logger.error('Error al guardar tarifas peluquería:', error);
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar tarifas de peluquería'), 'error');
    } finally {
      this.loadingService.hide();
      this.savingTarifasPelu = false;
    }
  }

  cargarDefaultsBanio(): void {
    this.defaultsBanioService
      .getDefaults()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (d) => {
          this.defaultsForm = this.buildDefaultsForm(d);
        },
        error: (err) => {
          this.logger.error('Error defaults baño:', err);
          this.defaultsForm = this.buildDefaultsForm(emptyDefaultsBanio());
        },
      });
  }

  cargarDefaultsPension(): void {
    this.defaultsPensionService
      .getDefaults()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (d) => {
          this.defaultsPensionForm = this.buildDefaultsPensionForm(d);
        },
        error: (err) => {
          this.logger.error('Error defaults pensión:', err);
          this.defaultsPensionForm = this.buildDefaultsPensionForm(emptyDefaultsPension());
        },
      });
  }

  async guardarDefaultsBanio(): Promise<void> {
    if (this.defaultsForm.invalid) {
      this.defaultsForm.markAllAsTouched();
      return;
    }
    this.savingDefaults = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const raw = this.defaultsForm.getRawValue();
      const payload: DefaultsBanioPorTamano = {
        pequeno: {
          costoDefault: Number(raw.pequeno.costoDefault) || 0,
          precioSugerido:
            raw.pequeno.precioSugerido != null && raw.pequeno.precioSugerido !== ''
              ? Number(raw.pequeno.precioSugerido)
              : undefined,
          plantillaCostoId: raw.pequeno.plantillaCostoId || undefined,
        },
        mediano: {
          costoDefault: Number(raw.mediano.costoDefault) || 0,
          precioSugerido:
            raw.mediano.precioSugerido != null && raw.mediano.precioSugerido !== ''
              ? Number(raw.mediano.precioSugerido)
              : undefined,
          plantillaCostoId: raw.mediano.plantillaCostoId || undefined,
        },
        grande: {
          costoDefault: Number(raw.grande.costoDefault) || 0,
          precioSugerido:
            raw.grande.precioSugerido != null && raw.grande.precioSugerido !== ''
              ? Number(raw.grande.precioSugerido)
              : undefined,
          plantillaCostoId: raw.grande.plantillaCostoId || undefined,
        },
        xl: {
          costoDefault: Number(raw.xl.costoDefault) || 0,
          precioSugerido:
            raw.xl.precioSugerido != null && raw.xl.precioSugerido !== '' ? Number(raw.xl.precioSugerido) : undefined,
          plantillaCostoId: raw.xl.plantillaCostoId || undefined,
        },
      };
      await this.defaultsBanioService.guardarDefaults(payload);
      Swal.fire({
        icon: 'success',
        title: 'Defaults baño guardados',
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      this.logger.error('Error al guardar defaults baño:', error);
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar defaults baño'), 'error');
    } finally {
      this.loadingService.hide();
      this.savingDefaults = false;
    }
  }

  async guardarDefaultsPension(): Promise<void> {
    if (this.defaultsPensionForm.invalid) {
      this.defaultsPensionForm.markAllAsTouched();
      return;
    }
    this.savingDefaultsPension = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const raw = this.defaultsPensionForm.getRawValue();
      const row = (t: TamanoMascotaPensionDefault) => {
        const r = raw[t];
        return {
          precioDia: Number(r.precioDia) || 0,
          costoDia: r.costoDia != null && r.costoDia !== '' ? Number(r.costoDia) : undefined,
          productoComidaId: r.productoComidaId ? String(r.productoComidaId).trim() : undefined,
          cantidadComidaPorDia:
            r.cantidadComidaPorDia != null && r.cantidadComidaPorDia !== ''
              ? Number(r.cantidadComidaPorDia)
              : undefined,
        };
      };
      const payload: DefaultsPensionPorTamano = {
        pequeno: row('pequeno'),
        mediano: row('mediano'),
        grande: row('grande'),
        gigante: row('gigante'),
      };
      await this.defaultsPensionService.guardarDefaults(payload);
      Swal.fire({
        icon: 'success',
        title: 'Defaults pensión guardados',
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      this.logger.error('Error al guardar defaults pensión:', error);
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar defaults pensión'), 'error');
    } finally {
      this.loadingService.hide();
      this.savingDefaultsPension = false;
    }
  }
}
