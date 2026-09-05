import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { dismissFlowHint, isFlowHintDismissed } from './flow-hint-dismiss.util';

export type FlowHintVariant = 'info' | 'warn' | 'success';
export type FlowHintLayout = 'inline' | 'footer';

@Component({
  selector: 'app-flow-hint',
  templateUrl: './flow-hint.component.html',
  styleUrls: ['./flow-hint.component.scss'],
})
export class FlowHintComponent implements OnChanges {
  /** Texto de la guía (si está vacío no se renderiza). */
  @Input() message = '';
  /** Icono Material opcional (ej. info, inventory_2). */
  @Input() icon = '';
  @Input() variant: FlowHintVariant = 'info';
  /** inline = caja punteada en el cuerpo; footer = barra bajo acciones del diálogo. */
  @Input() layout: FlowHintLayout = 'inline';
  /** Si hay id, se puede ocultar con «No volver a mostrar» (localStorage, spec 072). */
  @Input() hintId = '';

  dismissed = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hintId'] || changes['message']) {
      this.dismissed = isFlowHintDismissed(this.hintId, typeof localStorage === 'undefined' ? null : localStorage);
    }
  }

  get visible(): boolean {
    return !!this.message && !this.dismissed;
  }

  ocultar(): void {
    if (!this.hintId) return;
    dismissFlowHint(this.hintId, typeof localStorage === 'undefined' ? null : localStorage);
    this.dismissed = true;
  }
}
