import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PortalAuthGuard } from './guards/portal-auth.guard';
import { PortalGuestGuard } from './guards/portal-guest.guard';
import { PortalLayoutComponent } from './layout/portal-layout.component';
import { PortalLoginComponent } from './login/portal-login.component';
import { PortalMascotasComponent } from './mascotas/portal-mascotas.component';
import { PortalMascotaDetalleComponent } from './mascota-detalle/portal-mascota-detalle.component';
import { PortalListSectionComponent } from './list-section/portal-list-section.component';
import { PortalNotificacionesComponent } from './notificaciones/portal-notificaciones.component';
import { PortalPerfilComponent } from './perfil/portal-perfil.component';

const routes: Routes = [
  {
    path: 'login',
    component: PortalLoginComponent,
    canActivate: [PortalGuestGuard]
  },
  {
    path: '',
    component: PortalLayoutComponent,
    canActivate: [PortalAuthGuard],
    children: [
      { path: 'mascotas', component: PortalMascotasComponent },
      { path: 'mascotas/:id', component: PortalMascotaDetalleComponent },
      { path: 'mascotas/:id/vacunas', component: PortalListSectionComponent },
      { path: 'mascotas/:id/citas', component: PortalListSectionComponent },
      { path: 'mascotas/:id/historial', component: PortalListSectionComponent },
      { path: 'notificaciones', component: PortalNotificacionesComponent },
      { path: 'perfil', component: PortalPerfilComponent },
      { path: '', redirectTo: 'mascotas', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PortalRoutingModule {}
