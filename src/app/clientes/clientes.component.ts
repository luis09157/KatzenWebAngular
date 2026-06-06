import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ClientesService } from './clientes.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { MatDialog } from '@angular/material/dialog';
import { ClienteDialogComponent } from './cliente-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoggerService } from '../core/logger.service';
import { LoadingService } from '../core/loading.service';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly destroy$ = new Subject<void>();
  displayedColumns: string[] = ['nombre', 'expediente', 'telefono', 'correo', 'direccion', 'antiguedad', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  readonly pageSize = 50;
  
  // Estadísticas
  totalClientes: number = 0;
  clientesConPacientes: number = 0;
  clientesConCorreo: number = 0;
  clientesConExpediente: number = 0;

  // Datos originales y filtrados
  todosLosClientes: any[] = [];
  clientesFiltrados: any[] = [];
  filtroActual: string = '';

  loading = false;
  saving = false;

  constructor(
    private clientesService: ClientesService,
    private pacientesService: PacientesService,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.clientesService.getClientes().pipe(takeUntil(this.destroy$)).subscribe({
      next: clientes => {
        this.todosLosClientes = (clientes || []).filter((c: { activo?: boolean }) => c.activo !== false);
        this.clientesFiltrados = [...this.todosLosClientes];
        this.dataSource.data = this.clientesFiltrados;
        this.calcularEstadisticas(clientes || []);
        this.loading = false;
        // Enlazar paginador después de que la vista con *ngIf="!loading" se haya renderizado
        setTimeout(() => {
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
        }, 0);
      },
      error: () => { this.loading = false; }
    });
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  calcularEstadisticas(clientes: any[]) {
    const clientesActivos = clientes.filter((c: { activo?: boolean }) => c.activo !== false);
    this.totalClientes = clientesActivos.length;
    this.clientesConCorreo = clientesActivos.filter((c: { correo?: string }) => c.correo && c.correo.trim() !== '').length;
    this.clientesConExpediente = clientesActivos.filter((c: { expediente?: string }) => c.expediente && c.expediente.trim() !== '').length;
    this.pacientesService.getPacientes().pipe(takeUntil(this.destroy$)).subscribe(pacientes => {
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
        return nombre.includes(this.filtroActual) ||
               apellidoPaterno.includes(this.filtroActual) ||
               apellidoMaterno.includes(this.filtroActual) ||
               nombreCompleto.includes(this.filtroActual) ||
               telefono.includes(this.filtroActual) ||
               correo.includes(this.filtroActual) ||
               expediente.includes(this.filtroActual);
      });
    }
    this.dataSource.data = this.clientesFiltrados;
  }

  limpiarFiltro() {
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
    this.saving = true;
    this.loadingService.show();
    this.clientesService.guardarCliente(clienteActualizado)
      .then(() => {
        this.loadingService.hide();
        const mensaje = nuevoEstado ? 'activado' : 'desactivado';
        setTimeout(() => {
          Swal.fire('Éxito', `Cliente ${mensaje} correctamente`, 'success');
          this.ngOnInit();
        }, 0);
      })
      .catch(error => {
        this.logger.error('Error al cambiar estado:', error);
        this.loadingService.hide();
        setTimeout(() => Swal.fire('Error', 'No se pudo cambiar el estado del cliente', 'error'), 0);
      })
      .finally(() => { this.saving = false; });
  }

  abrirModalCliente(cliente: any = null, modoVer: boolean = false) {
    const dialogRef = this.dialog.open(ClienteDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: { cliente, modoVer }
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result && !modoVer) {
        const email = result.correo;
        
        if (email && 
            !email.toLowerCase().includes('no proporcionado') && 
            !email.toLowerCase().includes('sin email') &&
            !email.toLowerCase().includes('n/a') &&
            email.trim() !== '') {
          
          // Validar formato de email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            Swal.fire({
              title: 'Error de validación',
              text: 'Formato de correo electrónico inválido',
              icon: 'error',
              confirmButtonText: 'Entendido'
            });
            return;
          }
          
          const clienteActual = cliente;
          const emailExiste = this.dataSource.data.some(c => {
            // Solo considerar emails válidos para la comparación
            if (c.correo && 
                !c.correo.toLowerCase().includes('no proporcionado') &&
                !c.correo.toLowerCase().includes('sin email') &&
                !c.correo.toLowerCase().includes('n/a') &&
                c.correo.trim() !== '' &&
                emailRegex.test(c.correo) &&
                c.correo.toLowerCase() === email.toLowerCase()) {
              // Si estamos editando, no considerar el cliente actual
              if (clienteActual && c.id === clienteActual.id) {
                return false;
              }
              return true;
            }
            return false;
          });

          if (emailExiste) {
            Swal.fire({
              title: 'Email duplicado',
              text: 'Este correo electrónico ya está registrado por otro cliente',
              icon: 'error',
              confirmButtonText: 'Entendido'
            });
            return;
          }
        }

        this.saving = true;
        this.loadingService.show();
        this.clientesService.guardarCliente(result)
          .then(() => {
            this.loadingService.hide();
            setTimeout(() => {
              Swal.fire({
                title: '¡Éxito!',
                text: 'Cliente guardado correctamente',
                icon: 'success',
                confirmButtonText: 'Entendido'
              });
              this.ngOnInit();
            }, 0);
          })
          .catch(error => {
            this.logger.error('❌ Error al guardar cliente:', error);
            this.loadingService.hide();
            const mensajeError = this.errorMessages.getUserMessage(error, 'guardar cliente');
            setTimeout(() => {
              Swal.fire({
                title: 'Error al guardar cliente',
                text: mensajeError,
                icon: 'error',
                confirmButtonText: 'Entendido',
                showCancelButton: true,
                cancelButtonText: 'Ver detalles',
                cancelButtonColor: '#3085d6'
              }).then((result) => {
                if (result.dismiss === Swal.DismissReason.cancel) {
                  Swal.fire({
                    title: 'Detalles técnicos',
                    html: `
                      <div style="text-align: left;">
                        <p><strong>Error:</strong> ${error.message || 'Error desconocido'}</p>
                        <p><strong>Stack:</strong></p>
                        <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px; max-height: 200px; overflow-y: auto;">${error.stack || 'No disponible'}</pre>
                      </div>
                    `,
                    icon: 'info',
                    confirmButtonText: 'Cerrar'
                  });
                }
              });
            }, 0);
          })
          .finally(() => { this.saving = false; });
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
      text: 'El cliente será dado de baja (baja lógica). Se desactivará también el acceso al portal del dueño. Los datos se conservan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.saving = true;
        this.loadingService.show();
        this.clientesService.bajaLogicaCliente(id)
          .then(() => {
            this.loadingService.hide();
            setTimeout(() => {
              Swal.fire('Baja lógica', 'El cliente fue dado de baja correctamente.', 'success');
              this.ngOnInit();
            }, 0);
          })
          .catch(() => {
            this.loadingService.hide();
            setTimeout(() => Swal.fire('Error', 'No se pudo dar de baja al cliente', 'error'), 0);
          })
          .finally(() => { this.saving = false; });
      }
    });
  }

  encontrarClientesSinPacientes() {
    this.saving = true;
    this.loadingService.show();
    this.pacientesService.getPacientes().pipe(takeUntil(this.destroy$)).subscribe({
      next: pacientes => {
      const pacientesData = pacientes || [];
      
      // Crear un Set de IDs de clientes que tienen pacientes
      const clientesConPacientesSet = new Set(
        pacientesData.map(paciente => paciente.idCliente).filter(id => id)
      );
      
      // Encontrar clientes que NO tienen pacientes
      const clientesSinPacientes = this.todosLosClientes.filter(cliente => 
        !clientesConPacientesSet.has(cliente.id)
      );
      
      this.loadingService.hide();
      if (clientesSinPacientes.length === 0) {
        setTimeout(() => Swal.fire('Información', 'Todos los clientes tienen pacientes registrados.', 'info'), 0);
      } else {
        const nombres = clientesSinPacientes.map(cliente => {
          const nombreCompleto = `${cliente.nombre || ''} ${cliente.apellidoPaterno || ''} ${cliente.apellidoMaterno || ''}`.trim();
          return nombreCompleto || 'Sin nombre';
        });
        setTimeout(() => Swal.fire({
          title: 'Clientes Sin Pacientes',
          html: `
            <p><strong>Total: ${clientesSinPacientes.length} cliente(s)</strong></p>
            <ul style="text-align: left; max-height: 200px; overflow-y: auto;">
              ${nombres.map(nombre => `<li>${nombre}</li>`).join('')}
            </ul>
          `,
          icon: 'info',
          confirmButtonText: 'Entendido'
        }), 0);
      }
      this.saving = false;
      },
      error: () => { this.saving = false; this.loadingService.hide(); }
    });
  }

}
