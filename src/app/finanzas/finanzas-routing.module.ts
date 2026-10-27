import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FinanzasComponent } from './finanzas.component';
import { DomiciliosPaginaComponent } from '../domicilios/pagina/domicilios-pagina.component';

const routes: Routes = [
  { path: '', component: FinanzasComponent },
  // Spec 108 — pantalla propia de Domicilios (mismo permiso que Finanzas).
  { path: 'domicilios', component: DomiciliosPaginaComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinanzasRoutingModule {}
