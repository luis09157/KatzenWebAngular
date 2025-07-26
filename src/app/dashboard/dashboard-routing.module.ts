import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { ExpedientePacienteComponent } from './expediente-paciente/expediente-paciente.component';

const routes: Routes = [
  { path: '', component: ExpedientePacienteComponent },
  { path: 'inicio', component: ExpedientePacienteComponent },
  { path: 'dashboard', component: DashboardComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
