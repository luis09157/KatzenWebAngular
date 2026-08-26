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
import { CajaMovimientoDialogComponent } from '../finanzas/caja-movimiento-dialog.component';
import {
  ESTADO_PENSION_LABELS,
  PensionEstancia,
  TAMANO_PENSION_LABELS
} from './pension.models';
import { PensionDialogComponent } from './pension-dialog.component';
import { PensionService } from './pension.service';

@Component({
  selector: 'app-pension',
  templateUrl: './pension.component.html',
  styleUrls: ['./pension.component.scss']
})
export class PensionComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  readonly pageSize = 50;

  displayedColumns = ['paciente', 'fechas', 'tamano', 'precio', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<PensionEstancia>([]);
  loading = true;
  menuContext: PensionEstancia | null = null;

  readonly estadoLabels = ESTADO_PENSION_LABELS;
  readonly tamanoLabels = TAMANO_PENSION_LABELS;

  totalActivas = 0;
  totalReservadas = 0;
  valorEstimado = 0;

  constructor(
    private pensionService: PensionService,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    private logger: LoggerService
  ) {}

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
    this.pensionService
      .getEstancias()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.dataSource.data = rows;
          this.totalActivas = rows.filter((r) => r.estado === 'activa').length;
          this.totalReservadas = rows.filter((r) => r.estado === 'reservada').length;
          this.valorEstimado = rows
            .filter((r) => r.estado === 'activa' || r.estado === 'reservada')
            .reduce((sum, r) => sum + (Number(r.precio_total) || 0), 0);
          this.loading = false;
          setTimeout(() => {
            if (this.paginator) this.dataSource.paginator = this.paginator;
          }, 0);
        },
        error: (error) => {
          this.logger.error('Error al cargar pensión:', error);
          this.loading = false;
          Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cargar pensión'), 'error');
        }
      });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  nueva(): void {
    const ref = this.dialog.open(PensionDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '720px',
      disableClose: true,
      data: {}
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe();
  }

  editar(estancia: PensionEstancia): void {
    const ref = this.dialog.open(PensionDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '720px',
      disableClose: true,
      data: { estancia }
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe();
  }

  registrarEnCaja(estancia: PensionEstancia): void {
    if (!estancia?.id) return;
    if (estancia.cajaMovimientoId) {
      Swal.fire({
        icon: 'info',
        title: 'Ya vinculado a caja',
        text: `Esta estancia ya tiene movimiento ${estancia.cajaMovimientoId}.`
      });
      return;
    }
    const ref = this.dialog.open(CajaMovimientoDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '640px',
      disableClose: true,
      data: {
        fechaDefault: estancia.fecha_ingreso,
        concepto: `Pensión · ${estancia.paciente || 'mascota'} · ${estancia.cliente || ''}`.trim(),
        monto: Number(estancia.precio_total) || Number(estancia.precio_dia) || 0,
        metodoPago: 'efectivo' as const,
        categoria: 'pension' as const,
        costoAsociado:
          estancia.costo_total_estimado != null
            ? Number(estancia.costo_total_estimado)
            : undefined,
        notas: estancia.notas || ''
      }
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(async (result) => {
      const id = result?.movimientoId as string | undefined;
      if (!result?.ok || !id) return;
      this.loadingService.show(LOADING_MESSAGES.updating);
      try {
        await this.pensionService.actualizarEstancia(estancia.id!, {
          cajaMovimientoId: id,
          estado: 'finalizada'
        });
      } catch (error) {
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'vincular pensión a caja'), 'error');
      } finally {
        this.loadingService.hide();
      }
    });
  }

  async borrar(estancia: PensionEstancia): Promise<void> {
    if (!estancia.id) return;
    const confirm = await Swal.fire({
      title: '¿Borrar esta estancia?',
      text: `${estancia.paciente || 'Paciente'} · ${estancia.fecha_ingreso}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    });
    if (!confirm.isConfirmed) return;
    this.loadingService.show(LOADING_MESSAGES.deleting);
    try {
      await this.pensionService.bajaLogicaEstancia(estancia.id);
      Swal.fire({ icon: 'success', title: 'Borrado', timer: 1400, showConfirmButton: false });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'borrar pensión'), 'error');
    } finally {
      this.loadingService.hide();
    }
  }

  formatMoney(n: number | undefined): string {
    return `$${(Number(n) || 0).toFixed(0)}`;
  }
}
