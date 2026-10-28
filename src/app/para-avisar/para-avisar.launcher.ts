import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ADMIN_DIALOG_FORM } from '../core/config/admin-ui.config';
import type { ParaAvisarResultado } from './para-avisar-dialog.component';

/** Abre «Para avisar hoy» cargándolo al momento (no pesa en la carga inicial). */
export async function abrirParaAvisar(dialog: MatDialog): Promise<ParaAvisarResultado | null> {
  const { ParaAvisarDialogComponent } = await import('./para-avisar-dialog.component');
  const ref = dialog.open(ParaAvisarDialogComponent, { ...ADMIN_DIALOG_FORM, width: '760px' });
  return (await firstValueFrom(ref.afterClosed())) || null;
}
