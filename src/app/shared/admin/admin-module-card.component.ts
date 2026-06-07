import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

export type AdminModuleAccent = 'teal' | 'blue' | 'purple' | 'pink' | 'green' | 'orange';

@Component({
  selector: 'app-admin-module-card',
  templateUrl: './admin-module-card.component.html',
  styleUrls: ['./admin-module-card.component.scss']
})
export class AdminModuleCardComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() route = '';
  @Input() accent: AdminModuleAccent = 'teal';
  @Input() ctaLabel = 'Explorar';

  constructor(private router: Router) {}

  navigate(): void {
    if (!this.route) {
      return;
    }
    const slug = this.route.replace(/^\/admin\//, '').replace(/^\//, '');
    this.router.navigate(['/admin', slug]);
  }
}
