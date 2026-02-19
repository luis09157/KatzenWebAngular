import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BaniosComponent } from './banios.component';

const routes: Routes = [
  {
    path: '',
    component: BaniosComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BaniosRoutingModule { }

export const baniosRoutes = routes;
