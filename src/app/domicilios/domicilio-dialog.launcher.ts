import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ADMIN_DIALOG_FORM } from '../core/config/admin-ui.config';
import type { DomicilioDialogData } from './dialog/domicilio-dialog.component';
import { DomicilioDatos } from './domicilio.models';

/**
 * Spec 107 — abre el cotizador de domicilio cargándolo al momento (no pesa en la carga inicial).
 * Devuelve los datos elegidos o null si se cancela.
 */
export async function abrirDomicilioDialog(dialog: MatDialog, data: DomicilioDialogData): Promise<DomicilioDatos | null> {
  const { DomicilioDialogComponent } = await import('./dialog/domicilio-dialog.component');
  const ref = dialog.open<unknown, DomicilioDialogData, DomicilioDatos | undefined>(DomicilioDialogComponent, {
    ...ADMIN_DIALOG_FORM,
    data,
  });
  return (await firstValueFrom(ref.afterClosed())) || null;
}
