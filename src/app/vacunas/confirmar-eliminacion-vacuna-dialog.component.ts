import { Component, Inject, ViewEncapsulation} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-confirmar-eliminacion-vacuna-dialog',
  templateUrl: './confirmar-eliminacion-vacuna-dialog.component.html',
  styleUrls: ['./confirmar-eliminacion-vacuna-dialog.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ConfirmarEliminacionVacunaDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmarEliminacionVacunaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirmar() {
    this.dialogRef.close(true);
  }

  cancelar() {
    this.dialogRef.close(false);
  }

  getEstadoColor(estado: boolean): string {
    return estado ? '#4caf50' : '#ff9800';
  }

  getEstadoText(estado: boolean): string {
    return estado ? 'Aplicada' : 'Pendiente';
  }
}
