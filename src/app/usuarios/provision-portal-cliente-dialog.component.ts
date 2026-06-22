import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PortalClienteRow } from './portal-clientes.service';

@Component({
  selector: 'app-provision-portal-cliente-dialog',
  templateUrl: './provision-portal-cliente-dialog.component.html',
  styleUrls: ['./provision-portal-cliente-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProvisionPortalClienteDialogComponent {
  confirmado = false;

  constructor(
    public dialogRef: MatDialogRef<ProvisionPortalClienteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cliente: PortalClienteRow }
  ) {}

  cancelar(): void {
    this.dialogRef.close(null);
  }

  confirmar(): void {
    if (!this.confirmado) {
      return;
    }
    this.dialogRef.close({ clienteId: this.data.cliente.id });
  }
}
