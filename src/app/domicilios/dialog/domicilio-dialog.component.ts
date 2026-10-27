import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Cliente } from '../../core/models';
import { DomicilioDatos } from '../domicilio.models';

export interface DomicilioDialogData {
  cliente: Cliente | null;
  paciente?: string;
  valor?: DomicilioDatos | null;
}

/** Spec 107 — cotizar/agregar un domicilio desde Cobrar. Devuelve los datos o nada. */
@Component({
  selector: 'app-domicilio-dialog',
  template: `
    <div class="admin-dialog-shell">
      <header class="admin-dialog-header">
        <div class="admin-dialog-header__text">
          <h2 class="admin-dialog-title">Domicilio</h2>
          <p class="admin-dialog-subtitle">
            {{ data.paciente ? data.paciente + ' · ' : '' }}Se calcula con los km de su ficha. Puedes cambiar el precio.
          </p>
        </div>
        <button mat-icon-button type="button" class="admin-dialog-close" (click)="cerrar()" aria-label="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </header>
      <mat-dialog-content class="admin-dialog-body">
        <div class="admin-dialog-form admin-dialog-form--padded">
          <app-domicilio-cotizador
            [cliente]="data.cliente"
            [valor]="data.valor || null"
            (cambio)="domicilio = $event"
          ></app-domicilio-cotizador>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions class="admin-dialog-actions">
        <button mat-button type="button" (click)="cerrar()">Cancelar</button>
        <button
          mat-raised-button
          color="primary"
          class="btn-primary-teal"
          type="button"
          [disabled]="!domicilio"
          (click)="agregar()"
          data-cy="domicilio-agregar"
        >
          <mat-icon>add</mat-icon>
          Agregar al ticket
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class DomicilioDialogComponent {
  domicilio: DomicilioDatos | null = null;

  constructor(
    private dialogRef: MatDialogRef<DomicilioDialogComponent, DomicilioDatos | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: DomicilioDialogData
  ) {}

  cerrar(): void {
    this.dialogRef.close();
  }

  agregar(): void {
    if (this.domicilio) this.dialogRef.close(this.domicilio);
  }
}
