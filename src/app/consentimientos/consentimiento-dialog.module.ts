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
import { ClientesDialogModule } from '../clientes/clientes-dialog.module';
import { PacienteAdminDialogModule } from '../pacientes-admin/paciente-admin-dialog.module';
import { ConsentimientoDialogComponent } from './consentimiento-dialog.component';
import { ConsentimientoPreviewDialogComponent } from './consentimiento-preview-dialog.component';

/** Diálogo de consentimiento sin routing — usable desde el expediente. */
@NgModule({
  declarations: [ConsentimientoDialogComponent, ConsentimientoPreviewDialogComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    ClientesDialogModule,
    PacienteAdminDialogModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  exports: [ConsentimientoDialogComponent],
})
export class ConsentimientoDialogModule {}
