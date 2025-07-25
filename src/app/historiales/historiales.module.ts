import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistorialesRoutingModule } from './historiales-routing.module';
import { HistorialesComponent } from './historiales.component';
import { HistorialDialogComponent } from './historial-dialog.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@NgModule({
  declarations: [
    HistorialesComponent,
    HistorialDialogComponent
  ],
  imports: [
    CommonModule,
    HistorialesRoutingModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatPaginatorModule,
    MatSelectModule,
    MatAutocompleteModule
  ]
})
export class HistorialesModule { }
