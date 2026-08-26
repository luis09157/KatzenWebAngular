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
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SharedModule } from '../shared/shared.module';
import { CajaDialogModule } from '../finanzas/caja-dialog.module';
import { SalidaDialogModule } from '../inventario/movimientos/salida-dialog.module';
import { PensionRoutingModule } from './pension-routing.module';
import { PensionComponent } from './pension.component';
import { PensionDialogComponent } from './pension-dialog.component';

@NgModule({
  declarations: [PensionComponent, PensionDialogComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PensionRoutingModule,
    SharedModule,
    CajaDialogModule,
    SalidaDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ]
})
export class PensionModule {}
