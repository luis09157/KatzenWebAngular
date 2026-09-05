import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CajaMovimientoDialogComponent } from './caja-movimiento-dialog.component';
import { CajaCorteDialogComponent } from './caja-corte-dialog.component';
import { CajaCorteBannerComponent } from './caja-corte-banner.component';

@NgModule({
  declarations: [CajaMovimientoDialogComponent, CajaCorteDialogComponent, CajaCorteBannerComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
  ],
  exports: [CajaMovimientoDialogComponent, CajaCorteDialogComponent, CajaCorteBannerComponent],
})
export class CajaDialogModule {}
