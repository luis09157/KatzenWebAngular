import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

/** Spec 108 — «Cuánto cobrar por domicilio» en una ventana (no ocupa espacio en la pantalla). */
@Component({
  selector: 'app-domicilio-tarifas-dialog',
  template: `
    <div class="admin-dialog-shell">
      <header class="admin-dialog-header">
        <div class="admin-dialog-header__text">
          <h2 class="admin-dialog-title">Gasolina y ganancia</h2>
          <p class="admin-dialog-subtitle">
            km × veces que se recorre ÷ km por litro × precio del litro = gasolina. Se cobra la gasolina × tu múltiplo.
            La veterinaria siempre puede cambiar el precio.
          </p>
        </div>
        <button mat-icon-button type="button" class="admin-dialog-close" (click)="cerrar()" aria-label="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </header>
      <mat-dialog-content class="admin-dialog-body">
        <div class="admin-dialog-form admin-dialog-form--padded">
          <app-domicilio-tarifas-panel modo="dialog" (guardado)="cerrar(true)"></app-domicilio-tarifas-panel>
        </div>
      </mat-dialog-content>
    </div>
  `,
})
export class DomicilioTarifasDialogComponent {
  constructor(private ref: MatDialogRef<DomicilioTarifasDialogComponent>) {}

  cerrar(guardado = false): void {
    this.ref.close(guardado);
  }
}
