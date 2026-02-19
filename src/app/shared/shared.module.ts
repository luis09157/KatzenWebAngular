import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

import { DiagnosticosService } from './diagnosticos.service';
import { TratamientosService } from './tratamientos.service';
import { MedicamentosService } from './medicamentos.service';
import { MigrationService } from './migration.service';
import { BaniosService } from '../banios/banios.service';
import { ValidationService } from './validation.service';
import { AutocompleteFieldComponent } from './autocomplete-field.component';

@NgModule({
  declarations: [
    AutocompleteFieldComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  providers: [
    DiagnosticosService,
    TratamientosService,
    MedicamentosService,
    MigrationService,
    BaniosService,
    ValidationService
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    AutocompleteFieldComponent
  ]
})
export class SharedModule { }
