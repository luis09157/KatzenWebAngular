import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { Alerta, Producto } from '../../shared/inventario.models';
import { OrdenDialogComponent } from '../ordenes/orden-dialog.component';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { LoggerService } from '../../core/logger.service';
import { ADMIN_DIALOG_FORM } from '../../core/config/admin-ui.config';

@Component({
  selector: 'app-alertas',
  templateUrl: './alertas.component.html',
  styleUrls: ['./alertas.component.scss'],
})
export class AlertasComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  alertas: Alerta[] = [];
  alertasFiltradas: Alerta[] = [];
  productos: Map<string, Producto> = new Map();
  loading = true;

  filtroTipo = 'todas';
  filtroPrioridad = 'todas';

  tiposAlerta = [
    { valor: 'todas', etiqueta: 'Todas', icono: 'notifications', color: '#757575' },
    { valor: 'stock_bajo', etiqueta: 'Stock Bajo', icono: 'inventory', color: '#f44336' },
    { valor: 'por_caducar', etiqueta: 'Por Caducar', icono: 'event_busy', color: '#ff9800' },
    { valor: 'caducado', etiqueta: 'Caducado', icono: 'cancel', color: '#d32f2f' },
    { valor: 'punto_reorden', etiqueta: 'Punto de Reorden', icono: 'shopping_cart', color: '#ffc107' },
  ];

  prioridades = [
    { valor: 'todas', etiqueta: 'Todas' },
    { valor: 'critica', etiqueta: 'Crítica', color: '#d32f2f' },
    { valor: 'alta', etiqueta: 'Alta', color: '#f44336' },
    { valor: 'media', etiqueta: 'Media', color: '#ff9800' },
    { valor: 'baja', etiqueta: 'Baja', color: '#2196f3' },
  ];

  constructor(
    private inventarioService: InventarioService,
    private router: Router,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    void this.refrescarAlertasAlAbrir();
  }

  /** Spec 069 — genera sin pedir confirmación y luego lista. */
  private async refrescarAlertasAlAbrir(): Promise<void> {
    this.loading = true;
    try {
      await this.inventarioService.generarAlertasAutomaticas();
    } catch (error) {
      this.logger.error('Error al generar alertas al abrir:', error);
    }
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatos(): void {
    this.loading = true;
    this.inventarioService
      .getProductos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productos) => {
          productos.forEach((p) => {
            if (p.id) this.productos.set(p.id, p);
          });
          this.inventarioService
            .getAlertas()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (alertas) => {
                this.alertas = alertas;
                this.aplicarFiltros();
                this.loading = false;
              },
              error: (error) => {
                this.logger.error('Error al cargar alertas:', error);
                this.loading = false;
              },
            });
        },
        error: (error) => {
          this.logger.error('Error al cargar productos:', error);
          this.loading = false;
        },
      });
  }

  aplicarFiltros(): void {
    let filtradas = [...this.alertas];

    // Filtrar por tipo
    if (this.filtroTipo !== 'todas') {
      filtradas = filtradas.filter((a) => a.tipo === this.filtroTipo);
    }

    // Filtrar por prioridad
    if (this.filtroPrioridad !== 'todas') {
      filtradas = filtradas.filter((a) => a.prioridad === this.filtroPrioridad);
    }

    // Ordenar por prioridad y fecha
    filtradas.sort((a, b) => {
      const prioridadOrden = { critica: 1, alta: 2, media: 3, baja: 4 };
      const ordenA = prioridadOrden[a.prioridad as keyof typeof prioridadOrden] || 5;
      const ordenB = prioridadOrden[b.prioridad as keyof typeof prioridadOrden] || 5;

      if (ordenA !== ordenB) return ordenA - ordenB;
      return new Date(b.fecha_alerta).getTime() - new Date(a.fecha_alerta).getTime();
    });

    this.alertasFiltradas = filtradas;
  }

  getProductoNombre(productoId: string): string {
    return this.productos.get(productoId)?.nombre || 'Desconocido';
  }

  getProductoStock(productoId: string): number {
    return this.productos.get(productoId)?.stock_actual || 0;
  }

  getProductoUnidad(productoId: string): string {
    return this.productos.get(productoId)?.unidad_medida || '';
  }

  irAProductos(): void {
    this.router.navigate(['/admin/inventario/productos']);
  }

  verProducto(productoId: string): void {
    this.router.navigate(['/admin/inventario/productos'], {
      queryParams: { highlight: productoId },
    });
  }

  /** Spec 031: stock bajo → OC con producto (y proveedor principal si existe). */
  crearOrdenDesdeAlerta(alerta: Alerta): void {
    if (!alerta?.producto_id) return;
    const producto = this.productos.get(alerta.producto_id);
    const ref = this.dialog.open(OrdenDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      disableClose: true,
      data: {
        productoId: alerta.producto_id,
        proveedorId: producto?.proveedor_principal_id || undefined,
        cantidad: Math.max(1, Number(producto?.stock_minimo) || 1),
      },
    });
    ref
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((ok) => {
        if (ok) {
          Swal.fire({
            icon: 'success',
            title: 'Orden creada',
            text: 'Puedes verla en Órdenes de compra.',
            timer: 1800,
            showConfirmButton: false,
          });
        }
      });
  }

  getColorAlerta(prioridad: string): string {
    const colores: { [key: string]: string } = {
      critica: '#d32f2f',
      alta: '#f44336',
      media: '#ff9800',
      baja: '#2196f3',
    };
    return colores[prioridad] || '#757575';
  }

  getIconoAlerta(tipo: string): string {
    const alerta = this.tiposAlerta.find((t) => t.valor === tipo);
    return alerta?.icono || 'notifications';
  }

  async resolverAlerta(alerta: Alerta): Promise<void> {
    if (!alerta.id) return;

    const result = await Swal.fire({
      title: '¿Resolver alerta?',
      text: '¿Deseas marcar esta alerta como resuelta?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, resolver',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        await this.inventarioService.resolverAlerta(alerta.id);
        Swal.fire({
          icon: 'success',
          title: 'Alerta Resuelta',
          timer: 1500,
          showConfirmButton: false,
        });
        this.cargarDatos();
      } catch (error) {
        console.error('❌ Error al resolver alerta:', error);
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'resolver alerta'), 'error');
      }
    }
  }

  async resolverTodas(): Promise<void> {
    const alertasActivas = this.alertasFiltradas.filter((a) => a.estado === 'pendiente' || a.estado === 'en_proceso');

    if (alertasActivas.length === 0) {
      Swal.fire('Sin Alertas', 'No hay alertas pendientes para resolver', 'info');
      return;
    }

    const result = await Swal.fire({
      title: `¿Resolver ${alertasActivas.length} alertas?`,
      text: 'Se marcarán todas las alertas visibles como resueltas',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, resolver todas',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        for (const alerta of alertasActivas) {
          if (alerta.id) {
            await this.inventarioService.resolverAlerta(alerta.id);
          }
        }
        Swal.fire({
          icon: 'success',
          title: 'Alertas Resueltas',
          text: `${alertasActivas.length} alertas marcadas como resueltas`,
          timer: 2000,
          showConfirmButton: false,
        });
        this.cargarDatos();
      } catch (error) {
        console.error('❌ Error al resolver alertas:', error);
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'resolver alerta'), 'error');
      }
    }
  }

  getEstadisticas() {
    const activas = this.alertas.filter((a) => a.estado !== 'resuelta');
    const criticas = activas.filter((a) => a.prioridad === 'critica').length;
    const altas = activas.filter((a) => a.prioridad === 'alta').length;
    const medias = activas.filter((a) => a.prioridad === 'media').length;
    const bajas = activas.filter((a) => a.prioridad === 'baja').length;
    const porCaducar = activas.filter((a) => a.tipo === 'por_caducar').length;
    const caducados = activas.filter((a) => a.tipo === 'caducado').length;
    const stockBajo = activas.filter((a) => a.tipo === 'stock_bajo').length;
    const puntoReorden = activas.filter((a) => a.tipo === 'punto_reorden').length;

    return {
      criticas,
      altas,
      medias,
      bajas,
      activas: activas.length,
      total: this.alertas.length,
      porCaducar,
      caducados,
      stockBajo,
      puntoReorden,
    };
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  limpiarFiltros(): void {
    this.filtroTipo = 'todas';
    this.filtroPrioridad = 'todas';
    this.aplicarFiltros();
  }

  async generarAlertasAutomaticas(): Promise<void> {
    this.loading = true;
    try {
      await this.inventarioService.generarAlertasAutomaticas();
      this.cargarDatos();
    } catch (error) {
      this.loading = false;
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'generar alertas'), 'error');
    }
  }
}
