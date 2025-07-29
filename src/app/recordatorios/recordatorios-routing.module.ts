import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RecordatoriosComponent } from './recordatorios.component';

const routes: Routes = [
  { path: '', component: RecordatoriosComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RecordatoriosRoutingModule { } 