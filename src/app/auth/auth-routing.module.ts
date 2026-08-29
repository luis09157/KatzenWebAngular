import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth.component';
import { ContextoSelectorComponent } from './contexto-selector.component';
import { StaffLoginGuestGuard } from './staff-login-guest.guard';

const routes: Routes = [
  { path: '', component: AuthComponent, canActivate: [StaffLoginGuestGuard] },
  { path: 'contexto', component: ContextoSelectorComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
