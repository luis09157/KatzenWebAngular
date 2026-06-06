import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContactosWebComponent } from './contactos-web.component';

const routes: Routes = [
  { path: '', component: ContactosWebComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContactosWebRoutingModule {}
