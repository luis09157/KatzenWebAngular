import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VisitaLinea } from './visitas.models';

/** Fila presentacional del sheet carrito (padre resuelve foto/icono/qty/flags). */
export interface PosSheetCarritoFila {
  linea: VisitaLinea;
  fotoUrl: string;
  icono: string;
  montoLabel: string;
  cantidad: number;
  puedeAjustar: boolean;
}

/**
 * Sheet carrito / ticket (lista + ± / quitar).
 * Spec 082 — presentacional; ajuste/quitar/abrir línea los maneja el padre.
 * Montar dentro de `app-pos-sheet-panel` (**081**); estado vía `pos-sheet.util` (**077**).
 */
@Component({
  selector: 'app-pos-sheet-carrito',
  templateUrl: './pos-sheet-carrito.component.html',
})
export class PosSheetCarritoComponent {
  @Input() filas: PosSheetCarritoFila[] = [];
  /** `false` cuando ya hay pago (mismo criterio que `pagado > 0` en el diálogo). */
  @Input() puedeQuitar = true;

  @Output() abrirLinea = new EventEmitter<VisitaLinea>();
  @Output() ajustar = new EventEmitter<{ linea: VisitaLinea; delta: number; event?: Event }>();
  @Output() quitar = new EventEmitter<{ linea: VisitaLinea; event?: Event }>();

  get vacio(): boolean {
    return !this.filas.length;
  }

  onAjustar(fila: PosSheetCarritoFila, delta: number, event: Event): void {
    this.ajustar.emit({ linea: fila.linea, delta, event });
  }

  onQuitar(fila: PosSheetCarritoFila, event: Event): void {
    this.quitar.emit({ linea: fila.linea, event });
  }
}
