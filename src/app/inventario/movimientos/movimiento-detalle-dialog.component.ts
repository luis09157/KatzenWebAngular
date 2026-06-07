import { Component, Inject, ViewEncapsulation} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Movimiento, Producto } from '../../shared/inventario.models';

export interface MovimientoDetalleData {
  movimiento: Movimiento;
  producto?: Producto;
}

@Component({
  selector: 'app-movimiento-detalle-dialog',
  templateUrl: './movimiento-detalle-dialog.component.html',
  styleUrls: ['./movimiento-detalle-dialog.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class MovimientoDetalleDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: MovimientoDetalleData) {}

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-MX');
  }
}
