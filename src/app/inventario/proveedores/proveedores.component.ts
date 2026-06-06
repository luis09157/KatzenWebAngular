import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { Proveedor } from '../../shared/inventario.models';
import { ProveedorDialogComponent } from './proveedor-dialog.component';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { LoggerService } from '../../core/logger.service';
import { exportToCsv } from '../../core/utils/csv-export.util';
import { Router } from '@angular/router';

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  readonly pageSize = 50;

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
    private router: Router,
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService
  ) {
    this.dataSource = new MatTableDataSource<Proveedor>([]);
  }

  ngOnInit(): void {
    this.cargarProveedores();
  }

  ngAfterViewInit(): void {
    if (this.paginator) this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarProveedores(): void {
    this.loading = true;
    this.inventarioService.getProveedores().pipe(takeUntil(this.destroy$)).subscribe({
      next: (proveedores) => {
        this.proveedores = proveedores;
        this.dataSource.data = proveedores;
        this.dataSource.sort = this.sort;
        this.loading = false;
        setTimeout(() => {
          if (this.paginator) this.dataSource.paginator = this.paginator;
        }, 0);
      },
      error: (error) => {
        this.logger.error('Error al cargar proveedores:', error);
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
    const dialogRef = this.dialog.open(ProveedorDialogComponent, {
      width: '700px',
      disableClose: true,
      data: { proveedor: null }
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.cargarProveedores();
    });
  }

  editarProveedor(proveedor: Proveedor): void {
    const dialogRef = this.dialog.open(ProveedorDialogComponent, {
      width: '700px',
      disableClose: true,
      data: { proveedor }
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.cargarProveedores();
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
        this.logger.error(`Error al ${accion} proveedor:`, error);
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
        this.logger.error('Error al eliminar proveedor:', error);
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'eliminar proveedor'), 'error');
      }
    }
  }

  verProductos(proveedor: Proveedor): void {
    if (!proveedor.id) {
      return;
    }
    this.router.navigate(['/admin/inventario/productos'], {
      queryParams: { proveedorId: proveedor.id }
    });
  }

  exportarExcel(): void {
    if (!this.proveedores.length) {
      Swal.fire('Sin datos', 'No hay proveedores para exportar.', 'info');
      return;
    }
    exportToCsv(`proveedores_${Date.now()}`, this.proveedores, [
      { header: 'Nombre', value: row => row.nombre_comercial },
      { header: 'Contacto', value: row => row.contacto_nombre },
      { header: 'Teléfono', value: row => row.contacto_telefono },
      { header: 'Email', value: row => row.contacto_email },
      { header: 'Activo', value: row => row.activo ? 'Sí' : 'No' }
    ]);
  }
}

