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
  displayedColumns: string[] = ['nombre', 'expediente', 'telefono', 'correo', 'direccion', 'antiguedad', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  // Estadísticas
  totalClientes: number = 0;
  clientesConPacientes: number = 0;
  clientesConCorreo: number = 0;
  clientesConExpediente: number = 0;

  // Datos originales y filtrados
  todosLosClientes: any[] = [];
  clientesFiltrados: any[] = [];
  filtroActual: string = '';

  constructor(
    private clientesService: ClientesService, 
    private pacientesService: PacientesService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.clientesService.getClientes().subscribe(clientes => {
      console.log('Clientes cargados:', clientes);
      
      this.todosLosClientes = (clientes || []).filter(c => c.activo !== false);
      this.clientesFiltrados = [...this.todosLosClientes];
      console.log('Clientes activos:', this.todosLosClientes);
      
      this.dataSource.data = this.clientesFiltrados;
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      this.calcularEstadisticas(clientes || []);
    });
  }

  calcularEstadisticas(clientes: any[]) {
    // Solo contar clientes activos
    const clientesActivos = clientes.filter(c => c.activo !== false);
    
    this.totalClientes = clientesActivos.length;
    this.clientesConCorreo = clientesActivos.filter(c => c.correo && c.correo.trim() !== '').length;
    this.clientesConExpediente = clientesActivos.filter(c => c.expediente && c.expediente.trim() !== '').length;
    
    // Obtener pacientes para calcular relaciones
    this.pacientesService.getPacientes().subscribe(pacientes => {
      const pacientesData = pacientes || [];
      
      // Crear un Set de IDs de clientes que tienen pacientes
      const clientesConPacientesSet = new Set(
        pacientesData.map(paciente => paciente.idCliente).filter(id => id)
      );
      
      this.clientesConPacientes = clientesActivos.filter(cliente => 
        clientesConPacientesSet.has(cliente.id)
      ).length;
    });
  }

  aplicarFiltro(event: Event) {
    const filtro = (event.target as HTMLInputElement).value;
    console.log('Aplicando filtro:', filtro);
    console.log('Total de clientes antes del filtro:', this.todosLosClientes.length);
    
    this.filtroActual = filtro.toLowerCase().trim();
    
    if (!this.filtroActual) {
      this.clientesFiltrados = [...this.todosLosClientes];
    } else {
      this.clientesFiltrados = this.todosLosClientes.filter(cliente => {
        const nombre = (cliente.nombre || '').toLowerCase();
        const apellidoPaterno = (cliente.apellidoPaterno || '').toLowerCase();
        const apellidoMaterno = (cliente.apellidoMaterno || '').toLowerCase();
        const nombreCompleto = `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim();
        const telefono = (cliente.telefono || '').toLowerCase();
        const correo = (cliente.correo || '').toLowerCase();
        const expediente = (cliente.expediente || '').toLowerCase();
        
        console.log('Buscando:', this.filtroActual, 'en cliente:', {
          nombre,
          apellidoPaterno,
          apellidoMaterno,
          nombreCompleto,
          telefono,
          correo,
          expediente
        });
        
        const encontrado = nombre.includes(this.filtroActual) || 
               apellidoPaterno.includes(this.filtroActual) ||
               apellidoMaterno.includes(this.filtroActual) ||
               nombreCompleto.includes(this.filtroActual) ||
               telefono.includes(this.filtroActual) || 
               correo.includes(this.filtroActual) ||
               expediente.includes(this.filtroActual);
        
        console.log('Resultado búsqueda:', encontrado);
        return encontrado;
      });
    }
    
    this.dataSource.data = this.clientesFiltrados;
    console.log('Total de clientes después del filtro:', this.clientesFiltrados.length);
  }

  limpiarFiltro() {
    console.log('Limpiando filtro');
    this.filtroActual = '';
    this.clientesFiltrados = [...this.todosLosClientes];
    this.dataSource.data = this.clientesFiltrados;
  }

  getEstadoColor(activo: boolean): string {
    return activo !== false ? '#4caf50' : '#f44336';
  }

  calcularAntiguedad(fecha: string): string {
    if (!fecha) return 'N/P';
    
    try {
      // Parsear la fecha (formato: "01/08/2025, 14:37:30")
      const fechaCliente = new Date(fecha.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
      const fechaActual = new Date();
      
      const diferenciaMs = fechaActual.getTime() - fechaCliente.getTime();
      const diferenciaDias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
      
      if (diferenciaDias < 30) {
        return `${diferenciaDias} días`;
      } else if (diferenciaDias < 365) {
        const meses = Math.floor(diferenciaDias / 30);
        return `${meses} mes${meses > 1 ? 'es' : ''}`;
      } else {
        const años = Math.floor(diferenciaDias / 365);
        const mesesRestantes = Math.floor((diferenciaDias % 365) / 30);
        
        if (mesesRestantes > 0) {
          return `${años} año${años > 1 ? 's' : ''} ${mesesRestantes} mes${mesesRestantes > 1 ? 'es' : ''}`;
        } else {
          return `${años} año${años > 1 ? 's' : ''}`;
        }
      }
    } catch (error) {
      return 'N/P';
    }
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
      width: '90vw',
      maxWidth: '95vw',
      data: { cliente, modoVer }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && !modoVer) {
        // Validación adicional de email único
        const email = result.correo;
        if (email) {
          const clienteActual = cliente;
          const emailExiste = this.dataSource.data.some(c => {
            if (c.correo && c.correo.toLowerCase() === email.toLowerCase()) {
              // Si estamos editando, no considerar el cliente actual
              if (clienteActual && c.id === clienteActual.id) {
                return false;
              }
              return true;
            }
            return false;
          });

          if (emailExiste) {
            Swal.fire('Error', 'Este correo electrónico ya está registrado por otro cliente', 'error');
            return;
          }
        }

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

  // Función para encontrar clientes sin pacientes
  encontrarClientesSinPacientes() {
    // Obtener pacientes para comparar
    this.pacientesService.getPacientes().subscribe(pacientes => {
      const pacientesData = pacientes || [];
      
      // Crear un Set de IDs de clientes que tienen pacientes
      const clientesConPacientesSet = new Set(
        pacientesData.map(paciente => paciente.idCliente).filter(id => id)
      );
      
      // Encontrar clientes que NO tienen pacientes
      const clientesSinPacientes = this.todosLosClientes.filter(cliente => 
        !clientesConPacientesSet.has(cliente.id)
      );
      
      if (clientesSinPacientes.length === 0) {
        Swal.fire('Información', 'Todos los clientes tienen pacientes registrados.', 'info');
      } else {
        const nombres = clientesSinPacientes.map(cliente => {
          const nombreCompleto = `${cliente.nombre || ''} ${cliente.apellidoPaterno || ''} ${cliente.apellidoMaterno || ''}`.trim();
          return nombreCompleto || 'Sin nombre';
        });
        
        Swal.fire({
          title: 'Clientes Sin Pacientes',
          html: `
            <p><strong>Total: ${clientesSinPacientes.length} cliente(s)</strong></p>
            <ul style="text-align: left; max-height: 200px; overflow-y: auto;">
              ${nombres.map(nombre => `<li>${nombre}</li>`).join('')}
            </ul>
          `,
          icon: 'info',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

}
