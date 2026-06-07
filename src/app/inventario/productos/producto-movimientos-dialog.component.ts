import { Component, OnInit, Inject, ViewEncapsulation} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { Movimiento, Producto } from '../../shared/inventario.models';

@Component({
  selector: 'app-producto-movimientos-dialog',
  templateUrl: './producto-movimientos-dialog.component.html',
  styleUrls: ['./producto-movimientos-dialog.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ProductoMovimientosDialogComponent implements OnInit {
  movimientos: Movimiento[] = [];
  loading = true;
  producto: Producto;

  // Filtros
  filtroTipo = 'todos';
  
  displayedColumns: string[] = [
    'fecha',
    'tipo',
    'cantidad',
    'cantidad_anterior',
    'cantidad_nueva',
    'motivo'
  ];

  tiposMovimiento = [
    { valor: 'todos', etiqueta: 'Todos' },
    { valor: 'entrada', etiqueta: 'Entradas' },
    { valor: 'salida', etiqueta: 'Salidas' },
    { valor: 'ajuste', etiqueta: 'Ajustes' }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { producto: Producto },
    private dialogRef: MatDialogRef<ProductoMovimientosDialogComponent>,
    private inventarioService: InventarioService
  ) {
    this.producto = data.producto;
  }

  ngOnInit(): void {
    console.log('🔍 Cargando movimientos para:', this.producto.nombre);
    this.cargarMovimientos();
  }

  cargarMovimientos(): void {
    if (!this.producto.id) return;

    this.loading = true;
    this.inventarioService.getMovimientosPorProducto(this.producto.id).subscribe({
      next: (movimientos) => {
        this.movimientos = movimientos;
        console.log('✅ Movimientos cargados:', movimientos.length);
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar movimientos:', error);
        this.loading = false;
      }
    });
  }

  get movimientosFiltrados(): Movimiento[] {
    if (this.filtroTipo === 'todos') {
      return this.movimientos;
    }
    return this.movimientos.filter(m => m.tipo === this.filtroTipo);
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

  getEstadisticas() {
    const entradas = this.movimientos.filter(m => m.tipo === 'entrada');
    const salidas = this.movimientos.filter(m => m.tipo === 'salida');
    const ajustes = this.movimientos.filter(m => m.tipo === 'ajuste');

    const totalEntradas = entradas.reduce((sum, m) => sum + m.cantidad, 0);
    const totalSalidas = salidas.reduce((sum, m) => sum + m.cantidad, 0);
    const totalAjustes = ajustes.reduce((sum, m) => sum + m.cantidad, 0);

    return {
      totalMovimientos: this.movimientos.length,
      entradas: {
        cantidad: entradas.length,
        unidades: totalEntradas
      },
      salidas: {
        cantidad: salidas.length,
        unidades: totalSalidas
      },
      ajustes: {
        cantidad: ajustes.length,
        unidades: totalAjustes
      }
    };
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}

