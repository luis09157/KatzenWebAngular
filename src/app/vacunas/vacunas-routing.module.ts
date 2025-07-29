import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VacunasComponent } from './vacunas.component';

const routes: Routes = [
  { path: '', component: VacunasComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VacunasRoutingModule { } 