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
          paciente: this.pacientesMap[historial.paciente_id] || 'N/P',
          fecha_registro: this.formatearFecha(historial.fecha_registro)
        }));
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
      });
    });
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/P';
    
    try {
      // Si es un objeto Date del DatePicker
      if (fecha instanceof Date) {
        return fecha.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Si es un string de fecha
      if (typeof fecha === 'string') {
        const date = new Date(fecha);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }
      
      return 'N/P';
    } catch (error) {
      return 'N/P';
    }
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
