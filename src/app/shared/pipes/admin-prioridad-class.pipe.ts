import { Pipe, PipeTransform } from '@angular/core';
import { getPrioridadBadgeClass } from '../../core/utils/admin-status.util';

@Pipe({ name: 'adminPrioridadClass' })
export class AdminPrioridadClassPipe implements PipeTransform {
  transform(prioridad: string | null | undefined): string {
    return getPrioridadBadgeClass(prioridad);
  }
}
