import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { EstadisticasInventario, Alerta, Producto } from '../../shared/inventario.models';
import { EntradaDialogComponent } from '../movimientos/entrada-dialog.component';
import { SalidaDialogComponent } from '../movimientos/salida-dialog.component';
import { AjusteDialogComponent } from '../movimientos/ajuste-dialog.component';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { LoggerService } from '../../core/logger.service';

@Component({
  selector: 'app-dashboard-inventario',
  templateUrl: './dashboard-inventario.component.html',
  styleUrls: ['./dashboard-inventario.component.css']
})
export class DashboardInventarioComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  estadisticas: EstadisticasInventario | null = null;
  alertas: Alerta[] = [];
  productosBajoStock: Producto[] = [];
  productosPorCaducar: Producto[] = [];
  loading = true;

  constructor(
    private inventarioService: InventarioService,
    private router: Router,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.logger.log('Dashboard de Inventario cargado');
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.loading = true;
      this.estadisticas = await this.inventarioService.getEstadisticas();

      this.inventarioService.getAlertas().pipe(takeUntil(this.destroy$)).subscribe(alertas => {
        this.alertas = alertas;
      });

      this.inventarioService.getProductosBajoStock().pipe(takeUntil(this.destroy$)).subscribe(productos => {
        this.productosBajoStock = productos;
      });

      this.inventarioService.getProductosPorCaducar(30).pipe(takeUntil(this.destroy$)).subscribe(productos => {
        this.productosPorCaducar = productos;
      });

      this.loading = false;
    } catch (error) {
      this.logger.error('Error al cargar datos:', error);
      this.loading = false;
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar',
        text: this.errorMessages.getUserMessage(error, 'cargar datos')
      });
    }
  }

  irAProductos(): void {
    this.router.navigate(['/admin/inventario/productos']);
  }

  getIconoAlerta(tipo: string): string {
    const iconos: {[key: string]: string} = {
      'stock_bajo': 'inventory',
      'por_caducar': 'event_busy',
      'caducado': 'cancel',
      'punto_reorden': 'shopping_cart'
    };
    return iconos[tipo] || 'warning';
  }

  getColorAlerta(prioridad: string): string {
    const colores: {[key: string]: string} = {
      'critica': '#f44336',
      'alta': '#ff9800',
      'media': '#ffc107',
      'baja': '#2196f3'
    };
    return colores[prioridad] || '#9e9e9e';
  }

  async resolverAlerta(alerta: Alerta): Promise<void> {
    if (!alerta.id) return;
    try {
      await this.inventarioService.resolverAlerta(alerta.id);
      this.cargarDatos();
    } catch (error) {
      this.logger.error('Error al resolver alerta:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: this.errorMessages.getUserMessage(error, 'resolver alerta')
      });
    }
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

  verHistorialMovimientos(): void {
    this.router.navigate(['/admin/inventario/movimientos']);
  }

  verAlertas(): void {
    this.router.navigate(['/admin/inventario/alertas']);
  }

  verReportes(): void {
    this.router.navigate(['/admin/inventario/reportes']);
  }

  verProveedores(): void {
    this.router.navigate(['/admin/inventario/proveedores']);
  }

  verOrdenes(): void {
    this.router.navigate(['/admin/inventario/ordenes']);
  }
}

