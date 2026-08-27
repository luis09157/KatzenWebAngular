import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ADMIN_DIALOG_CONFIG } from '../core/config/admin-ui.config';
import {
  VisitaDiaCitaContext,
  VisitaDiaFlujoAccion,
  puedeOfrecerFlujoVisitaDia
} from './visita-dia-flujo.models';
import { VisitaDiaFlujoDialogComponent } from './visita-dia-flujo-dialog.component';

@Injectable({ providedIn: 'root' })
export class VisitaDiaFlujoService {
  constructor(private dialog: MatDialog) {}

  /** Abre selector post-cita; null si no aplica o usuario cierra sin elegir. */
  async ofrecerFlujo(cita: VisitaDiaCitaContext): Promise<VisitaDiaFlujoAccion | null> {
    if (!puedeOfrecerFlujoVisitaDia(cita)) return null;
    const accion = await firstValueFrom(
      this.dialog
        .open(VisitaDiaFlujoDialogComponent, {
          ...ADMIN_DIALOG_CONFIG,
          width: '520px',
          disableClose: false,
          data: { cita }
        })
        .afterClosed()
    );
    return accion || null;
  }
}
