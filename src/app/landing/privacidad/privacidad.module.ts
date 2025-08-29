import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material Components
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';

// Privacidad Component
import { PrivacidadComponent } from './privacidad.component';

@NgModule({
  declarations: [
    PrivacidadComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    
    // Angular Material Modules
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule
  ],
  exports: [
    PrivacidadComponent
  ]
})
export class PrivacidadModule { }
