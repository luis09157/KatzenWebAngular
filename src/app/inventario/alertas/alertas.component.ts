import { Component, OnInit } from '@angular/core';
import { InventarioService } from '../inventario.service';
import { Alerta, Producto } from '../../shared/inventario.models';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';

@Component({
  selector: 'app-alertas',
  templateUrl: './alertas.component.html',
  styleUrls: ['./alertas.component.css']
})
export class AlertasComponent implements OnInit {
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
    { valor: 'punto_reorden', etiqueta: 'Punto de Reorden', icono: 'shopping_cart', color: '#ffc107' }
  ];

  prioridades = [
    { valor: 'todas', etiqueta: 'Todas' },
    { valor: 'critica', etiqueta: 'Crítica', color: '#d32f2f' },
    { valor: 'alta', etiqueta: 'Alta', color: '#f44336' },
    { valor: 'media', etiqueta: 'Media', color: '#ff9800' },
    { valor: 'baja', etiqueta: 'Baja', color: '#2196f3' }
  ];

  constructor(
    private inventarioService: InventarioService,
    private errorMessages: ErrorMessagesService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Alertas Component cargado');
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;

    // Cargar productos
    this.inventarioService.getProductos().subscribe({
      next: (productos) => {
        productos.forEach(p => {
          if (p.id) this.productos.set(p.id, p);
        });

        // Cargar alertas
        this.inventarioService.getAlertas().subscribe({
          next: (alertas) => {
            this.alertas = alertas;
            this.aplicarFiltros();
            console.log('✅ Alertas cargadas:', alertas.length);
            this.loading = false;
          },
          error: (error) => {
            console.error('❌ Error al cargar alertas:', error);
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
        this.loading = false;
      }
    });
  }

  aplicarFiltros(): void {
    let filtradas = [...this.alertas];

    // Filtrar por tipo
    if (this.filtroTipo !== 'todas') {
      filtradas = filtradas.filter(a => a.tipo === this.filtroTipo);
    }

    // Filtrar por prioridad
    if (this.filtroPrioridad !== 'todas') {
      filtradas = filtradas.filter(a => a.prioridad === this.filtroPrioridad);
    }

    // Ordenar por prioridad y fecha
    filtradas.sort((a, b) => {
      const prioridadOrden = { 'critica': 1, 'alta': 2, 'media': 3, 'baja': 4 };
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

  getColorAlerta(prioridad: string): string {
    const colores: {[key: string]: string} = {
      'critica': '#d32f2f',
      'alta': '#f44336',
      'media': '#ff9800',
      'baja': '#2196f3'
    };
    return colores[prioridad] || '#757575';
  }

  getIconoAlerta(tipo: string): string {
    const alerta = this.tiposAlerta.find(t => t.valor === tipo);
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
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await this.inventarioService.resolverAlerta(alerta.id);
        Swal.fire({
          icon: 'success',
          title: 'Alerta Resuelta',
          timer: 1500,
          showConfirmButton: false
        });
        this.cargarDatos();
      } catch (error) {
        console.error('❌ Error al resolver alerta:', error);
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'resolver alerta'), 'error');
      }
    }
  }

  async resolverTodas(): Promise<void> {
    const alertasActivas = this.alertasFiltradas.filter(a => a.estado === 'pendiente' || a.estado === 'en_proceso');
    
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
      cancelButtonText: 'Cancelar'
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
          showConfirmButton: false
        });
        this.cargarDatos();
      } catch (error) {
        console.error('❌ Error al resolver alertas:', error);
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'resolver alerta'), 'error');
      }
    }
  }

  verProducto(productoId: string): void {
    console.log('🔍 Ver producto:', productoId);
    // TODO: Navegar al detalle del producto
  }

  getEstadisticas() {
    const criticas = this.alertas.filter(a => a.prioridad === 'critica' && a.estado !== 'resuelta').length;
    const altas = this.alertas.filter(a => a.prioridad === 'alta' && a.estado !== 'resuelta').length;
    const medias = this.alertas.filter(a => a.prioridad === 'media' && a.estado !== 'resuelta').length;
    const bajas = this.alertas.filter(a => a.prioridad === 'baja' && a.estado !== 'resuelta').length;
    const activas = this.alertas.filter(a => a.estado !== 'resuelta').length;

    return { criticas, altas, medias, bajas, activas, total: this.alertas.length };
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

  limpiarFiltros(): void {
    this.filtroTipo = 'todas';
    this.filtroPrioridad = 'todas';
    this.aplicarFiltros();
  }

  async generarAlertasAutomaticas(): Promise<void> {
    const result = await Swal.fire({
      title: 'Generar Alertas',
      text: 'Se revisará el inventario y se generarán alertas automáticas',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Generar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await this.inventarioService.generarAlertasAutomaticas();
        Swal.fire({
          icon: 'success',
          title: 'Alertas Generadas',
          text: 'Se han generado las alertas automáticas',
          timer: 2000,
          showConfirmButton: false
        });
        this.cargarDatos();
      } catch (error) {
        console.error('❌ Error al generar alertas:', error);
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'generar alertas'), 'error');
      }
    }
  }
}

