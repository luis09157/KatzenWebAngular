import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Componentes
import { BaniosComponent } from './banios.component';
import { BanioDialogComponent } from './banio-dialog.component';
import { BanioDetalleComponent } from './banio-detalle.component';
import { SeleccionarClienteBanioDialogComponent } from './seleccionar-cliente-banio-dialog.component';

// Servicios
import { BaniosService } from './banios.service';

// Rutas
import { baniosRoutes } from './banios-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    BaniosComponent,
    BanioDialogComponent,
    BanioDetalleComponent,
    SeleccionarClienteBanioDialogComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(baniosRoutes),
    
    // Angular Material
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    SharedModule
  ],
  providers: [
    BaniosService
  ]
})
export class BaniosModule { }
