import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { SharedModule } from '../shared/shared.module';
import { DomicilioTarifasPanelComponent } from './tarifas-panel/domicilio-tarifas-panel.component';
import { DomiciliosMetricasComponent } from './metricas/domicilios-metricas.component';
import { DomiciliosPaginaComponent } from './pagina/domicilios-pagina.component';

/** Spec 107 — Finanzas: configuración de domicilios y métricas (carga diferida con Finanzas). */
@NgModule({
  declarations: [DomicilioTarifasPanelComponent, DomiciliosMetricasComponent, DomiciliosPaginaComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  exports: [DomicilioTarifasPanelComponent, DomiciliosMetricasComponent, DomiciliosPaginaComponent],
})
export class DomiciliosAdminModule {}
