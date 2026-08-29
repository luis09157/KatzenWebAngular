import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { DiagnosticosService } from './diagnosticos.service';
import { TratamientosService } from './tratamientos.service';
import { MedicamentosService } from './medicamentos.service';
import { MigrationService } from './migration.service';
import { BaniosService } from '../banios/banios.service';
import { ValidationService } from './validation.service';
import { AutocompleteFieldComponent } from './autocomplete-field.component';
import { TimepickerFieldComponent } from './timepicker/timepicker-field.component';
import { TimepickerDialogComponent } from './timepicker/timepicker-dialog.component';
import { AdminPageBannerComponent } from './admin/admin-page-banner.component';
import { AdminStatCardComponent } from './admin/admin-stat-card.component';
import { AdminEmptyStateComponent } from './admin/admin-empty-state.component';
import { AdminKpiGridComponent } from './admin/admin-kpi-grid.component';
import { AdminDataPanelComponent } from './admin/admin-data-panel.component';
import { AdminModuleCardComponent } from './admin/admin-module-card.component';
import { ClientePacientePickerComponent } from './admin/cliente-paciente-picker.component';
import { ProductoPickerComponent } from './admin/producto-picker.component';
import { StaffPickerComponent } from './admin/staff-picker.component';
import { AdminEstadoClassPipe } from './pipes/admin-estado-class.pipe';
import { AdminPrioridadClassPipe } from './pipes/admin-prioridad-class.pipe';
import { AlergiasAlertaComponent } from './alergias/alergias-alerta.component';
import { AlergiasEditorComponent } from './alergias/alergias-editor.component';
import { FlowHintComponent } from './components/flow-hint/flow-hint.component';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    AutocompleteFieldComponent,
    TimepickerFieldComponent,
    TimepickerDialogComponent,
    AdminPageBannerComponent,
    AdminStatCardComponent,
    AdminEmptyStateComponent,
    AdminKpiGridComponent,
    AdminDataPanelComponent,
    AdminModuleCardComponent,
    AdminEstadoClassPipe,
    AdminPrioridadClassPipe,
    ClientePacientePickerComponent,
    ProductoPickerComponent,
    StaffPickerComponent,
    AlergiasAlertaComponent,
    AlergiasEditorComponent,
    FlowHintComponent
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
    MatDialogModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatAutocompleteModule,
    MatCardModule,
    MatMenuModule,
    RouterModule
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
    TimepickerFieldComponent,
    AdminPageBannerComponent,
    AdminStatCardComponent,
    AdminEmptyStateComponent,
    AdminKpiGridComponent,
    AdminDataPanelComponent,
    AdminModuleCardComponent,
    AdminEstadoClassPipe,
    AdminPrioridadClassPipe,
    ClientePacientePickerComponent,
    ProductoPickerComponent,
    StaffPickerComponent,
    AlergiasAlertaComponent,
    AlergiasEditorComponent,
    FlowHintComponent,
    MatAutocompleteModule,
    MatCardModule,
    MatMenuModule,
    RouterModule
  ]
})
export class SharedModule { }
