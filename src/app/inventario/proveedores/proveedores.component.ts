import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { Proveedor } from '../../shared/inventario.models';
import { ProveedorDialogComponent } from './proveedor-dialog.component';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
    'nombre',
    'contacto',
    'telefono',
    'email',
    'productos_suministrados',
    'activo',
    'acciones'
  ];

  dataSource: MatTableDataSource<Proveedor>;
  proveedores: Proveedor[] = [];
  loading = true;

  constructor(
    private inventarioService: InventarioService,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService
  ) {
    this.dataSource = new MatTableDataSource<Proveedor>([]);
  }

  ngOnInit(): void {
    console.log('🚀 Proveedores Component cargado');
    this.cargarProveedores();
  }

  cargarProveedores(): void {
    this.loading = true;
    this.inventarioService.getProveedores().subscribe({
      next: (proveedores) => {
        this.proveedores = proveedores;
        this.dataSource.data = proveedores;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        console.log('✅ Proveedores cargados:', proveedores.length);
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar proveedores:', error);
        this.loading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  nuevoProveedor(): void {
    console.log('➕ Crear nuevo proveedor');
    const dialogRef = this.dialog.open(ProveedorDialogComponent, {
      width: '700px',
      disableClose: true,
      data: { proveedor: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Proveedor creado, recargando...');
        this.cargarProveedores();
      }
    });
  }

  editarProveedor(proveedor: Proveedor): void {
    console.log('✏️ Editar proveedor:', proveedor.nombre_comercial);
    const dialogRef = this.dialog.open(ProveedorDialogComponent, {
      width: '700px',
      disableClose: true,
      data: { proveedor }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Proveedor actualizado, recargando...');
        this.cargarProveedores();
      }
    });
  }

  async toggleActivo(proveedor: Proveedor): Promise<void> {
    if (!proveedor.id) return;

    const nuevoEstado = !proveedor.activo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    const result = await Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} proveedor?`,
      text: `¿Estás seguro de ${accion} a "${proveedor.nombre_comercial}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await this.inventarioService.actualizarProveedor(proveedor.id, {
          ...proveedor,
          activo: nuevoEstado
        });
        
        Swal.fire({
          icon: 'success',
          title: `Proveedor ${nuevoEstado ? 'activado' : 'desactivado'}`,
          timer: 2000,
          showConfirmButton: false
        });
        
        this.cargarProveedores();
      } catch (error) {
        console.error(`❌ Error al ${accion} proveedor:`, error);
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar proveedor'), 'error');
      }
    }
  }

  async eliminarProveedor(proveedor: Proveedor): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar proveedor?',
      html: `
        <strong>${proveedor.nombre_comercial}</strong><br>
        <span style="color: #f44336;">Esta acción no se puede deshacer</span>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed && proveedor.id) {
      try {
        await this.inventarioService.eliminarProveedor(proveedor.id);
        Swal.fire('Eliminado', 'El proveedor ha sido eliminado', 'success');
        this.cargarProveedores();
      } catch (error) {
        console.error('❌ Error al eliminar proveedor:', error);
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'eliminar proveedor'), 'error');
      }
    }
  }

  verProductos(proveedor: Proveedor): void {
    console.log('📦 Ver productos de:', proveedor.nombre_comercial);
    // TODO: Implementar vista de productos por proveedor
    Swal.fire('Próximamente', 'Vista de productos por proveedor', 'info');
  }

  exportarExcel(): void {
    console.log('📊 Exportar proveedores a Excel');
    // TODO: Implementar exportación
    Swal.fire('Próximamente', 'Exportación en desarrollo', 'info');
  }
}

