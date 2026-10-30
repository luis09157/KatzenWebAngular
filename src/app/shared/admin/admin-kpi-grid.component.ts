import { Component, ContentChildren, HostBinding, QueryList } from '@angular/core';
import { AdminStatCardComponent } from './admin-stat-card.component';
import { resumenKpiVacio } from './admin-kpi-vacio.util';

@Component({
  selector: 'app-admin-kpi-grid',
  template: '<div class="kpi-grid"><ng-content></ng-content></div>',
  styles: [`
    :host { display: block; margin-bottom: 24px; min-width: 0; }
    /* 2026-10-30 — todo en cero: no se muestra (ver admin-kpi-vacio.util). */
    :host(.kpi-vacio) { display: none; }
    .kpi-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--admin-gap-card, 16px);
    }
    @container admin-page (min-width: 560px) {
      .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @container admin-page (min-width: 1100px) {
      .kpi-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
    /* Fallback viewport: no reducir gap por debajo de 16px (spec 061 SC-003). */
    @media (max-width: 1100px) {
      .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 600px) {
      .kpi-grid { grid-template-columns: 1fr; }
      :host { margin-bottom: 16px; }
    }
  `]
})
export class AdminKpiGridComponent {
  @ContentChildren(AdminStatCardComponent) tarjetas?: QueryList<AdminStatCardComponent>;

  @HostBinding('class.kpi-vacio')
  get vacio(): boolean {
    return resumenKpiVacio(this.tarjetas?.toArray() || []);
  }
}
