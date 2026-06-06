import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { StaffRoleGuard } from './auth/staff-role.guard';
import { AdminMainLayoutComponent } from './layouts/admin-main-layout.component';
import { LandingComponent } from './landing/landing.component';
import { PrivacidadComponent } from './landing/privacidad/privacidad.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'privacidad', component: PrivacidadComponent },
  { path: 'portal', loadChildren: () => import('./portal/portal.module').then(m => m.PortalModule) },
  { path: 'admin/login', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  {
    path: 'admin',
    component: AdminMainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'inicio',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
        canActivate: [StaffRoleGuard],
        data: { staffModule: 'inicio' }
      },
      {
        path: 'usuarios',
        loadChildren: () => import('./usuarios/usuarios.module').then(m => m.UsuariosModule),
        canActivate: [StaffRoleGuard],
        data: { staffModule: 'usuarios' }
      },
      {
        path: 'clientes',
        loadChildren: () => import('./clientes/clientes.module').then(m => m.ClientesModule),
        canActivate: [StaffRoleGuard],
        data: { staffModule: 'clientes' }
      },
      {
        path: 'contactos-web',
        loadChildren: () => import('./contactos-web/contactos-web.module').then(m => m.ContactosWebModule),
        canActivate: [StaffRoleGuard],
        data: { staffModule: 'contactos-web' }
      },
      {
        path: 'paciente',
        loadChildren: () => import('./pacientes/pacientes.module').then(m => m.PacientesModule),
        canActivate: [StaffRoleGuard],
        data: { staffModule: 'paciente' }
      },
      {
        path: 'pacientes-admin',
        loadChildren: () => import('./pacientes-admin/pacientes-admin.module').then(m => m.PacientesAdminModule),
        canActivate: [StaffRoleGuard],
        data: { staffModule: 'pacientes-admin' }
      },
      {
        path: 'citas',
        loadChildren: () => import('./citas/citas.module').then(m => m.CitasModule),
        canActivate: [StaffRoleGuard],
        data: { staffModule: 'citas' }
      },
      {
        path: 'historiales',
        loadChildren: () => import('./historiales/historiales.module').then(m => m.HistorialesModule),
        canActivate: [StaffRoleGuard],
        data: { staffModule: 'historiales' }
      },
      {
        path: 'recordatorios',
        loadChildren: () => import('./recordatorios/recordatorios.module').then(m => m.RecordatoriosModule),
        canActivate: [StaffRoleGuard],
        data: { staffModule: 'recordatorios' }
      },
      {
        path: 'vacunas',
        loadChildren: () => import('./vacunas/vacunas.module').then(m => m.VacunasModule),
        canActivate: [StaffRoleGuard],
        data: { staffModule: 'vacunas' }
      },
      {
        path: 'banios',
        loadChildren: () => import('./banios/banios.module').then(m => m.BaniosModule),
        canActivate: [StaffRoleGuard],
        data: { staffModule: 'banios' }
      },
      {
        path: 'inventario',
        loadChildren: () => import('./inventario/inventario.module').then(m => m.InventarioModule),
        canActivate: [StaffRoleGuard],
        data: { staffModule: 'inventario' }
      },
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
