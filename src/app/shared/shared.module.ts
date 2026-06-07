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
import { AdminPageBannerComponent } from './admin/admin-page-banner.component';
import { AdminStatCardComponent } from './admin/admin-stat-card.component';
import { AdminEmptyStateComponent } from './admin/admin-empty-state.component';
import { AdminKpiGridComponent } from './admin/admin-kpi-grid.component';
import { AdminDataPanelComponent } from './admin/admin-data-panel.component';
import { AdminModuleCardComponent } from './admin/admin-module-card.component';
import { AdminEstadoClassPipe } from './pipes/admin-estado-class.pipe';
import { AdminPrioridadClassPipe } from './pipes/admin-prioridad-class.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';

@NgModule({
  declarations: [
    AutocompleteFieldComponent,
    AdminPageBannerComponent,
    AdminStatCardComponent,
    AdminEmptyStateComponent,
    AdminKpiGridComponent,
    AdminDataPanelComponent,
    AdminModuleCardComponent,
    AdminEstadoClassPipe,
    AdminPrioridadClassPipe
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule
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
    MatCardModule,
    AutocompleteFieldComponent,
    AdminPageBannerComponent,
    AdminStatCardComponent,
    AdminEmptyStateComponent,
    AdminKpiGridComponent,
    AdminDataPanelComponent,
    AdminModuleCardComponent,
    AdminEstadoClassPipe,
    AdminPrioridadClassPipe,
    MatCardModule,
    MatMenuModule
  ]
})
export class SharedModule { }
