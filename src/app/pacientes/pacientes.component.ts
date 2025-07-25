import { Component, OnInit, ViewChild } from '@angular/core';
import { PacientesService } from './pacientes.service';
import { MatDialog } from '@angular/material/dialog';
import { PacienteDialogComponent } from './paciente-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pacientes',
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.css']
})
export class PacientesComponent implements OnInit {
  displayedColumns: string[] = ['nombre', 'especie', 'raza', 'sexo', 'edad', 'color', 'peso', 'nombreCliente', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private pacientesService: PacientesService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.pacientesService.getPacientes().subscribe(pacientes => {
      this.dataSource.data = (pacientes || []).filter(p => p.activo !== false);
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    });
  }

  aplicarFiltro(event: Event) {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  abrirModalPaciente(paciente: any = null, modoVer: boolean = false) {
    const dialogRef = this.dialog.open(PacienteDialogComponent, {
      width: '700px',
      data: { paciente, modoVer }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && !modoVer) {
        this.pacientesService.guardarPaciente(result).then(() => {
          Swal.fire('Éxito', 'Paciente guardado correctamente', 'success');
        });
      }
    });
  }

  editarPaciente(paciente: any) {
    this.abrirModalPaciente(paciente, false);
  }

  verPaciente(paciente: any) {
    this.abrirModalPaciente(paciente, true);
  }

  bajaLogicaPaciente(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'El paciente será dado de baja (baja lógica).',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.pacientesService.bajaLogicaPaciente(id).then(() => {
          Swal.fire('Baja lógica', 'El paciente fue dado de baja correctamente.', 'success');
        });
      }
    });
  }
}
