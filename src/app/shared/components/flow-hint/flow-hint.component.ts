import { Component, Input } from '@angular/core';

export type FlowHintVariant = 'info' | 'warn' | 'success';
export type FlowHintLayout = 'inline' | 'footer';

@Component({
  selector: 'app-flow-hint',
  templateUrl: './flow-hint.component.html',
  styleUrls: ['./flow-hint.component.scss']
})
export class FlowHintComponent {
  /** Texto de la guía (si está vacío no se renderiza). */
  @Input() message = '';
  /** Icono Material opcional (ej. info, inventory_2). */
  @Input() icon = '';
  @Input() variant: FlowHintVariant = 'info';
  /** inline = caja punteada en el cuerpo; footer = barra bajo acciones del diálogo. */
  @Input() layout: FlowHintLayout = 'inline';
}
