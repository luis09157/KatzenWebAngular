import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
import { CajaService } from './caja.service';
import { CajaDiaKpis, CajaMovimiento } from './caja.models';

@Component({
  selector: 'app-finanzas',
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.scss']
})
export class FinanzasComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  readonly pageSize = 50;

  displayedColumns = ['fecha', 'concepto', 'tipo', 'metodo', 'iva', 'monto', 'acciones'];
  dataSource = new MatTableDataSource<CajaMovimiento>([]);
  loading = true;
  fechaFiltro = '';
  kpis: CajaDiaKpis = {
    totalIngresos: 0,
    totalEgresos: 0,
    neto: 0,
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0,
    ivaDeclarado: 0,
    ivaNoDeclarado: 0,
    movimientosActivos: 0
  };

  private todos: CajaMovimiento[] = [];

  constructor(
    private cajaService: CajaService,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    private logger: LoggerService
  ) {
    this.fechaFiltro = this.cajaService.hoyLocalIsoDate();
  }

  ngOnInit(): void {
    this.cargar();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(): void {
    this.loading = true;
    this.cajaService
      .getMovimientos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.todos = rows;
          this.aplicarFiltroFecha();
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

  aplicarFiltroFecha(): void {
    const fecha = this.fechaFiltro || this.cajaService.hoyLocalIsoDate();
    const filtrados = this.todos.filter((m) => m.fecha === fecha);
    this.dataSource.data = filtrados;
    this.kpis = this.cajaService.calcularKpisDia(this.todos, fecha);
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  onFechaChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.fechaFiltro = value;
    this.aplicarFiltroFecha();
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = value;
  }

  nuevoMovimiento(): void {
    const ref = this.dialog.open(CajaMovimientoDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '560px',
      disableClose: true,
      data: { fechaDefault: this.fechaFiltro }
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((_ok) => {
      // RTDB snapshot refresca lista
    });
  }

  exportarCsv(): void {
    const rows = this.dataSource.filteredData?.length
      ? this.dataSource.filteredData
      : this.dataSource.data;
    if (!rows.length) {
      Swal.fire('Sin datos', 'No hay movimientos para exportar en esta fecha.', 'info');
      return;
    }
    const header = ['fecha', 'concepto', 'tipo', 'metodo', 'iva', 'monto', 'notas', 'banioId'];
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
          this.labelMetodo(m),
          m.ivaDeclarado ? 'declarado' : 'no_declarado',
          Number(m.monto).toFixed(2),
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
    a.download = `caja-${this.fechaFiltro || 'dia'}.csv`;
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

  labelMetodo(m: CajaMovimiento): string {
    const map: Record<string, string> = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transferencia: 'Transferencia'
    };
    return map[m.metodoPago] || m.metodoPago;
  }

  formatMoney(n: number): string {
    return `$${(Number(n) || 0).toFixed(2)}`;
  }
}
