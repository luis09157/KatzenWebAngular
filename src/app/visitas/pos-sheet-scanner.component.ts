import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Sheet escáner / pegar código POS.
 * Spec 081 — presentacional; match de catálogo vía `resolverProductoEscaneado` en el padre.
 */
@Component({
  selector: 'app-pos-sheet-scanner',
  templateUrl: './pos-sheet-scanner.component.html',
})
export class PosSheetScannerComponent {
  @Input() codigo = '';
  @Output() codigoChange = new EventEmitter<string>();
  @Output() buscar = new EventEmitter<void>();

  onCodigo(value: string): void {
    this.codigo = value;
    this.codigoChange.emit(value);
  }
}
