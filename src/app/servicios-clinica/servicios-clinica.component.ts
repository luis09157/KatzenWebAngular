import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { ServicioClinica, TIPO_SERVICIO_CLINICA_LABELS } from './servicios-clinica.models';
import { ServicioClinicaDialogComponent } from './servicio-clinica-dialog.component';
import { ServiciosClinicaService } from './servicios-clinica.service';
import {
  COPY_BANIO_EN_FINANZAS,
  labelTipoServicioClinica
} from './servicios-clinica.util';
import { desglosarPrecioIvaIncluido } from '../core/utils/precio-margen.util';

@Component({
  selector: 'app-servicios-clinica',
  templateUrl: './servicios-clinica.component.html',
  styleUrls: ['./servicios-clinica.component.scss']
})
export class ServiciosClinicaComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  readonly pageSize = 50;

  displayedColumns = ['nombre', 'tipo', 'costo', 'precio', 'iva', 'ganancia', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<ServicioClinica>([]);
  loading = true;
  readonly tipoLabels = TIPO_SERVICIO_CLINICA_LABELS;
  readonly hintBanio = COPY_BANIO_EN_FINANZAS;
  readonly hintIva =
    'El precio al público incluye IVA si está marcado. El costo es lo que te cuesta a ti. La ganancia es venta neta − costo.';

  totalActivos = 0;
  totalConsultas = 0;
  totalDiagnosticos = 0;
  totalDomicilios = 0;

  constructor(
    private servicios: ServiciosClinicaService,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    private logger: LoggerService
  ) {
    this.dataSource.filterPredicate = (row, filter) => {
      const q = (filter || '').trim().toLowerCase();
      if (!q) return true;
      const blob = `${row.nombre || ''} ${labelTipoServicioClinica(row.tipo)} ${row.notas || ''}`.toLowerCase();
      return blob.includes(q);
    };
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
    this.servicios
      .getServicios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.dataSource.data = rows;
          const visibles = rows.filter((r) => r.activo !== false);
          this.totalActivos = visibles.length;
          this.totalConsultas = visibles.filter((r) => r.tipo === 'consulta').length;
          this.totalDiagnosticos = visibles.filter((r) => r.tipo === 'diagnostico').length;
          this.totalDomicilios = visibles.filter((r) => r.tipo === 'domicilio').length;
          this.loading = false;
          setTimeout(() => {
            if (this.paginator) this.dataSource.paginator = this.paginator;
          }, 0);
        },
        error: (error) => {
          this.logger.error('Error al cargar servicios de clínica:', error);
          this.loading = false;
          Swal.fire(
            'Error',
            this.errorMessages.getUserMessage(error, 'cargar servicios de clínica'),
            'error'
          );
        }
      });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  estadoClass(activo: boolean): string {
    return activo === false ? 'estado-badge--inactivo' : 'estado-badge--activo';
  }

  formatMoney(n: number | undefined): string {
    return `$${(Number(n) || 0).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  ivaLabel(row: ServicioClinica): string {
    if (row.aplicaIva !== true) return 'Sin IVA';
    const tasa = Number(row.tasaIva) > 0 ? Number(row.tasaIva) : 16;
    return `${tasa}%`;
  }

  gananciaDe(row: ServicioClinica): number {
    return desglosarPrecioIvaIncluido({
      precioVenta: row.precio_venta,
      costo: row.precio_costo,
      aplicaIva: row.aplicaIva === true,
      tasaIva: row.tasaIva
    }).ganancia;
  }

  nuevo(): void {
    this.abrirDialogo();
  }

  editar(row: ServicioClinica): void {
    this.abrirDialogo(row);
  }

  private abrirDialogo(servicio?: ServicioClinica): void {
    const ref = this.dialog.open(ServicioClinicaDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: { servicio }
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        Swal.fire({ icon: 'success', title: 'Guardado', timer: 1200, showConfirmButton: false });
      }
    });
  }

  async borrar(row: ServicioClinica): Promise<void> {
    if (!row.id) return;
    const confirm = await Swal.fire({
      title: '¿Borrar este servicio?',
      text: `${row.nombre} dejará de aparecer en la caja. No se elimina el historial de tickets.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    });
    if (!confirm.isConfirmed) return;
    this.loadingService.show(LOADING_MESSAGES.deleting);
    try {
      await this.servicios.bajaLogica(row.id);
      Swal.fire({ icon: 'success', title: 'Borrado', timer: 1400, showConfirmButton: false });
    } catch (error) {
      Swal.fire(
        'Error',
        this.errorMessages.getUserMessage(error, 'borrar servicio de clínica'),
        'error'
      );
    } finally {
      this.loadingService.hide();
    }
  }
}
