import { Component, Input } from '@angular/core';
import { AdminModuleAccent } from './admin-module-card.component';

@Component({
  selector: 'app-admin-page-banner',
  templateUrl: './admin-page-banner.component.html',
  styleUrls: ['./admin-page-banner.component.scss']
})
export class AdminPageBannerComponent {
  @Input() icon = 'folder';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() accent: AdminModuleAccent = 'teal';
}
