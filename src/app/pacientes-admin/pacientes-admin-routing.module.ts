import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PacientesAdminComponent } from './pacientes-admin.component';

const routes: Routes = [
  { path: '', component: PacientesAdminComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PacientesAdminRoutingModule { } 