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
import { MatCheckboxModule } from '@angular/material/checkbox';

import { VacunasRoutingModule } from './vacunas-routing.module';
import { VacunasComponent } from './vacunas.component';
import { VacunaDialogComponent } from './vacuna-dialog.component';
import { VacunaDetalleComponent } from './vacuna-detalle.component';
import { SeleccionarClienteVacunaDialogComponent } from './seleccionar-cliente-vacuna-dialog.component';

@NgModule({
  declarations: [
    VacunasComponent,
    VacunaDialogComponent,
    VacunaDetalleComponent,
    SeleccionarClienteVacunaDialogComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    VacunasRoutingModule,
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
    MatProgressSpinnerModule,
    MatCheckboxModule
  ],
  exports: [
    VacunaDialogComponent,
    SeleccionarClienteVacunaDialogComponent
  ]
})
export class VacunasModule { } 