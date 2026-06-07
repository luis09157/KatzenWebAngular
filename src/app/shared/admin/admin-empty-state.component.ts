import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-admin-empty-state',
  templateUrl: './admin-empty-state.component.html',
  styleUrls: ['./admin-empty-state.component.scss']
})
export class AdminEmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Sin registros';
  @Input() message = '';
  @Input() actionLabel = '';
  @Input() actionDisabled = false;
  @Output() action = new EventEmitter<void>();
}
