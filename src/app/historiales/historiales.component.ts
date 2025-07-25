import { Component, OnInit, ViewChild } from '@angular/core';
import { HistorialesService } from './historiales.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { MatDialog } from '@angular/material/dialog';
import { HistorialDialogComponent } from './historial-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-historiales',
  templateUrl: './historiales.component.html',
  styleUrls: ['./historiales.component.css']
})
export class HistorialesComponent implements OnInit {
  displayedColumns: string[] = ['fecha_registro', 'paciente', 'diagnostico', 'tratamiento', 'medicamentos', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pacientesMap: { [id: string]: string } = {};

  constructor(
    private historialesService: HistorialesService,
    private pacientesService: PacientesService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.pacientesService.getPacientes().subscribe(pacientes => {
      (pacientes || []).forEach(p => {
        this.pacientesMap[p.id] = p.nombre ? p.nombre : 'N/P';
      });
      this.historialesService.getHistoriales().subscribe(historiales => {
        this.dataSource.data = (historiales || []).filter(h => h.activo !== false).map(historial => ({
          ...historial,
          paciente: this.pacientesMap[historial.paciente_id] || 'N/P'
        }));
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
      });
    });
  }

  aplicarFiltro(event: Event) {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  abrirModalHistorial(historial: any = null, modoVer: boolean = false) {
    const dialogRef = this.dialog.open(HistorialDialogComponent, {
      width: '700px',
      data: { historial, modoVer }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && !modoVer) {
        this.historialesService.guardarHistorial(result).then(() => {
          Swal.fire('Éxito', 'Historial guardado correctamente', 'success');
        });
      }
    });
  }

  editarHistorial(historial: any) {
    this.abrirModalHistorial(historial, false);
  }

  verHistorial(historial: any) {
    this.abrirModalHistorial(historial, true);
  }

  bajaLogicaHistorial(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'El historial será dado de baja (baja lógica).',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.historialesService.bajaLogicaHistorial(id).then(() => {
          Swal.fire('Baja lógica', 'El historial fue dado de baja correctamente.', 'success');
        });
      }
    });
  }
}
