import { Component, EventEmitter, Output } from '@angular/core';

/**
 * Shell visual del bottom-sheet POS (backdrop + aside + cerrar).
 * Spec 081 — presentacional; estado/negocio sigue en `visita-dialog` + `pos-sheet.util`.
 * El padre monta el host con `*ngIf="sheetAbierta"`.
 */
@Component({
  selector: 'app-pos-sheet-panel',
  templateUrl: './pos-sheet-panel.component.html',
})
export class PosSheetPanelComponent {
  @Output() cerrar = new EventEmitter<void>();
}
