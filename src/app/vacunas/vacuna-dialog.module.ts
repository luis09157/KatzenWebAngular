import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedModule } from '../shared/shared.module';
import { ClientesDialogModule } from '../clientes/clientes-dialog.module';
import { PacienteAdminDialogModule } from '../pacientes-admin/paciente-admin-dialog.module';
import { SalidaDialogModule } from '../inventario/movimientos/salida-dialog.module';
import { VisitasDialogModule } from '../visitas/visitas-dialog.module';
import { VacunaDialogComponent } from './vacuna-dialog.component';
import { VacunaEsquemaConfirmDialogComponent } from './vacuna-esquema-confirm-dialog.component';

/** Diálogo de vacuna sin routing — usable desde el asistente (spec 070). */
@NgModule({
  declarations: [VacunaDialogComponent, VacunaEsquemaConfirmDialogComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    ClientesDialogModule,
    PacienteAdminDialogModule,
    SalidaDialogModule,
    VisitasDialogModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
  ],
  exports: [VacunaDialogComponent],
})
export class VacunaDialogModule {}
