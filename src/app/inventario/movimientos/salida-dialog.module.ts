import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { CajaDialogModule } from '../../finanzas/caja-dialog.module';
import { VisitasDialogModule } from '../../visitas/visitas-dialog.module';
import { SharedModule } from '../../shared/shared.module';
import { SalidaDialogComponent } from './salida-dialog.component';

@NgModule({
  declarations: [SalidaDialogComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    CajaDialogModule,
    VisitasDialogModule,
    SharedModule
  ],
  exports: [SalidaDialogComponent]
})
export class SalidaDialogModule {}
