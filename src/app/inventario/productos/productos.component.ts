import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { Producto } from '../../shared/inventario.models';
import { ProductoDialogComponent } from './producto-dialog.component';
import { ProductoMovimientosDialogComponent } from './producto-movimientos-dialog.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
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

  constructor(
    private inventarioService: InventarioService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    console.log('🚀 Productos Component cargado');
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.loading = true;
    this.inventarioService.getProductos().subscribe({
      next: (productos) => {
        console.log('✅ Productos cargados:', productos.length);
        this.productos = productos;
        this.dataSource = new MatTableDataSource(productos);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
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
      width: '800px',
      data: { producto: null, modoEdicion: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Producto creado, recargando lista...');
        this.cargarProductos();
      }
    });
  }

  editarProducto(producto: Producto): void {
    const dialogRef = this.dialog.open(ProductoDialogComponent, {
      width: '800px',
      data: { producto: producto, modoEdicion: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Producto actualizado, recargando lista...');
        this.cargarProductos();
      }
    });
  }

  async eliminarProducto(producto: Producto): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar producto?',
      text: `¿Estás seguro de eliminar "${producto.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed && producto.id) {
      try {
        await this.inventarioService.eliminarProducto(producto.id);
        Swal.fire('Eliminado', 'El producto ha sido eliminado', 'success');
        this.cargarProductos();
      } catch (error) {
        console.error('❌ Error al eliminar producto:', error);
        Swal.fire('Error', 'No se pudo eliminar el producto', 'error');
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
    // TODO: Implementar exportación a Excel
    Swal.fire('Próximamente', 'Función de exportación en desarrollo', 'info');
  }

  verHistorial(producto: Producto): void {
    console.log('📊 Ver historial de:', producto.nombre);
    this.dialog.open(ProductoMovimientosDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { producto }
    });
  }
}

