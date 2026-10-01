import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PosSheetModo } from './pos-sheet.util';

/**
 * Sheet producto / línea (qty + confirmar / quitar).
 * Spec 081 — presentacional; qty y confirmación las maneja el padre con `pos-sheet.util`.
 */
@Component({
  selector: 'app-pos-sheet-cantidad',
  templateUrl: './pos-sheet-cantidad.component.html',
})
export class PosSheetCantidadComponent {
  @Input() modo: PosSheetModo = 'producto';
  @Input() titulo = '';
  @Input() fotoUrl = '';
  @Input() iconoFallback = 'inventory_2';
  @Input() montoLabel = '';
  @Input() qty = 1;
  @Input() puedeQuitar = false;

  @Output() mas = new EventEmitter<void>();
  @Output() menos = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<void>();
  @Output() quitar = new EventEmitter<void>();

  get esLinea(): boolean {
    return this.modo === 'linea';
  }

  get labelConfirmar(): string {
    return this.esLinea ? 'Actualizar' : 'Agregar al ticket';
  }
}
