import { Component, OnInit, ViewChild } from '@angular/core';
import { CitasService } from './citas.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { ClientesService } from '../clientes/clientes.service';
import { MatDialog } from '@angular/material/dialog';
import { CitaDialogComponent } from './cita-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-citas',
  templateUrl: './citas.component.html',
  styleUrls: ['./citas.component.css']
})
export class CitasComponent implements OnInit {
  displayedColumns: string[] = ['fecha_hora', 'cliente', 'paciente', 'motivo', 'estado', 'veterinario', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  clientesMap: { [id: string]: string } = {};
  pacientesMap: { [id: string]: string } = {};
  loading = false;

  constructor(
    private citasService: CitasService,
    private clientesService: ClientesService,
    private pacientesService: PacientesService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.clientesService.getClientes().subscribe(clientes => {
      (clientes || []).forEach(c => {
        this.clientesMap[c.id] = c.nombre ? c.nombre + (c.apellidoPaterno ? ' ' + c.apellidoPaterno : '') : 'N/P';
      });
      this.pacientesService.getPacientes().subscribe(pacientes => {
        (pacientes || []).forEach(p => {
          this.pacientesMap[p.id] = p.nombre ? p.nombre : 'N/P';
        });
        this.citasService.getCitas().subscribe(citas => {
          this.dataSource.data = (citas || []).filter(c => c.activo !== false).map(cita => ({
            ...cita,
            cliente: this.clientesMap[cita.cliente_id] || 'N/P',
            paciente: this.pacientesMap[cita.paciente_id] || 'N/P'
          }));
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          this.loading = false;
        });
      });
    });
  }

  getCitasPendientes(): number {
    return this.dataSource.data.filter(cita => cita.estado?.toLowerCase() === 'pendiente').length;
  }

  getCitasConfirmadas(): number {
    return this.dataSource.data.filter(cita => cita.estado?.toLowerCase() === 'confirmada').length;
  }

  getCitasCompletadas(): number {
    return this.dataSource.data.filter(cita => cita.estado?.toLowerCase() === 'completada').length;
  }

  aplicarFiltro(event: Event) {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  getEstadoColor(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'pendiente':
        return '#ff9800';
      case 'confirmada':
        return '#2196f3';
      case 'completada':
        return '#4caf50';
      case 'cancelada':
        return '#f44336';
      default:
        return '#888';
    }
  }

  cambiarEstado(cita: any, nuevoEstado: string) {
    const citaActualizada = { ...cita, estado: nuevoEstado };
    
    this.citasService.guardarCita(citaActualizada).then(() => {
      Swal.fire('Éxito', `Cita marcada como ${nuevoEstado}`, 'success');
      this.ngOnInit(); // Recargar datos
    }).catch(error => {
      console.error('Error al cambiar estado:', error);
      Swal.fire('Error', 'No se pudo cambiar el estado de la cita', 'error');
    });
  }

  abrirModalCita(cita: any = null, modoVer: boolean = false) {
    const dialogRef = this.dialog.open(CitaDialogComponent, {
      width: '700px',
      data: { cita, modoVer }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && !modoVer) {
        this.citasService.guardarCita(result).then(() => {
          Swal.fire('Éxito', 'Cita guardada correctamente', 'success');
          this.ngOnInit(); // Recargar datos
        });
      }
    });
  }

  editarCita(cita: any) {
    this.abrirModalCita(cita, false);
  }

  verCita(cita: any) {
    this.abrirModalCita(cita, true);
  }

  bajaLogicaCita(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar esta cita? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.citasService.eliminarCita(id).then(() => {
          Swal.fire('Eliminado', 'Cita eliminada correctamente', 'success');
          this.ngOnInit(); // Recargar datos
        }).catch(error => {
          console.error('Error al eliminar cita:', error);
          Swal.fire('Error', 'No se pudo eliminar la cita', 'error');
        });
      }
    });
  }
}
