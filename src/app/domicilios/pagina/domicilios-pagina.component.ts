import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ADMIN_DIALOG_FORM } from '../../core/config/admin-ui.config';
import { DomicilioTarifasDialogComponent } from '../tarifas-dialog/domicilio-tarifas-dialog.component';

/**
 * Spec 108 — pantalla propia de Domicilios (como Peluquería): números del mes, gráfica,
 * historial en tabla. La configuración (gasolina y ganancia) se abre en una ventana.
 * Ruta `/admin/finanzas/domicilios` (mismo permiso que Finanzas).
 */
@Component({
  selector: 'app-domicilios-pagina',
  templateUrl: './domicilios-pagina.component.html',
})
export class DomiciliosPaginaComponent {
  constructor(private dialog: MatDialog) {}

  abrirConfiguracion(): void {
    this.dialog.open(DomicilioTarifasDialogComponent, ADMIN_DIALOG_FORM);
  }
}
