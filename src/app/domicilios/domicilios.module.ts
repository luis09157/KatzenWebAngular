import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedModule } from '../shared/shared.module';
import { DomicilioCotizadorComponent } from './cotizador/domicilio-cotizador.component';
import { DomicilioTarifasPanelComponent } from './tarifas-panel/domicilio-tarifas-panel.component';
import { DomicilioDialogComponent } from './dialog/domicilio-dialog.component';
import { DomiciliosMetricasComponent } from './metricas/domicilios-metricas.component';

/** Spec 107 — piezas de domicilio reutilizables (cotizador, configuración). */
@NgModule({
  declarations: [DomicilioCotizadorComponent, DomicilioTarifasPanelComponent, DomicilioDialogComponent, DomiciliosMetricasComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  exports: [DomicilioCotizadorComponent, DomicilioTarifasPanelComponent, DomicilioDialogComponent, DomiciliosMetricasComponent],
})
export class DomiciliosModule {}
