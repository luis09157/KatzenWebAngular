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

import { RecordatoriosRoutingModule } from './recordatorios-routing.module';
import { RecordatoriosComponent } from './recordatorios.component';
import { RecordatorioDialogComponent } from './recordatorio-dialog.component';
import { RecordatorioDetalleComponent } from './recordatorio-detalle.component';
import { SeleccionarClienteRecordatorioDialogComponent } from './seleccionar-cliente-recordatorio-dialog.component';

@NgModule({
  declarations: [
    RecordatoriosComponent,
    RecordatorioDialogComponent,
    RecordatorioDetalleComponent,
    SeleccionarClienteRecordatorioDialogComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RecordatoriosRoutingModule,
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
    RecordatorioDialogComponent,
    SeleccionarClienteRecordatorioDialogComponent
  ]
})
export class RecordatoriosModule { } 