import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { PacientesService } from './pacientes.service';
import { ClientesService } from '../clientes/clientes.service';
import { PacienteDialogComponent } from './paciente-dialog.component';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pacientes',
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.css']
})
export class PacientesComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Propiedades para la nueva vista
  searchTerm: string = '';
  selectedPatient: any = null;
  filteredPatients: any[] = [];
  allPatients: any[] = [];
  allClients: any[] = [];

  // Propiedades para vacunas
  nuevaVacuna: string = '';
  observacionesVacuna: string = '';
  proximaVacuna: string = '';
  fechaVacuna: Date | null = null;

  // Historial clínico de ejemplo
  historialClinico = [
    {
      fecha: '11/12/2024',
      hora: '09:58',
      descripcion: 'aquí podemos usar la...',
      tiempoAtras: 'Hace 4 semanas y 2 días'
    },
    {
      fecha: '29/10/2024',
      hora: '11:19',
      descripcion: 'hola',
      tiempoAtras: 'Hace 2 meses y 2 semanas'
    },
    {
      fecha: '29/10/2024',
      hora: '11:18',
      descripcion: 'hola',
      tiempoAtras: 'Hace 2 meses y 2 semanas'
    },
    {
      fecha: '24/01/2024',
      hora: '09:00',
      descripcion: 'ANTIPARASITARIOS F...',
      tiempoAtras: 'Hace 11 meses y 2 semanas'
    }
  ];

  // Propiedades originales
  displayedColumns: string[] = ['nombre', 'especie', 'raza', 'sexo', 'edad', 'color', 'peso', 'nombreCliente', 'acciones'];
  dataSource!: MatTableDataSource<any>;

  constructor(
    private pacientesService: PacientesService,
    private clientesService: ClientesService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.pacientesService.getPacientes().subscribe(pacientes => {
      this.allPatients = pacientes || [];
      this.allPatients = this.allPatients.map(paciente => ({
        ...paciente,
        nombreCliente: this.getClienteInfo(paciente.cliente_id)?.nombre || 'N/A'
      }));
      this.dataSource = new MatTableDataSource(this.allPatients);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });

    this.clientesService.getClientes().subscribe(clientes => {
      this.allClients = clientes || [];
    });
  }

  // Métodos para la nueva vista
  goBack() {
    this.router.navigate(['/admin/inicio']);
  }

  onSearchInput() {
    if (!this.searchTerm.trim()) {
      this.filteredPatients = [];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredPatients = this.allPatients.filter(paciente => 
      paciente.nombreCliente?.toLowerCase().includes(searchLower) ||
      paciente.nombre?.toLowerCase().includes(searchLower) ||
      paciente.raza?.toLowerCase().includes(searchLower)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredPatients = [];
  }

  selectPatient(paciente: any) {
    this.selectedPatient = paciente;
  }

  backToSearch() {
    this.selectedPatient = null;
  }

  nuevoPaciente() {
    this.abrirModalPaciente();
  }

  editPatient() {
    this.editarPaciente(this.selectedPatient);
  }

  addHistory() {
    // Implementar lógica para agregar historial
    console.log('Agregar historial para:', this.selectedPatient.nombre);
  }

  nuevaCita() {
    this.router.navigate(['/admin/citas'], { 
      queryParams: { paciente: this.selectedPatient.id } 
    });
  }

  verHistoriales() {
    this.router.navigate(['/admin/historiales'], { 
      queryParams: { paciente: this.selectedPatient.id } 
    });
  }

  agregarVacuna() {
    if (!this.nuevaVacuna || !this.fechaVacuna) {
      Swal.fire('Error', 'Por favor completa los campos requeridos', 'error');
      return;
    }

    // Aquí implementarías la lógica para guardar la vacuna
    console.log('Vacuna agregada:', {
      paciente: this.selectedPatient.nombre,
      vacuna: this.nuevaVacuna,
      fecha: this.fechaVacuna,
      observaciones: this.observacionesVacuna,
      proxima: this.proximaVacuna
    });

    Swal.fire('Éxito', 'Vacuna agregada correctamente', 'success');
    
    // Limpiar formulario
    this.nuevaVacuna = '';
    this.observacionesVacuna = '';
    this.proximaVacuna = '';
    this.fechaVacuna = null;
  }

  onTabChange(event: any) {
    console.log('Tab cambiado:', event.index);
  }

  getClienteInfo(clienteId: string) {
    return this.allClients.find(cliente => cliente.id === clienteId);
  }

  // Métodos originales
  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  abrirModalPaciente(paciente?: any) {
    const dialogRef = this.dialog.open(PacienteDialogComponent, {
      width: '600px',
      data: paciente || {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarDatos();
      }
    });
  }

  verPaciente(paciente: any) {
    this.selectPatient(paciente);
  }

  editarPaciente(paciente: any) {
    this.abrirModalPaciente(paciente);
  }

  bajaLogicaPaciente(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción marcará el paciente como inactivo",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pacientesService.bajaLogicaPaciente(id).then(() => {
          Swal.fire(
            'Eliminado!',
            'El paciente ha sido marcado como inactivo.',
            'success'
          );
          this.cargarDatos();
        }).catch(error => {
          Swal.fire(
            'Error!',
            'No se pudo eliminar el paciente.',
            'error'
          );
        });
      }
    });
  }
}
