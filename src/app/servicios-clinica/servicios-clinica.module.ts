import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SharedModule } from '../shared/shared.module';
import { ServiciosClinicaRoutingModule } from './servicios-clinica-routing.module';
import { ServiciosClinicaComponent } from './servicios-clinica.component';
import { ServicioClinicaDialogModule } from './servicio-clinica-dialog.module';

@NgModule({
  declarations: [ServiciosClinicaComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ServiciosClinicaRoutingModule,
    SharedModule,
    ServicioClinicaDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ]
})
export class ServiciosClinicaModule {}
