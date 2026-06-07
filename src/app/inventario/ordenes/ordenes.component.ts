import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { OrdenCompra, Proveedor } from '../../shared/inventario.models';
import { OrdenDialogComponent } from './orden-dialog.component';
import { RecibirOrdenDialogComponent } from './recibir-orden-dialog.component';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { LoggerService } from '../../core/logger.service';
import { ADMIN_DIALOG_CONFIG, ADMIN_DIALOG_FORM } from '../../core/config/admin-ui.config';

@Component({
  selector: 'app-ordenes',
  templateUrl: './ordenes.component.html',
  styleUrls: ['./ordenes.component.css']
})
export class OrdenesComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  readonly pageSize = 50;

  displayedColumns: string[] = [
    'numero_orden',
    'fecha_orden',
    'proveedor',
    'total',
    'estado',
    'fecha_entrega_esperada',
    'acciones'
  ];

  dataSource: MatTableDataSource<OrdenCompra>;
  ordenes: OrdenCompra[] = [];
  proveedores: Map<string, Proveedor> = new Map();
  loading = true;
  menuContext: OrdenCompra | null = null;

  // Filtros
  filtroEstado = 'todos';

  estadosOrden = [
    { valor: 'todos', etiqueta: 'Todos' },
    { valor: 'pendiente', etiqueta: 'Pendientes' },
    { valor: 'enviada', etiqueta: 'Enviadas' },
    { valor: 'parcialmente_recibida', etiqueta: 'Parcialmente Recibidas' },
    { valor: 'recibida', etiqueta: 'Recibidas' },
    { valor: 'cancelada', etiqueta: 'Canceladas' }
  ];

  constructor(
    private inventarioService: InventarioService,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService
  ) {
    this.dataSource = new MatTableDataSource<OrdenCompra>([]);
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    if (this.paginator) this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatos(): void {
    this.loading = true;
    this.inventarioService.getProveedores().pipe(takeUntil(this.destroy$)).subscribe({
      next: (proveedores) => {
        this.proveedores.clear();
        proveedores.forEach(p => {
          if (p.id) this.proveedores.set(p.id, p);
        });
        this.inventarioService.getOrdenesCompra().pipe(takeUntil(this.destroy$)).subscribe({
          next: (ordenes) => {
            this.ordenes = ordenes;
            this.aplicarFiltros();
            this.loading = false;
          },
          error: (error) => {
            this.logger.error('Error al cargar órdenes:', error);
            this.loading = false;
          }
        });
      },
      error: (error) => {
        this.logger.error('Error al cargar proveedores:', error);
        this.loading = false;
      }
    });
  }

  aplicarFiltros(): void {
    let ordenesFiltradas = [...this.ordenes];

    if (this.filtroEstado !== 'todos') {
      ordenesFiltradas = ordenesFiltradas.filter(o => o.estado === this.filtroEstado);
    }

    this.dataSource.data = ordenesFiltradas;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  nuevaOrden(): void {
    const dialogRef = this.dialog.open(OrdenDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      disableClose: true
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.cargarDatos();
    });
  }

  recibirOrden(orden: OrdenCompra): void {
    const dialogRef = this.dialog.open(RecibirOrdenDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      disableClose: true,
      data: { orden }
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.cargarDatos();
    });
  }

  async cancelarOrden(orden: OrdenCompra): Promise<void> {
    const result = await Swal.fire({
      title: '¿Cancelar orden?',
      html: `
        <strong>${orden.folio}</strong><br>
        Proveedor: ${this.getProveedorNombre(orden.proveedor_id)}<br>
        <span style="color: #f44336;">Esta acción no se puede deshacer</span>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cancelar orden',
      cancelButtonText: 'No'
    });

    if (result.isConfirmed && orden.id) {
      try {
        await this.inventarioService.cancelarOrdenCompra(orden.id);
        Swal.fire('Cancelada', 'La orden ha sido cancelada', 'success');
        this.cargarDatos();
      } catch (error) {
        console.error('❌ Error al cancelar orden:', error);
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cancelar orden'), 'error');
      }
    }
  }

  getProveedorNombre(proveedorId: string): string {
    return this.proveedores.get(proveedorId)?.nombre_comercial || 'Desconocido';
  }

  getEstadoColor(estado: string): string {
    const colores: {[key: string]: string} = {
      'pendiente': '#ff9800',
      'enviada': '#2196f3',
      'parcialmente_recibida': '#ff5722',
      'recibida': '#4caf50',
      'cancelada': '#757575'
    };
    return colores[estado] || '#999';
  }

  getEstadoIcono(estado: string): string {
    const iconos: {[key: string]: string} = {
      'pendiente': 'schedule',
      'enviada': 'local_shipping',
      'parcialmente_recibida': 'hourglass_bottom',
      'recibida': 'check_circle',
      'cancelada': 'cancel'
    };
    return iconos[estado] || 'help';
  }

  getEstadoTexto(estado: string): string {
    const textos: {[key: string]: string} = {
      'pendiente': 'Pendiente',
      'enviada': 'Enviada',
      'parcialmente_recibida': 'Parcialmente Recibida',
      'recibida': 'Recibida',
      'cancelada': 'Cancelada'
    };
    return textos[estado] || estado;
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  puedeRecibir(orden: OrdenCompra): boolean {
    return orden.estado === 'borrador' || 
           orden.estado === 'parcial';
  }

  puedeCancelar(orden: OrdenCompra): boolean {
    return orden.estado !== 'recibida' && orden.estado !== 'cancelada';
  }

  exportarExcel(): void {
    this.logger.log('Exportar órdenes a Excel');
    Swal.fire('Próximamente', 'Exportación en desarrollo', 'info');
  }
}

