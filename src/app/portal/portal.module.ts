import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PortalRoutingModule } from './portal-routing.module';
import { PortalLoginComponent } from './login/portal-login.component';
import { PortalLayoutComponent } from './layout/portal-layout.component';
import { PortalMascotasComponent } from './mascotas/portal-mascotas.component';
import { PortalMascotaDetalleComponent } from './mascota-detalle/portal-mascota-detalle.component';
import { PortalListSectionComponent } from './list-section/portal-list-section.component';
import { PortalNotificacionesComponent } from './notificaciones/portal-notificaciones.component';
import { PortalPerfilComponent } from './perfil/portal-perfil.component';

@NgModule({
  declarations: [
    PortalLoginComponent,
    PortalLayoutComponent,
    PortalMascotasComponent,
    PortalMascotaDetalleComponent,
    PortalListSectionComponent,
    PortalNotificacionesComponent,
    PortalPerfilComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PortalRoutingModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ]
})
export class PortalModule {}
