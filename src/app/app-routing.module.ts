import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminLayoutComponent } from './dashboard/admin-layout.component';
import { AdminMainLayoutComponent } from './layouts/admin-main-layout.component';

const routes: Routes = [
  { path: 'admin/login', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  {
    path: 'admin',
    component: AdminMainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'inicio', loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule) },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'usuarios', loadChildren: () => import('./usuarios/usuarios.module').then(m => m.UsuariosModule) },
      { path: 'cliente', loadChildren: () => import('./clientes/clientes.module').then(m => m.ClientesModule) },
      { path: 'paciente', loadChildren: () => import('./pacientes/pacientes.module').then(m => m.PacientesModule) },
      { path: 'citas', loadChildren: () => import('./citas/citas.module').then(m => m.CitasModule) },
      { path: 'historiales', loadChildren: () => import('./historiales/historiales.module').then(m => m.HistorialesModule) },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: '/admin/inicio', pathMatch: 'full' },
  { path: '**', redirectTo: '/admin/inicio' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}