import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ADMIN_DIALOG_FORM } from '../core/config/admin-ui.config';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { LoggerService } from '../core/logger.service';
import { Visita, VISITA_ESTADO_LABELS } from './visitas.models';
import { VisitasService } from './visitas.service';
import { calcularVisitaKpis, hoyLocalIsoDate } from './visitas.util';
import { VisitaDialogComponent } from './visita-dialog.component';

@Component({
  selector: 'app-visitas',
  templateUrl: './visitas.component.html',
  styleUrls: ['./visitas.component.scss']
})
export class VisitasComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  readonly pageSize = 50;

  displayedColumns = ['fecha', 'cliente', 'totales', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Visita>([]);
  loading = true;
  soloDeudas = false;
  private allRows: Visita[] = [];

  visitasHoy = 0;
  abiertas = 0;
  parciales = 0;
  saldoPorCobrar = 0;
  cerradasHoy = 0;

  readonly estadoLabels = VISITA_ESTADO_LABELS;

  constructor(
    private visitasService: VisitasService,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.dataSource.filterPredicate = (row, filter) => {
      const q = filter.trim().toLowerCase();
      if (!q) return true;
      return (
        String(row.cliente || '').toLowerCase().includes(q) ||
        String(row.paciente || '').toLowerCase().includes(q) ||
        String(row.fecha || '').includes(q) ||
        String(row.estado || '').toLowerCase().includes(q)
      );
    };
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
    this.visitasService
      .getVisitas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.allRows = rows || [];
          const kpis = calcularVisitaKpis(this.allRows, hoyLocalIsoDate());
          this.visitasHoy = kpis.visitasHoy;
          this.abiertas = kpis.abiertas;
          this.parciales = kpis.parciales;
          this.saldoPorCobrar = kpis.saldoPorCobrar;
          this.cerradasHoy = kpis.cerradasHoy;
          this.applyDeudasFilter();
          this.loading = false;
          setTimeout(() => {
            if (this.paginator) this.dataSource.paginator = this.paginator;
          }, 0);
        },
        error: (error) => {
          this.logger.error('Error al cargar visitas:', error);
          this.loading = false;
          Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cargar visitas'), 'error');
        }
      });
  }

  applyDeudasFilter(): void {
    const base = this.soloDeudas
      ? this.allRows.filter((v) => (Number(v.saldo) || 0) > 0)
      : this.allRows;
    this.dataSource.data = base;
  }

  toggleDeudas(): void {
    this.soloDeudas = !this.soloDeudas;
    this.applyDeudasFilter();
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  formatMoney(n: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0);
  }

  estadoClass(estado: string): string {
    switch (estado) {
      case 'cerrada':
        return 'activo';
      case 'parcial':
        return 'warning';
      case 'cancelada':
        return 'inactivo';
      default:
        return 'pendiente';
    }
  }

  nueva(): void {
    const ref = this.dialog.open(VisitaDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: {}
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      if (r) this.cargar();
    });
  }

  editar(row: Visita): void {
    const ref = this.dialog.open(VisitaDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: { visita: row }
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      if (r) this.cargar();
    });
  }

  async borrar(row: Visita): Promise<void> {
    if (!row.id) return;
    const conf = await Swal.fire({
      icon: 'warning',
      title: '¿Borrar visita?',
      text: 'Se cancela el ticket. El historial de caja no se elimina.',
      showCancelButton: true,
      confirmButtonText: 'Borrar',
      cancelButtonText: 'Cancelar'
    });
    if (!conf.isConfirmed) return;
    this.loadingService.show(LOADING_MESSAGES.deleting);
    try {
      await this.visitasService.bajaLogicaVisita(row.id);
      Swal.fire({ icon: 'success', title: 'Visita borrada', timer: 1400, showConfirmButton: false });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'borrar visita'), 'error');
    } finally {
      this.loadingService.hide();
    }
  }
}
