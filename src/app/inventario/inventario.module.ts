import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InventarioRoutingModule } from './inventario-routing.module';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// Componentes
import { ProductosComponent } from './productos/productos.component';
import { ProductoDialogComponent } from './productos/producto-dialog.component';
import { ProductoMovimientosDialogComponent } from './productos/producto-movimientos-dialog.component';
import { DashboardInventarioComponent } from './dashboard-inventario/dashboard-inventario.component';
import { EntradaDialogComponent } from './movimientos/entrada-dialog.component';
import { SalidaDialogComponent } from './movimientos/salida-dialog.component';
import { AjusteDialogComponent } from './movimientos/ajuste-dialog.component';
import { MovimientosComponent } from './movimientos/movimientos.component';
import { MovimientoDetalleDialogComponent } from './movimientos/movimiento-detalle-dialog.component';
import { ProveedoresComponent } from './proveedores/proveedores.component';
import { ProveedorDialogComponent } from './proveedores/proveedor-dialog.component';
import { OrdenesComponent } from './ordenes/ordenes.component';
import { OrdenDialogComponent } from './ordenes/orden-dialog.component';
import { RecibirOrdenDialogComponent } from './ordenes/recibir-orden-dialog.component';
import { AlertasComponent } from './alertas/alertas.component';
import { ReportesComponent } from './reportes/reportes.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    ProductosComponent,
    ProductoDialogComponent,
    ProductoMovimientosDialogComponent,
    DashboardInventarioComponent,
    EntradaDialogComponent,
    SalidaDialogComponent,
    AjusteDialogComponent,
    MovimientosComponent,
    MovimientoDetalleDialogComponent,
    ProveedoresComponent,
    ProveedorDialogComponent,
    OrdenesComponent,
    OrdenDialogComponent,
    RecibirOrdenDialogComponent,
    AlertasComponent,
    ReportesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InventarioRoutingModule,
    // Material
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
    MatCheckboxModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatDividerModule,
    MatSlideToggleModule,
    SharedModule
  ]
})
export class InventarioModule { }

