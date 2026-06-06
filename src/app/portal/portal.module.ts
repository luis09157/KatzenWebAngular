import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';

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
    MatBadgeModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatToolbarModule
  ]
})
export class PortalModule {}
