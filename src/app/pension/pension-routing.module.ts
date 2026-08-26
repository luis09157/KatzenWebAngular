import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PensionComponent } from './pension.component';

const routes: Routes = [{ path: '', component: PensionComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PensionRoutingModule {}
