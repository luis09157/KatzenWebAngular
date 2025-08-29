import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminLayoutComponent } from './dashboard/admin-layout.component';
import { AdminMainLayoutComponent } from './layouts/admin-main-layout.component';
import { LandingComponent } from './landing/landing.component';
import { PrivacidadComponent } from './landing/privacidad/privacidad.component';

// Log de depuración para routing
console.log('🔍 AppRoutingModule cargado');

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'privacidad', component: PrivacidadComponent },
  { path: 'admin/login', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  {
    path: 'admin',
    component: AdminMainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'inicio', loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule) },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'usuarios', loadChildren: () => import('./usuarios/usuarios.module').then(m => m.UsuariosModule) },
      { path: 'clientes', loadChildren: () => import('./clientes/clientes.module').then(m => m.ClientesModule) },
      { path: 'paciente', loadChildren: () => import('./pacientes/pacientes.module').then(m => m.PacientesModule) },
      { path: 'pacientes-admin', loadChildren: () => import('./pacientes-admin/pacientes-admin.module').then(m => m.PacientesAdminModule) },
      { path: 'citas', loadChildren: () => import('./citas/citas.module').then(m => m.CitasModule) },
      { path: 'historiales', loadChildren: () => import('./historiales/historiales.module').then(m => m.HistorialesModule) },
      { path: 'recordatorios', loadChildren: () => import('./recordatorios/recordatorios.module').then(m => m.RecordatoriosModule) },
      { path: 'vacunas', loadChildren: () => import('./vacunas/vacunas.module').then(m => m.VacunasModule) },
      { path: 'banios', loadChildren: () => import('./banios/banios.module').then(m => m.BaniosModule) },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}