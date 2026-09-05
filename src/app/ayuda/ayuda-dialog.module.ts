import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { AyudaDialogComponent } from './ayuda-dialog.component';

@NgModule({
  declarations: [AyudaDialogComponent],
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  exports: [AyudaDialogComponent],
})
export class AyudaDialogModule {}
