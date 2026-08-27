import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedModule } from '../shared/shared.module';
import { CajaDialogModule } from '../finanzas/caja-dialog.module';
import { VisitaDialogComponent } from './visita-dialog.component';
import { ClienteCuentaDialogComponent } from './cliente-cuenta-dialog.component';
import { VisitaDiaFlujoDialogComponent } from './visita-dia-flujo-dialog.component';

/** Diálogos de visitas — usable desde clientes, citas, baños, expediente. */
@NgModule({
  declarations: [VisitaDialogComponent, ClienteCuentaDialogComponent, VisitaDiaFlujoDialogComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    SharedModule,
    CajaDialogModule
  ],
  exports: [VisitaDialogComponent, ClienteCuentaDialogComponent, VisitaDiaFlujoDialogComponent]
})
export class VisitasDialogModule {}
