import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { HistorialesRoutingModule } from './historiales-routing.module';
import { HistorialesComponent } from './historiales.component';
import { HistorialDialogComponent } from './historial-dialog.component';
import { HistorialDetalleComponent } from './historial-detalle.component';
import { SeleccionarClienteDialogComponent } from './seleccionar-cliente-dialog.component';

@NgModule({
  declarations: [
    HistorialesComponent,
    HistorialDialogComponent,
    HistorialDetalleComponent,
    SeleccionarClienteDialogComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HistorialesRoutingModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatPaginatorModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  exports: [
    HistorialDialogComponent,
    HistorialDetalleComponent,
    SeleccionarClienteDialogComponent
  ]
})
export class HistorialesModule { }
