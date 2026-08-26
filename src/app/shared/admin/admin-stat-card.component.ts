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

  /** Números con separador; strings (p. ej. $1,200.00) se muestran tal cual. */
  get displayValue(): string {
    if (typeof this.value === 'string') {
      const trimmed = this.value.trim();
      if (trimmed === '') return '0';
      if (Number.isNaN(Number(trimmed)) || /[^\d.,\s-]/.test(trimmed)) {
        return trimmed;
      }
      return Number(trimmed).toLocaleString('es-MX');
    }
    return (Number(this.value) || 0).toLocaleString('es-MX');
  }
}
