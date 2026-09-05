import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { SharedModule } from '../shared/shared.module';
import { ClientesDialogModule } from '../clientes/clientes-dialog.module';
import { PacienteAdminDialogModule } from '../pacientes-admin/paciente-admin-dialog.module';
import { CitaDialogModule } from '../citas/cita-dialog.module';
import { PensionDialogModule } from '../pension/pension-dialog.module';
import { HistorialDialogModule } from '../historiales/historial-dialog.module';
import { VacunaDialogModule } from '../vacunas/vacuna-dialog.module';
import { BanioDialogModule } from '../banios/banio-dialog.module';
import { AltaRapidaDialogComponent } from './alta-rapida-dialog.component';

@NgModule({
  declarations: [AltaRapidaDialogComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    ClientesDialogModule,
    PacienteAdminDialogModule,
    CitaDialogModule,
    PensionDialogModule,
    HistorialDialogModule,
    VacunaDialogModule,
    BanioDialogModule,
  ],
  exports: [AltaRapidaDialogComponent],
})
export class AltaRapidaDialogModule {}
