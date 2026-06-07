import { Component, Input } from '@angular/core';
import { AdminModuleAccent } from './admin-module-card.component';

@Component({
  selector: 'app-admin-data-panel',
  templateUrl: './admin-data-panel.component.html',
  styleUrls: ['./admin-data-panel.component.scss']
})
export class AdminDataPanelComponent {
  @Input() title = 'Listado';
  @Input() description = '';
  @Input() meta = '';
  @Input() showLegend = true;
  @Input() searchLabel = 'Buscar';
  @Input() searchPlaceholder = '';
  @Input() showSearch = false;
  @Input() accent: AdminModuleAccent = 'teal';
}
