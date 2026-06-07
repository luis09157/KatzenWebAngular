import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-kpi-grid',
  template: '<div class="kpi-grid"><ng-content></ng-content></div>',
  styles: [`
    :host { display: block; margin-bottom: 24px; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
    }
    @media (max-width: 1100px) {
      .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 600px) {
      .kpi-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminKpiGridComponent {}
