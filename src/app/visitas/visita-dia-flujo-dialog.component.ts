import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VisitaDiaCitaContext, VisitaDiaFlujoAccion } from './visita-dia-flujo.models';

@Component({
  selector: 'app-visita-dia-flujo-dialog',
  templateUrl: './visita-dia-flujo-dialog.component.html',
  styleUrls: ['./visita-dia-flujo-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VisitaDiaFlujoDialogComponent {
  readonly puedeTicket: boolean;

  constructor(
    private dialogRef: MatDialogRef<VisitaDiaFlujoDialogComponent, VisitaDiaFlujoAccion | null>,
    @Inject(MAT_DIALOG_DATA) public data: { cita: VisitaDiaCitaContext }
  ) {
    const c = data?.cita;
    this.puedeTicket = !c?.visitaId && !c?.cajaMovimientoId && !c?.cobrada;
  }

  get pacienteLabel(): string {
    return this.data?.cita?.paciente || 'Paciente';
  }

  get clienteLabel(): string {
    return this.data?.cita?.cliente || 'Cliente';
  }

  get motivoLabel(): string {
    return this.data?.cita?.motivo || 'Consulta';
  }

  elegir(accion: VisitaDiaFlujoAccion): void {
    this.dialogRef.close(accion);
  }

  omitir(): void {
    this.dialogRef.close('omitir');
  }
}
