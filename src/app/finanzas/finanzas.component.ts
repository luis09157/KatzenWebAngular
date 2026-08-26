import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
import { PlantillaCostoDialogComponent } from './plantilla-costo-dialog.component';
import { CajaService } from './caja.service';
import { PlantillaCostoService } from './plantilla-costo.service';
import { DefaultsBanioService } from './defaults-banio.service';
import {
  DefaultsBanioPorTamano,
  TAMANO_PERRO_LABELS,
  TAMANOS_PERRO_ORDEN,
  TamanoPerroBanio,
  emptyDefaultsBanio
} from './defaults-banio.models';
import {
  CAJA_CATEGORIA_LABELS,
  CajaCategoria,
  CajaDiaKpis,
  CajaMovimiento,
  CajaPeriodoModo
} from './caja.models';
import { PlantillaCosto, PLANTILLA_TIPO_LABELS } from './plantilla-costo.models';

@Component({
  selector: 'app-finanzas',
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.scss']
})
export class FinanzasComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  readonly pageSize = 50;

  selectedTab = 0;
  periodoModo: CajaPeriodoModo = 'dia';
  fechaFiltro = '';
  mesFiltro = '';

  displayedColumns = ['fecha', 'concepto', 'categoria', 'tipo', 'metodo', 'iva', 'monto', 'margen', 'acciones'];
  dataSource = new MatTableDataSource<CajaMovimiento>([]);
  plantillasColumns = ['nombre', 'tipo', 'costo', 'precio', 'margen', 'acciones'];
  plantillasDataSource = new MatTableDataSource<PlantillaCosto>([]);

  loading = true;
  loadingPlantillas = true;
  savingDefaults = false;
  kpis: CajaDiaKpis = this.emptyKpis();
  defaultsForm: FormGroup;
  readonly tamanosBanio = TAMANOS_PERRO_ORDEN;
  readonly tamanoLabels = TAMANO_PERRO_LABELS;

  private todos: CajaMovimiento[] = [];
  private plantillas: PlantillaCosto[] = [];

  readonly categoriaLabels = CAJA_CATEGORIA_LABELS;
  readonly plantillaTipoLabels = PLANTILLA_TIPO_LABELS;

  constructor(
    private cajaService: CajaService,
    private plantillaService: PlantillaCostoService,
    private defaultsBanioService: DefaultsBanioService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    private logger: LoggerService
  ) {
    this.fechaFiltro = this.cajaService.hoyLocalIsoDate();
    this.mesFiltro = this.cajaService.mesLocalIso();
    this.defaultsForm = this.buildDefaultsForm(emptyDefaultsBanio());
  }

  ngOnInit(): void {
    this.cargar();
    this.cargarPlantillas();
    this.cargarDefaultsBanio();
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
      ingresosSinCosto: 0
    };
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
        }
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
          // Sin Swal bloqueante: rules de Finanzas pueden no estar desplegadas aún.
        }
      });
  }

  get periodoValor(): string {
    return this.periodoModo === 'mes' ? this.mesFiltro : this.fechaFiltro;
  }

  get periodoLabel(): string {
    return this.periodoModo === 'mes' ? `Mes ${this.mesFiltro}` : `Día ${this.fechaFiltro}`;
  }

  aplicarFiltroPeriodo(): void {
    const valor = this.periodoValor || this.cajaService.hoyLocalIsoDate();
    const filtrados = this.cajaService.filtrarPorPeriodo(this.todos, this.periodoModo, valor);
    this.dataSource.data = filtrados;
    this.kpis = this.cajaService.calcularKpisPeriodo(this.todos, this.periodoModo, valor);
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  onPeriodoModoChange(modo: CajaPeriodoModo): void {
    this.periodoModo = modo;
    this.aplicarFiltroPeriodo();
  }

  onFechaChange(event: Event): void {
    this.fechaFiltro = (event.target as HTMLInputElement).value;
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

  nuevoMovimiento(): void {
    const ref = this.dialog.open(CajaMovimientoDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '640px',
      disableClose: true,
      data: { fechaDefault: this.fechaFiltro }
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {
      /* snapshot refresca */
    });
  }

  nuevaPlantilla(): void {
    const ref = this.dialog.open(PlantillaCostoDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '720px',
      maxWidth: '96vw',
      disableClose: true,
      data: {}
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {
      /* snapshot refresca */
    });
  }

  editarPlantilla(p: PlantillaCosto): void {
    const ref = this.dialog.open(PlantillaCostoDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '720px',
      maxWidth: '96vw',
      disableClose: true,
      data: { plantilla: p }
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {
      /* snapshot refresca */
    });
  }

  exportarCsv(): void {
    const rows = this.dataSource.filteredData?.length
      ? this.dataSource.filteredData
      : this.dataSource.data;
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
      'banioId'
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
          m.banioId || ''
        ]
          .map(escape)
          .join(',')
      )
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
      confirmButtonColor: '#d33'
    });
    if (!result.isConfirmed) return;

    this.loadingService.show(LOADING_MESSAGES.deleting);
    try {
      await this.cajaService.bajaLogicaMovimiento(mov.id);
      Swal.fire({
        icon: 'success',
        title: 'Borrado',
        timer: 1600,
        showConfirmButton: false
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
      confirmButtonColor: '#d33'
    });
    if (!result.isConfirmed) return;

    this.loadingService.show(LOADING_MESSAGES.deleting);
    try {
      await this.plantillaService.bajaLogicaPlantilla(p.id);
      Swal.fire({
        icon: 'success',
        title: 'Borrado',
        timer: 1600,
        showConfirmButton: false
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
      transferencia: 'Transferencia'
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
        precioSugerido: [data[t]?.precioSugerido ?? null, [Validators.min(0)]]
      });
    return this.fb.group({
      pequeno: row('pequeno'),
      mediano: row('mediano'),
      grande: row('grande')
    });
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
        }
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
              : undefined
        },
        mediano: {
          costoDefault: Number(raw.mediano.costoDefault) || 0,
          precioSugerido:
            raw.mediano.precioSugerido != null && raw.mediano.precioSugerido !== ''
              ? Number(raw.mediano.precioSugerido)
              : undefined
        },
        grande: {
          costoDefault: Number(raw.grande.costoDefault) || 0,
          precioSugerido:
            raw.grande.precioSugerido != null && raw.grande.precioSugerido !== ''
              ? Number(raw.grande.precioSugerido)
              : undefined
        }
      };
      await this.defaultsBanioService.guardarDefaults(payload);
      Swal.fire({
        icon: 'success',
        title: 'Defaults guardados',
        timer: 1600,
        showConfirmButton: false
      });
    } catch (error) {
      this.logger.error('Error al guardar defaults baño:', error);
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar defaults baño'), 'error');
    } finally {
      this.loadingService.hide();
      this.savingDefaults = false;
    }
  }
}
