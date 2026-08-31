import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ServiciosClinicaComponent } from './servicios-clinica.component';

const routes: Routes = [{ path: '', component: ServiciosClinicaComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServiciosClinicaRoutingModule {}
