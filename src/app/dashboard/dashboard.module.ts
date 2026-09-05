import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { AdminLayoutComponent } from './admin-layout.component';
import { ExpedientePacienteComponent } from './expediente-paciente/expediente-paciente.component';
import { CitasDiaDialogComponent } from './citas-dia-dialog.component';
import { InversionMetaDialogComponent } from './inversion-meta-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { CitasService } from '../citas/citas.service';
import { BaniosService } from '../banios/banios.service';
import { VisitasService } from '../visitas/visitas.service';
import { PensionService } from '../pension/pension.service';
import { VacunasService } from '../vacunas/vacunas.service';
import { HistorialesService } from '../historiales/historiales.service';
import { ClientesService } from '../clientes/clientes.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { SharedModule } from '../shared/shared.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AltaRapidaDialogModule } from '../alta-rapida/alta-rapida-dialog.module';
import { VisitasDialogModule } from '../visitas/visitas-dialog.module';
import { CajaDialogModule } from '../finanzas/caja-dialog.module';
import { RecordatoriosService } from '../recordatorios/recordatorios.service';
import { InventarioService } from '../inventario/inventario.service';

@NgModule({
  declarations: [
    DashboardComponent,
    AdminLayoutComponent,
    ExpedientePacienteComponent,
    CitasDiaDialogComponent,
    InversionMetaDialogComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DashboardRoutingModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatMenuModule,
    MatDividerModule,
    MatSidenavModule,
    MatListModule,
    MatDialogModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    SharedModule,
    RouterModule,
    AltaRapidaDialogModule,
    VisitasDialogModule,
    CajaDialogModule,
  ],
  providers: [
    CitasService,
    BaniosService,
    VisitasService,
    PensionService,
    VacunasService,
    HistorialesService,
    ClientesService,
    PacientesService,
    RecordatoriosService,
    InventarioService,
  ],
})
export class DashboardModule {}
