import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// Material Modules
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';

// Components
import { PacientesAdminComponent } from './pacientes-admin.component';
import { PacienteAdminDialogComponent } from './paciente-admin-dialog.component';

// Services
import { PacientesService } from '../pacientes/pacientes.service';
import { ClientesService } from '../clientes/clientes.service';

// Log de depuración para módulo
console.log('🔍 PacientesAdminModule cargado');
console.log('🔍 PacientesAdminComponent declarado:', !!PacientesAdminComponent);
console.log('🔍 PacienteAdminDialogComponent declarado:', !!PacienteAdminDialogComponent);

const routes: Routes = [
  { path: '', component: PacientesAdminComponent }
];

@NgModule({
  declarations: [
    PacientesAdminComponent,
    PacienteAdminDialogComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    
    // Material Modules
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatSelectModule
  ],
  providers: [
    PacientesService,
    ClientesService
  ]
})
export class PacientesAdminModule { } 