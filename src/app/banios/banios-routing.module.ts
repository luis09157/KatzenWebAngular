import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BaniosComponent } from './banios.component';
import { BaniosTestingComponent } from './banios-testing.component';

const routes: Routes = [
  {
    path: '',
    component: BaniosComponent
  },
  {
    path: 'testing',
    component: BaniosTestingComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BaniosRoutingModule { }

export const baniosRoutes = routes;
