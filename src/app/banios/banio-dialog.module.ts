import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedModule } from '../shared/shared.module';
import { ClientesDialogModule } from '../clientes/clientes-dialog.module';
import { PacienteAdminDialogModule } from '../pacientes-admin/paciente-admin-dialog.module';
import { CajaDialogModule } from '../finanzas/caja-dialog.module';
import { VisitasDialogModule } from '../visitas/visitas-dialog.module';
import { BanioDialogComponent } from './banio-dialog.component';

/** Diálogo de baño sin routing — usable desde el asistente (spec 070). */
@NgModule({
  declarations: [BanioDialogComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    ClientesDialogModule,
    PacienteAdminDialogModule,
    CajaDialogModule,
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
    MatChipsModule,
    MatCheckboxModule,
    MatSlideToggleModule,
  ],
  exports: [BanioDialogComponent],
})
export class BanioDialogModule {}
