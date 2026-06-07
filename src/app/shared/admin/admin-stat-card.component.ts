import { Component, Input } from '@angular/core';

export type AdminStatAccent = 'teal' | 'blue' | 'purple' | 'pink' | 'green' | 'orange';

@Component({
  selector: 'app-admin-stat-card',
  templateUrl: './admin-stat-card.component.html',
  styleUrls: ['./admin-stat-card.component.scss']
})
export class AdminStatCardComponent {
  @Input() icon = 'info';
  @Input() emoji = '';
  @Input() value: string | number = 0;
  @Input() label = '';
  /** Texto auxiliar bajo el número (ej. "en el sistema"). */
  @Input() hint = '';
  /** Color del borde superior — estilo tarjeta premium. */
  @Input() accent: AdminStatAccent = 'teal';
}
