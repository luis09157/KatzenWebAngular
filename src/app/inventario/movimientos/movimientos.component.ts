import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { Movimiento, Producto } from '../../shared/inventario.models';
import { EntradaDialogComponent } from './entrada-dialog.component';
import { SalidaDialogComponent } from './salida-dialog.component';
import { AjusteDialogComponent } from './ajuste-dialog.component';
import { LoggerService } from '../../core/logger.service';
import { exportToCsv } from '../../core/utils/csv-export.util';
import { MovimientoDetalleDialogComponent } from './movimiento-detalle-dialog.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-movimientos',
  templateUrl: './movimientos.component.html',
  styleUrls: ['./movimientos.component.css']
})
export class MovimientosComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly pageSize = 50;
  displayedColumns: string[] = [
    'fecha',
    'producto',
    'tipo',
    'cantidad',
    'stock_anterior',
    'stock_nuevo',
    'motivo',
    'usuario',
    'acciones'
  ];
  
  dataSource: MatTableDataSource<Movimiento>;
  movimientos: Movimiento[] = [];
  productos: Map<string, Producto> = new Map();
  loading = true;

  // Filtros
  filtroTexto = '';
  filtroTipo = 'todos';
  filtroFechaInicio: Date | null = null;
  filtroFechaFin: Date | null = null;

  tiposMovimiento = [
    { valor: 'todos', etiqueta: 'Todos' },
    { valor: 'entrada', etiqueta: 'Entradas' },
    { valor: 'salida', etiqueta: 'Salidas' },
    { valor: 'ajuste', etiqueta: 'Ajustes' }
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private inventarioService: InventarioService,
    private dialog: MatDialog,
    private logger: LoggerService
  ) {
    this.dataSource = new MatTableDataSource<Movimiento>([]);
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
    this.inventarioService.getProductos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (productos) => {
        this.productos.clear();
        productos.forEach(p => {
          if (p.id) this.productos.set(p.id, p);
        });
        this.inventarioService.getTodosLosMovimientos().pipe(takeUntil(this.destroy$)).subscribe({
          next: (movimientos) => {
            this.movimientos = movimientos;
            this.aplicarFiltros();
            this.loading = false;
          },
          error: (error) => {
            this.logger.error('Error al cargar movimientos:', error);
            this.loading = false;
          }
        });
      },
      error: (error) => {
        this.logger.error('Error al cargar productos:', error);
        this.loading = false;
      }
    });
  }

  aplicarFiltros(): void {
    let movimientosFiltrados = [...this.movimientos];

    // Filtro por texto
    if (this.filtroTexto) {
      const texto = this.filtroTexto.toLowerCase();
      movimientosFiltrados = movimientosFiltrados.filter(m => {
        const producto = this.productos.get(m.producto_id);
        return (
          producto?.nombre.toLowerCase().includes(texto) ||
          producto?.codigo_barras.toLowerCase().includes(texto) ||
          m.motivo.toLowerCase().includes(texto) ||
          m.usuario_responsable_id?.toLowerCase().includes(texto)
        );
      });
    }

    // Filtro por tipo
    if (this.filtroTipo !== 'todos') {
      movimientosFiltrados = movimientosFiltrados.filter(m => m.tipo === this.filtroTipo);
    }

    // Filtro por fecha inicio
    if (this.filtroFechaInicio) {
      const fechaInicio = new Date(this.filtroFechaInicio);
      fechaInicio.setHours(0, 0, 0, 0);
      movimientosFiltrados = movimientosFiltrados.filter(m => {
        const fechaMov = new Date(m.created_at);
        return fechaMov >= fechaInicio;
      });
    }

    // Filtro por fecha fin
    if (this.filtroFechaFin) {
      const fechaFin = new Date(this.filtroFechaFin);
      fechaFin.setHours(23, 59, 59, 999);
      movimientosFiltrados = movimientosFiltrados.filter(m => {
        const fechaMov = new Date(m.created_at);
        return fechaMov <= fechaFin;
      });
    }

    this.dataSource.data = movimientosFiltrados;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.filtroTipo = 'todos';
    this.filtroFechaInicio = null;
    this.filtroFechaFin = null;
    this.aplicarFiltros();
  }

  getProductoNombre(productoId: string): string {
    return this.productos.get(productoId)?.nombre || 'Producto Desconocido';
  }

  getProductoPresentacion(productoId: string): string {
    return this.productos.get(productoId)?.presentacion || '';
  }

  getProductoUnidad(productoId: string): string {
    return this.productos.get(productoId)?.unidad_medida || '';
  }

  getTipoColor(tipo: string): string {
    const colores: {[key: string]: string} = {
      'entrada': '#4caf50',
      'salida': '#f44336',
      'ajuste': '#ff9800'
    };
    return colores[tipo] || '#757575';
  }

  getTipoIcono(tipo: string): string {
    const iconos: {[key: string]: string} = {
      'entrada': 'arrow_downward',
      'salida': 'arrow_upward',
      'ajuste': 'tune'
    };
    return iconos[tipo] || 'help';
  }

  getTipoTexto(tipo: string): string {
    const textos: {[key: string]: string} = {
      'entrada': 'Entrada',
      'salida': 'Salida',
      'ajuste': 'Ajuste'
    };
    return textos[tipo] || tipo;
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  registrarEntrada(): void {
    const dialogRef = this.dialog.open(EntradaDialogComponent, {
      width: '700px',
      disableClose: false
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.cargarDatos();
    });
  }

  registrarSalida(): void {
    const dialogRef = this.dialog.open(SalidaDialogComponent, {
      width: '700px',
      disableClose: false
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.cargarDatos();
    });
  }

  registrarAjuste(): void {
    const dialogRef = this.dialog.open(AjusteDialogComponent, {
      width: '700px',
      disableClose: false
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.cargarDatos();
    });
  }

  exportarExcel(): void {
    const rows = this.dataSource.data;
    if (!rows.length) {
      Swal.fire('Sin datos', 'No hay movimientos para exportar.', 'info');
      return;
    }
    exportToCsv(`movimientos_${Date.now()}`, rows, [
      { header: 'Fecha', value: row => this.formatearFecha(row.created_at) },
      { header: 'Producto', value: row => this.getProductoNombre(row.producto_id) },
      { header: 'Tipo', value: row => row.tipo },
      { header: 'Cantidad', value: row => row.cantidad },
      { header: 'Stock anterior', value: row => row.cantidad_anterior },
      { header: 'Stock nuevo', value: row => row.cantidad_nueva },
      { header: 'Motivo', value: row => row.motivo },
      { header: 'Usuario', value: row => row.usuario_responsable_id || '' }
    ]);
  }

  verDetalle(movimiento: Movimiento): void {
    this.dialog.open(MovimientoDetalleDialogComponent, {
      width: '560px',
      data: {
        movimiento,
        producto: this.productos.get(movimiento.producto_id)
      }
    });
  }
}

