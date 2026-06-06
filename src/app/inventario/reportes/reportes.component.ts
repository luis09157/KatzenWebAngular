import { Component, OnInit } from '@angular/core';
import { InventarioService } from '../inventario.service';
import { Producto, Movimiento } from '../../shared/inventario.models';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { exportToCsv } from '../../core/utils/csv-export.util';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {
  loading = false;
  reporteActual: string = 'valoracion';

  // Datos para reportes
  productos: Producto[] = [];
  movimientos: Movimiento[] = [];
  
  // Estadísticas calculadas
  valorInventario = 0;
  totalProductos = 0;
  productosActivos = 0;
  categorias: any[] = [];
  
  // Top productos
  topVendidos: any[] = [];
  topStockAlto: any[] = [];
  topStockBajo: any[] = [];
  
  // Filtros
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;

  tiposReporte = [
    { valor: 'valoracion', nombre: 'Valoración de Inventario', icono: 'attach_money' },
    { valor: 'movimientos', nombre: 'Movimientos por Período', icono: 'swap_vert' },
    { valor: 'topProductos', nombre: 'Productos Más Vendidos', icono: 'trending_up' },
    { valor: 'rotacion', nombre: 'Análisis de Rotación', icono: 'loop' },
    { valor: 'stock', nombre: 'Reporte de Stock', icono: 'inventory' }
  ];

  constructor(
    private inventarioService: InventarioService,
    private errorMessages: ErrorMessagesService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Reportes Component cargado');
    // Establecer fechas por defecto (último mes)
    const hoy = new Date();
    this.fechaFin = hoy;
    this.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate());
    
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.loading = true;
    try {
      this.productos = await firstValueFrom(this.inventarioService.getProductos());
      this.movimientos = await firstValueFrom(this.inventarioService.getTodosLosMovimientos());
      
      this.calcularEstadisticas();
      console.log('✅ Datos cargados para reportes');
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar',
        text: this.errorMessages.getUserMessage(error, 'cargar datos')
      });
    } finally {
      this.loading = false;
    }
  }

  calcularEstadisticas(): void {
    // Valoración del inventario
    this.valorInventario = this.productos.reduce((sum, p) => 
      sum + (p.stock_actual * p.precio_compra), 0
    );
    
    this.totalProductos = this.productos.length;
    this.productosActivos = this.productos.filter(p => p.activo).length;

    // Agrupar por categorías
    const categoriasMap = new Map<string, any>();
    this.productos.forEach(p => {
      if (!categoriasMap.has(p.categoria)) {
        categoriasMap.set(p.categoria, {
          nombre: p.categoria,
          cantidad: 0,
          valor: 0,
          stock: 0
        });
      }
      const cat = categoriasMap.get(p.categoria)!;
      cat.cantidad++;
      cat.valor += p.stock_actual * p.precio_compra;
      cat.stock += p.stock_actual;
    });
    
    this.categorias = Array.from(categoriasMap.values()).sort((a, b) => b.valor - a.valor);

    // Top productos con stock alto/bajo
    this.topStockAlto = [...this.productos]
      .sort((a, b) => b.stock_actual - a.stock_actual)
      .slice(0, 10);
    
    this.topStockBajo = [...this.productos]
      .filter(p => p.stock_actual > 0)
      .sort((a, b) => a.stock_actual - b.stock_actual)
      .slice(0, 10);

    // Calcular productos más vendidos (basado en movimientos de salida)
    const ventasMap = new Map<string, number>();
    this.movimientos
      .filter(m => m.tipo === 'salida')
      .forEach(m => {
        const actual = ventasMap.get(m.producto_id) || 0;
        ventasMap.set(m.producto_id, actual + m.cantidad);
      });

    this.topVendidos = Array.from(ventasMap.entries())
      .map(([id, cantidad]) => ({
        producto: this.productos.find(p => p.id === id),
        cantidad
      }))
      .filter(item => item.producto)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);
  }

  cambiarReporte(tipo: string): void {
    this.reporteActual = tipo;
    this.calcularEstadisticas();
  }

  aplicarFiltroFechas(): void {
    this.calcularEstadisticas();
  }

  exportarExcel(): void {
    if (this.reporteActual === 'valoracion') {
      exportToCsv(`reporte_valoracion_${Date.now()}`, this.categorias, [
        { header: 'Categoría', value: row => row.nombre },
        { header: 'Productos', value: row => row.cantidad },
        { header: 'Stock Total', value: row => row.stock },
        { header: 'Valor', value: row => row.valor.toFixed(2) }
      ]);
    } else if (this.reporteActual === 'topProductos') {
      const rows = this.topVendidos.map((item, index) => ({ ...item, posicion: index + 1 }));
      exportToCsv(`reporte_top_productos_${Date.now()}`, rows, [
        { header: 'Posición', value: row => row.posicion },
        { header: 'Producto', value: row => row.producto?.nombre || '' },
        { header: 'Unidades vendidas', value: row => row.cantidad }
      ]);
    } else if (this.reporteActual === 'stock') {
      exportToCsv(`reporte_stock_${Date.now()}`, this.topStockBajo, [
        { header: 'Producto', value: row => row.nombre },
        { header: 'Stock', value: row => row.stock_actual },
        { header: 'Unidad', value: row => row.unidad_medida }
      ]);
    } else if (this.reporteActual === 'movimientos') {
      exportToCsv(`reporte_movimientos_${Date.now()}`, this.getMovimientosPeriodo(), [
        { header: 'Fecha', value: row => row.created_at },
        { header: 'Tipo', value: row => row.tipo },
        { header: 'Producto', value: row => row.producto_id },
        { header: 'Cantidad', value: row => row.cantidad }
      ]);
    }
  }

  exportarPDF(): void {
    console.log('📄 Exportar reporte a PDF');
    window.print();
  }

  imprimir(): void {
    window.print();
  }

  getMovimientosPorTipo() {
    const entradas = this.movimientos.filter(m => m.tipo === 'entrada').length;
    const salidas = this.movimientos.filter(m => m.tipo === 'salida').length;
    const ajustes = this.movimientos.filter(m => m.tipo === 'ajuste').length;
    
    return { entradas, salidas, ajustes, total: this.movimientos.length };
  }

  getMovimientosPeriodo() {
    if (!this.fechaInicio || !this.fechaFin) return [];
    
    return this.movimientos.filter(m => {
      const fecha = new Date(m.created_at);
      return fecha >= this.fechaInicio! && fecha <= this.fechaFin!;
    });
  }

  getAnalisisRotacion() {
    // Calcular rotación: ventas / stock promedio
    const rotaciones: any[] = [];
    
    this.productos.forEach(p => {
      const salidas = this.movimientos
        .filter(m => m.tipo === 'salida' && m.producto_id === p.id)
        .reduce((sum, m) => sum + m.cantidad, 0);
      
      const stockPromedio = p.stock_actual > 0 ? p.stock_actual : 1;
      const indiceRotacion = salidas / stockPromedio;
      
      if (salidas > 0) {
        rotaciones.push({
          producto: p,
          salidas,
          stockPromedio,
          indiceRotacion,
          diasCobertura: stockPromedio > 0 ? (stockPromedio / (salidas / 30)) : 0
        });
      }
    });
    
    return rotaciones.sort((a, b) => b.indiceRotacion - a.indiceRotacion);
  }
}

