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
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { SharedModule } from '../shared/shared.module';
import { SalidaDialogModule } from '../inventario/movimientos/salida-dialog.module';
import { CajaDialogModule } from '../finanzas/caja-dialog.module';
import { VisitasDialogModule } from '../visitas/visitas-dialog.module';
import { HistorialDialogComponent } from './historial-dialog.component';
import { HistorialDetalleComponent } from './historial-detalle.component';

/** Diálogos de historial sin routing — usable desde el asistente (spec 070). */
@NgModule({
  declarations: [HistorialDialogComponent, HistorialDetalleComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    AngularFireStorageModule,
    SalidaDialogModule,
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
    MatCheckboxModule,
  ],
  exports: [HistorialDialogComponent, HistorialDetalleComponent],
})
export class HistorialDialogModule {}
