import { Component, Input } from '@angular/core';
import { AdminModuleAccent } from './admin-module-card.component';

@Component({
  selector: 'app-admin-page-banner',
  templateUrl: './admin-page-banner.component.html',
  styleUrls: ['./admin-page-banner.component.scss'],
  host: { '[attr.title]': 'null' },
})
export class AdminPageBannerComponent {
  @Input() icon = 'folder';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() accent: AdminModuleAccent = 'teal';
  /** Chip opcional junto al título (p. ej. folio de expediente). */
  @Input() badge = '';
}
