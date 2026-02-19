import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { EstadisticasInventario, Alerta, Producto } from '../../shared/inventario.models';
import { EntradaDialogComponent } from '../movimientos/entrada-dialog.component';
import { SalidaDialogComponent } from '../movimientos/salida-dialog.component';
import { AjusteDialogComponent } from '../movimientos/ajuste-dialog.component';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';

@Component({
  selector: 'app-dashboard-inventario',
  templateUrl: './dashboard-inventario.component.html',
  styleUrls: ['./dashboard-inventario.component.css']
})
export class DashboardInventarioComponent implements OnInit {
  estadisticas: EstadisticasInventario | null = null;
  alertas: Alerta[] = [];
  productosBajoStock: Producto[] = [];
  productosPorCaducar: Producto[] = [];
  loading = true;

  constructor(
    private inventarioService: InventarioService,
    private router: Router,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Dashboard de Inventario cargado');
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.loading = true;
      console.log('📊 Cargando datos del dashboard...');

      // Cargar estadísticas
      this.estadisticas = await this.inventarioService.getEstadisticas();
      console.log('✅ Estadísticas cargadas:', this.estadisticas);

      // Cargar alertas
      this.inventarioService.getAlertas().subscribe(alertas => {
        this.alertas = alertas;
        console.log('✅ Alertas cargadas:', alertas.length);
      });

      // Cargar productos bajo stock
      this.inventarioService.getProductosBajoStock().subscribe(productos => {
        this.productosBajoStock = productos;
        console.log('✅ Productos bajo stock:', productos.length);
      });

      // Cargar productos por caducar
      this.inventarioService.getProductosPorCaducar(30).subscribe(productos => {
        this.productosPorCaducar = productos;
        console.log('✅ Productos por caducar:', productos.length);
      });

      this.loading = false;
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
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
      console.log('✅ Alerta resuelta');
      this.cargarDatos();
    } catch (error) {
      console.error('❌ Error al resolver alerta:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: this.errorMessages.getUserMessage(error, 'resolver alerta')
      });
    }
  }

  registrarEntrada(): void {
    console.log('📥 Abriendo diálogo de entrada');
    const dialogRef = this.dialog.open(EntradaDialogComponent, {
      width: '700px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Entrada registrada, recargando datos...');
        this.cargarDatos();
      }
    });
  }

  registrarSalida(): void {
    console.log('📤 Abriendo diálogo de salida');
    const dialogRef = this.dialog.open(SalidaDialogComponent, {
      width: '700px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Salida registrada, recargando datos...');
        this.cargarDatos();
      }
    });
  }

  registrarAjuste(): void {
    console.log('🔧 Abriendo diálogo de ajuste');
    const dialogRef = this.dialog.open(AjusteDialogComponent, {
      width: '700px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Ajuste registrado, recargando datos...');
        this.cargarDatos();
      }
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

