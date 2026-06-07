import { Pipe, PipeTransform } from '@angular/core';
import { getEstadoBadgeClass } from '../../core/utils/admin-status.util';

@Pipe({ name: 'adminEstadoClass' })
export class AdminEstadoClassPipe implements PipeTransform {
  transform(estado: string | boolean | null | undefined): string {
    return getEstadoBadgeClass(estado);
  }
}
