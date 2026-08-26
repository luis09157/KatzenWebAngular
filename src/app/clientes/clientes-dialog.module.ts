import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { SharedModule } from '../shared/shared.module';
import { ClienteDialogComponent } from './cliente-dialog.component';

/** Diálogo de cliente reutilizable sin rutas del módulo Clientes. */
@NgModule({
  declarations: [ClienteDialogComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    AngularFireStorageModule,
    SharedModule
  ],
  exports: [ClienteDialogComponent]
})
export class ClientesDialogModule {}
