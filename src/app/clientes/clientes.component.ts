import { Component, OnInit, ViewChild } from '@angular/core';
import { ClientesService } from './clientes.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { MatDialog } from '@angular/material/dialog';
import { ClienteDialogComponent } from './cliente-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit {
  displayedColumns: string[] = ['id', 'nombre', 'expediente', 'telefono', 'correo', 'direccion', 'fecha', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  // Estadísticas
  totalClientes: number = 0;
  clientesConPacientes: number = 0;
  clientesConCorreo: number = 0;
  clientesSinCorreo: number = 0;

  constructor(
    private clientesService: ClientesService, 
    private pacientesService: PacientesService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.clientesService.getClientes().subscribe(clientes => {
      this.dataSource.data = (clientes || []).filter(c => c.activo !== false);
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      this.calcularEstadisticas(clientes || []);
    });
  }

  calcularEstadisticas(clientes: any[]) {
    this.totalClientes = clientes.length;
    this.clientesConCorreo = clientes.filter(c => c.correo && c.correo.trim() !== '').length;
    this.clientesSinCorreo = clientes.filter(c => !c.correo || c.correo.trim() === '').length;
    
    // Obtener pacientes para calcular relaciones
    this.pacientesService.getPacientes().subscribe(pacientes => {
      const pacientesData = pacientes || [];
      
      // Crear un Set de IDs de clientes que tienen pacientes
      const clientesConPacientesSet = new Set(
        pacientesData.map(paciente => paciente.idCliente).filter(id => id)
      );
      
      this.clientesConPacientes = clientes.filter(cliente => 
        clientesConPacientesSet.has(cliente.id)
      ).length;
    });
  }

  aplicarFiltro(event: Event) {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  getEstadoColor(activo: boolean): string {
    return activo !== false ? '#4caf50' : '#f44336';
  }

  cambiarEstado(cliente: any, nuevoEstado: boolean) {
    const clienteActualizado = { ...cliente, activo: nuevoEstado };
    
    this.clientesService.guardarCliente(clienteActualizado).then(() => {
      const mensaje = nuevoEstado ? 'activado' : 'desactivado';
      Swal.fire('Éxito', `Cliente ${mensaje} correctamente`, 'success');
      this.ngOnInit(); // Recargar datos
    }).catch(error => {
      console.error('Error al cambiar estado:', error);
      Swal.fire('Error', 'No se pudo cambiar el estado del cliente', 'error');
    });
  }

  abrirModalCliente(cliente: any = null, modoVer: boolean = false) {
    const dialogRef = this.dialog.open(ClienteDialogComponent, {
      width: '700px',
      data: { cliente, modoVer }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && !modoVer) {
        this.clientesService.guardarCliente(result).then(() => {
          Swal.fire('Éxito', 'Cliente guardado correctamente', 'success');
          this.ngOnInit(); // Recargar datos
        }).catch(error => {
          console.error('Error al guardar cliente:', error);
          Swal.fire('Error', 'No se pudo guardar el cliente', 'error');
        });
      }
    });
  }

  editarCliente(cliente: any) {
    this.abrirModalCliente(cliente, false);
  }

  verCliente(cliente: any) {
    this.abrirModalCliente(cliente, true);
  }

  bajaLogicaCliente(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'El cliente será dado de baja (baja lógica).',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.clientesService.bajaLogicaCliente(id).then(() => {
          Swal.fire('Baja lógica', 'El cliente fue dado de baja correctamente.', 'success');
          this.ngOnInit(); // Recargar datos
        });
      }
    });
  }


}
