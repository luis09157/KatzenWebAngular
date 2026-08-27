import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VisitasComponent } from './visitas.component';

const routes: Routes = [{ path: '', component: VisitasComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VisitasRoutingModule {}
