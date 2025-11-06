import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardInventarioComponent } from './dashboard-inventario/dashboard-inventario.component';
import { ProductosComponent } from './productos/productos.component';
import { MovimientosComponent } from './movimientos/movimientos.component';
import { ProveedoresComponent } from './proveedores/proveedores.component';
import { OrdenesComponent } from './ordenes/ordenes.component';
import { AlertasComponent } from './alertas/alertas.component';
import { ReportesComponent } from './reportes/reportes.component';

const routes: Routes = [
  { path: '', component: DashboardInventarioComponent },
  { path: 'productos', component: ProductosComponent },
  { path: 'movimientos', component: MovimientosComponent },
  { path: 'proveedores', component: ProveedoresComponent },
  { path: 'ordenes', component: OrdenesComponent },
  { path: 'alertas', component: AlertasComponent },
  { path: 'reportes', component: ReportesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventarioRoutingModule { }

