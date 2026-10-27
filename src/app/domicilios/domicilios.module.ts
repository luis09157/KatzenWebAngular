import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SharedModule } from '../shared/shared.module';
import { DomicilioCotizadorComponent } from './cotizador/domicilio-cotizador.component';
import { DomicilioDialogComponent } from './dialog/domicilio-dialog.component';

/**
 * Spec 107 — cotizador y diálogo de domicilio (Baño, Cita, Cobrar).
 * Lo de Finanzas (configuración y métricas) vive en DomiciliosAdminModule para no pesar en la carga inicial.
 */
@NgModule({
  declarations: [DomicilioCotizadorComponent, DomicilioDialogComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  exports: [DomicilioCotizadorComponent, DomicilioDialogComponent],
})
export class DomiciliosModule {}
