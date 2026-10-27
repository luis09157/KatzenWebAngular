import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ADMIN_DIALOG_FORM } from '../core/config/admin-ui.config';
import type { CierreDiaResultado } from './cierre-dia-dialog.component';

/** Abre «Cierre del día» cargándolo al momento (no pesa en la carga inicial). */
export async function abrirCierreDia(dialog: MatDialog): Promise<CierreDiaResultado | null> {
  const { CierreDiaDialogComponent } = await import('./cierre-dia-dialog.component');
  const ref = dialog.open(CierreDiaDialogComponent, { ...ADMIN_DIALOG_FORM, width: '720px' });
  return (await firstValueFrom(ref.afterClosed())) || null;
}
