import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { Producto } from '../../shared/inventario.models';
import { ProductoDialogComponent } from './producto-dialog.component';
import {
  etiquetaCategoriaProducto,
  generarQrDataUrl,
  imprimirEtiquetaProducto
} from './producto-identificacion.util';
import { OrdenDialogComponent } from '../ordenes/orden-dialog.component';
import { ProductoMovimientosDialogComponent } from './producto-movimientos-dialog.component';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { LoggerService } from '../../core/logger.service';
import { ADMIN_DIALOG_CONFIG, ADMIN_DIALOG_DETAIL, ADMIN_DIALOG_FORM } from '../../core/config/admin-ui.config';
import { exportToCsv } from '../../core/utils/csv-export.util';
import { desglosarPrecioIvaIncluido } from '../../core/utils/precio-margen.util';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly destroy$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  readonly pageSize = 50;

  displayedColumns: string[] = [
    'foto',
    'codigo_barras',
    'nombre',
    'categoria',
    'marca',
    'stock_actual',
    'stock_minimo',
    'precio_compra',
    'precio_venta',
    'margen',
    'acciones'
  ];
  
  dataSource!: MatTableDataSource<Producto>;
  productos: Producto[] = [];
  loading = true;
  filtroProveedorId = '';
  menuContext: Producto | null = null;
  /** Spec 045/046 — catálogo tipo POS. */
  vistaCatalogo: 'lista' | 'cuadricula' = 'cuadricula';

  get productosFiltrados(): Producto[] {
    if (!this.dataSource) return this.productos;
    return this.dataSource.filteredData;
  }

  get kpiTotal(): number {
    return this.productos.filter((p) => p.activo !== false).length;
  }

  get kpiStockBajo(): number {
    return this.productos.filter((p) => {
      if (p.activo === false) return false;
      const stock = Number(p.stock_actual) || 0;
      const min = Number(p.stock_minimo) || 0;
      return min > 0 && stock <= min;
    }).length;
  }

  get kpiInvertido(): number {
    return this.productos
      .filter((p) => p.activo !== false && (Number(p.stock_actual) || 0) > 0)
      .reduce((a, p) => a + (Number(p.stock_actual) || 0) * (Number(p.precio_compra) || 0), 0);
  }

  get kpiValorVenta(): number {
    return this.productos
      .filter((p) => p.activo !== false && (Number(p.stock_actual) || 0) > 0)
      .reduce((a, p) => a + (Number(p.stock_actual) || 0) * (Number(p.precio_venta) || 0), 0);
  }

  formatMoney(n: number): string {
    return `$${(Number(n) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`;
  }

  gananciaNeta(producto: Producto): number {
    return desglosarPrecioIvaIncluido({
      precioVenta: producto.precio_venta,
      costo: producto.precio_compra,
      aplicaIva: !!producto.iva_aplicable,
      tasaIva: producto.tasa_iva
    }).ganancia;
  }

  constructor(
    private inventarioService: InventarioService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.filtroProveedorId = params.get('proveedorId') || '';
      const productoId = params.get('productoId');
      this.cargarProductos(productoId);
    });
  }

  ngAfterViewInit(): void {
    if (this.paginator) this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarProductos(openProductoId: string | null = null): void {
    this.loading = true;
    this.inventarioService.getProductos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (productos) => {
        let filtrados = productos;
        if (this.filtroProveedorId) {
          filtrados = productos.filter(p =>
            p.proveedor_principal_id === this.filtroProveedorId ||
            (p.proveedores_alternos || []).includes(this.filtroProveedorId)
          );
        }
        this.productos = filtrados;
        this.dataSource = new MatTableDataSource(filtrados);
        this.dataSource.sort = this.sort;
        this.loading = false;
        setTimeout(() => {
          if (this.paginator) this.dataSource.paginator = this.paginator;
        }, 0);
        if (openProductoId) {
          const producto = filtrados.find(p => p.id === openProductoId);
          if (producto) {
            this.editarProducto(producto);
          }
        }
      },
      error: (error) => {
        this.logger.error('Error al cargar productos:', error);
        Swal.fire('Error', 'No se pudieron cargar los productos', 'error');
        this.loading = false;
      }
    });
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  abrirDialogoNuevoProducto(): void {
    const dialogRef = this.dialog.open(ProductoDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      data: { producto: null, modoEdicion: false }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.cargarProductos();
    });
  }

  editarProducto(producto: Producto): void {
    const dialogRef = this.dialog.open(ProductoDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      data: { producto: producto, modoEdicion: true }
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.cargarProductos();
    });
  }

  /** Spec 031: producto con stock bajo → OC prefilled. */
  crearOrdenCompra(producto: Producto): void {
    if (!producto?.id) return;
    const dialogRef = this.dialog.open(OrdenDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      disableClose: true,
      data: {
        productoId: producto.id,
        proveedorId: producto.proveedor_principal_id || undefined,
        cantidad: Math.max(1, Number(producto.stock_minimo) || 1)
      }
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe();
  }

  async eliminarProducto(producto: Producto): Promise<void> {
    const result = await Swal.fire({
      title: '¿Borrar este producto?',
      text: `¿Estás seguro de borrar "${producto.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed && producto.id) {
      try {
        await this.inventarioService.eliminarProducto(producto.id);
        Swal.fire({
          icon: 'success',
          title: 'Borrado',
          text: 'El producto ha sido borrado',
          timer: 2000,
          showConfirmButton: false
        });
        this.cargarProductos();
      } catch (error) {
        this.logger.error('Error al eliminar producto:', error);
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'eliminar producto'), 'error');
      }
    }
  }

  getStockClass(producto: Producto): string {
    if (producto.stock_actual === 0) return 'stock-critico';
    if (producto.stock_actual <= producto.stock_minimo) return 'stock-bajo';
    if (producto.stock_actual >= producto.stock_maximo) return 'stock-alto';
    return 'stock-normal';
  }

  exportarExcel(): void {
    if (!this.productos.length) {
      Swal.fire('Sin datos', 'No hay productos para exportar.', 'info');
      return;
    }
    exportToCsv(`productos_${Date.now()}`, this.productos, [
      { header: 'Código', value: row => row.codigo_barras },
      { header: 'Nombre', value: row => row.nombre },
      { header: 'Categoría', value: row => row.categoria },
      { header: 'Marca', value: row => row.marca },
      { header: 'Stock', value: row => row.stock_actual },
      { header: 'Stock mínimo', value: row => row.stock_minimo },
      { header: 'Precio compra', value: row => row.precio_compra },
      { header: 'Precio venta', value: row => row.precio_venta }
    ]);
  }

  verHistorial(producto: Producto): void {
    this.dialog.open(ProductoMovimientosDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: { producto }
    });
  }

  etiquetaCategoria(categoria: string): string {
    return etiquetaCategoriaProducto(categoria);
  }

  async imprimirQr(producto: Producto): Promise<void> {
    const codigo = String(producto.codigo_barras || '').trim();
    if (codigo.length < 3) {
      Swal.fire('Sin código', 'Este producto no tiene un código válido para el QR.', 'info');
      return;
    }
    try {
      const qr = await generarQrDataUrl(codigo);
      imprimirEtiquetaProducto({
        nombre: producto.nombre,
        codigo,
        presentacion: producto.presentacion,
        qrDataUrl: qr
      });
    } catch (error) {
      this.logger.error('No se pudo generar el QR', error);
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'generar QR'), 'error');
    }
  }
}

