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
import {
  Consentimiento,
  CONSENTIMIENTO_ESTADO_LABELS,
  CONSENTIMIENTO_TIPO_LABELS
} from './consentimientos.models';
import { ConsentimientosService } from './consentimientos.service';
import { calcularConsentimientoKpis } from './consentimientos.util';
import { ConsentimientoDialogComponent } from './consentimiento-dialog.component';

@Component({
  selector: 'app-consentimientos',
  templateUrl: './consentimientos.component.html',
  styleUrls: ['./consentimientos.component.scss']
})
export class ConsentimientosComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  readonly pageSize = 50;

  displayedColumns = ['fecha', 'paciente', 'tipo', 'firmado', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Consentimiento>([]);
  loading = true;

  total = 0;
  vigentes = 0;
  delMes = 0;
  revocados = 0;

  readonly tipoLabels = CONSENTIMIENTO_TIPO_LABELS;
  readonly estadoLabels = CONSENTIMIENTO_ESTADO_LABELS;

  constructor(
    private service: ConsentimientosService,
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
        String(row.firmado_por || '').toLowerCase().includes(q) ||
        String(row.tipo || '').toLowerCase().includes(q) ||
        String(this.tipoLabels[row.tipo] || '').toLowerCase().includes(q)
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
    this.service
      .getConsentimientos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          const list = rows || [];
          const kpis = calcularConsentimientoKpis(list);
          this.total = kpis.total;
          this.vigentes = kpis.vigentes;
          this.delMes = kpis.delMes;
          this.revocados = kpis.revocados;
          this.dataSource.data = list;
          this.loading = false;
          setTimeout(() => {
            if (this.paginator) this.dataSource.paginator = this.paginator;
          }, 0);
        },
        error: (error) => {
          this.logger.error('Error al cargar consentimientos:', error);
          this.loading = false;
          Swal.fire(
            'Error',
            this.errorMessages.getUserMessage(error, 'cargar consentimientos'),
            'error'
          );
        }
      });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  estadoClass(estado: string): string {
    return estado === 'vigente' ? 'activo' : 'inactivo';
  }

  nuevo(): void {
    const ref = this.dialog.open(ConsentimientoDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: {}
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      if (r) this.cargar();
    });
  }

  editar(row: Consentimiento): void {
    const ref = this.dialog.open(ConsentimientoDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: { consentimiento: row }
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      if (r) this.cargar();
    });
  }

  async borrar(row: Consentimiento): Promise<void> {
    if (!row.id) return;
    const conf = await Swal.fire({
      icon: 'warning',
      title: '¿Borrar consentimiento?',
      text: 'Se marca como revocado y deja de mostrarse en la lista activa.',
      showCancelButton: true,
      confirmButtonText: 'Borrar',
      cancelButtonText: 'Cancelar'
    });
    if (!conf.isConfirmed) return;
    this.loadingService.show(LOADING_MESSAGES.deleting);
    try {
      await this.service.bajaLogica(row.id);
      Swal.fire({
        icon: 'success',
        title: 'Consentimiento borrado',
        timer: 1400,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire(
        'Error',
        this.errorMessages.getUserMessage(error, 'borrar consentimiento'),
        'error'
      );
    } finally {
      this.loadingService.hide();
    }
  }
}
