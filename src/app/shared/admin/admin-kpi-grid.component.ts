import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-kpi-grid',
  template: '<div class="kpi-grid"><ng-content></ng-content></div>',
  styles: [`
    :host { display: block; margin-bottom: 24px; min-width: 0; }
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
export class AdminKpiGridComponent {}
