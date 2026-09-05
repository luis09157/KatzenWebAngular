import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MANUAL_USUARIO_FLUJOS } from './manual-usuario.content';

@Component({
  selector: 'app-ayuda-dialog',
  templateUrl: './ayuda-dialog.component.html',
  styleUrls: ['./ayuda-dialog.component.scss'],
})
export class AyudaDialogComponent {
  readonly flujos = MANUAL_USUARIO_FLUJOS;

  constructor(private dialogRef: MatDialogRef<AyudaDialogComponent>) {}

  cerrar(): void {
    this.dialogRef.close();
  }
}
