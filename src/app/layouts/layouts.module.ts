import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material Components
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

// Layout Components
import { AdminMainLayoutComponent } from './admin-main-layout.component';

@NgModule({
  declarations: [
    AdminMainLayoutComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    
    // Angular Material Modules
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule
  ],
  exports: [
    AdminMainLayoutComponent
  ]
})
export class LayoutsModule { }
