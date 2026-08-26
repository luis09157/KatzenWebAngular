import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
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
import { SucursalContextService } from '../core/services/sucursal-context.service';
import { filterBySucursal } from '../core/utils/sucursal-filter.util';
import { ADMIN_DIALOG_CONFIG, ADMIN_DIALOG_WIDE } from '../core/config/admin-ui.config';
import {
  calcularClienteEstadisticas,
  calcularClientesConPacientes
} from '../core/utils/entity-stats.util';
import { FirebaseFunctionsService } from '../core/services/firebase-functions.service';
import { LOADING_MESSAGES } from '../core/loading.service';

interface ClienteKpi {
  label: string;
  value: number;
  hint: string;
}

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss']
})
export class ClientesComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly destroy$ = new Subject<void>();
  displayedColumns: string[] = ['nombre', 'expediente', 'telefono', 'correo', 'ubicacion', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  readonly pageSize = 50;
  
  // Estadísticas
  totalClientes: number = 0;
  clientesConPacientes: number = 0;
  clientesConCorreo: number = 0;
  clientesConExpediente: number = 0;
  clientesNuevosMes: number = 0;

  // Datos originales y filtrados
  todosLosClientes: any[] = [];
  clientesBase: any[] = [];
  clientesFiltrados: any[] = [];
  filtroActual: string = '';
  clienteMenuContext: any = null;

  loading = false;
  saving = false;
  hasMoreClientes = false;
  loadingMore = false;
  private oldestClienteKey: string | null = null;
  readonly rtdbPageSize = 100;

  constructor(
    private clientesService: ClientesService,
    private pacientesService: PacientesService,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService,
    private loadingService: LoadingService,
    private sucursalContext: SucursalContextService,
    private firebaseFunctions: FirebaseFunctionsService
  ) {}

  ngOnInit(): void {
    this.sucursalContext.selectedId$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.todosLosClientes.length) {
        this.aplicarFiltroSucursal();
      }
      this.cargarEstadisticas();
    });
    this.cargarClientes();
    this.cargarEstadisticas();
  }

  private cargarClientes(): void {
    this.loading = true;
    this.oldestClienteKey = null;
    this.clientesService.getClientesPage(this.rtdbPageSize).pipe(takeUntil(this.destroy$)).subscribe({
      next: page => {
        this.todosLosClientes = page.items;
        this.hasMoreClientes = page.hasMore;
        this.oldestClienteKey = page.oldestKey;
        this.aplicarFiltroSucursal();
        this.loading = false;
        setTimeout(() => {
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
        }, 0);
      },
      error: (error) => {
        this.logger.error('Error al cargar clientes:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los clientes.',
          showCancelButton: true,
          confirmButtonText: 'Reintentar',
          cancelButtonText: 'Cerrar'
        }).then(result => {
          if (result.isConfirmed) {
            this.cargarClientes();
          }
        });
      }
    });
  }

  cargarMasClientes(): void {
    if (!this.hasMoreClientes || this.loadingMore || !this.oldestClienteKey) {
      return;
    }
    this.loadingMore = true;
    this.clientesService.getClientesPage(this.rtdbPageSize, this.oldestClienteKey)
      .pipe(take(1))
      .subscribe({
        next: page => {
          this.todosLosClientes = [...this.todosLosClientes, ...page.items];
          this.hasMoreClientes = page.hasMore;
          this.oldestClienteKey = page.oldestKey;
          this.aplicarFiltroSucursal();
          this.loadingMore = false;
        },
        error: (error) => {
          this.logger.error('Error al cargar más clientes:', error);
          this.loadingMore = false;
          Swal.fire('Error', 'No se pudieron cargar más clientes', 'error');
        }
      });
  }

  private aplicarFiltroSucursal(): void {
    this.clientesBase = filterBySucursal(this.todosLosClientes, this.sucursalContext.getSelectedId());
    this.refrescarFiltroTexto();
  }

  private refrescarFiltroTexto(): void {
    if (!this.filtroActual) {
      this.clientesFiltrados = [...this.clientesBase];
    } else {
      this.clientesFiltrados = this.clientesBase.filter(cliente => {
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

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarEstadisticas(): void {
    const sucursalId = this.sucursalContext.getSelectedId();
    forkJoin({
      clientes: this.clientesService.getClientes().pipe(take(1)),
      pacientes: this.pacientesService.getEstadisticas(sucursalId).pipe(take(1))
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ clientes, pacientes }) => {
        const stats = calcularClienteEstadisticas(clientes, sucursalId);
        this.totalClientes = stats.total;
        this.clientesConCorreo = stats.conCorreo;
        this.clientesConExpediente = stats.conExpediente;
        this.clientesConPacientes = calcularClientesConPacientes(
          clientes,
          pacientes.clienteIdsConPaciente,
          sucursalId
        );
        const mes = new Date().toISOString().slice(0, 7);
        this.clientesNuevosMes = (clientes || []).filter((c: any) => {
          if (c.activo === false) return false;
          const f = String(c.fecha_registro || c.created_at || c.fecha_creacion || '');
          return f.slice(0, 7) === mes;
        }).length;
      },
      error: err => this.logger.error('Error al cargar estadísticas de clientes:', err)
    });
  }

  aplicarFiltro(event: Event) {
    const filtro = (event.target as HTMLInputElement).value;
    this.filtroActual = filtro.toLowerCase().trim();
    this.refrescarFiltroTexto();
  }

  limpiarFiltro() {
    this.filtroActual = '';
    this.refrescarFiltroTexto();
  }

  get kpis(): ClienteKpi[] {
    return [
      {
        label: 'Total de clientes',
        value: this.totalClientes,
        hint: 'Activos en sistema'
      },
      {
        label: 'Con pacientes',
        value: this.clientesConPacientes,
        hint: 'Tienen mascota vinculada'
      },
      {
        label: 'Sin correo',
        value: this.clientesSinCorreo,
        hint: 'Requieren actualización'
      },
      {
        label: 'Con expediente',
        value: this.clientesConExpediente,
        hint: 'Ficha clínica asignada'
      }
    ];
  }

  get clientesSinCorreo(): number {
    return Math.max(0, this.totalClientes - this.clientesConCorreo);
  }

  getNombreCompleto(cliente: any): string {
    const nombre = [
      cliente?.nombre,
      cliente?.apellidoPaterno,
      cliente?.apellidoMaterno
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
    return nombre || 'Sin nombre';
  }

  getTelefono(cliente: any): string {
    const telefono = (cliente?.telefono || '').trim();
    return telefono || 'N/P';
  }

  getCorreo(cliente: any): string {
    const correo = (cliente?.correo || '').trim();
    return correo || 'N/P';
  }

  isDatoFaltante(valor: string | null | undefined): boolean {
    const v = (valor || '').trim().toLowerCase();
    return !v || v === 'n/p' || v === 'n/a' || v === '—';
  }

  isCorreoFaltante(correo: string | null | undefined): boolean {
    const v = (correo || '').trim().toLowerCase();
    return (
      !v ||
      v === 'n/p' ||
      v === 'n/a' ||
      v.includes('no proporcionado') ||
      v.includes('sin email') ||
      v.includes('sin correo')
    );
  }

  getUbicacion(cliente: any): string {
    const municipio = (cliente?.municipio || '').trim();
    const colonia = (cliente?.colonia || '').trim();

    if (municipio && colonia) {
      return `${municipio} (${colonia})`;
    }
    return municipio || colonia || '';
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
    this.saving = true;
    this.loadingService.show();
    const operacion = nuevoEstado
      ? this.clientesService.reactivarCliente(cliente.id)
      : this.clientesService.bajaLogicaCliente(cliente.id);
    operacion
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
      ...ADMIN_DIALOG_WIDE,
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
        this.loadingService.show(LOADING_MESSAGES.saving);
        const esNuevo = !cliente || !cliente.id;
        this.clientesService.guardarCliente(result)
          .then(async (id) => {
            const saved = { ...result, id };
            this.todosLosClientes = [
              saved,
              ...this.todosLosClientes.filter(c => c.id !== id)
            ];
            this.aplicarFiltroSucursal();
            this.cargarEstadisticas();

            const emailValido = this.esCorreoPortalValido(result.correo);
            if (esNuevo && emailValido) {
              try {
                const provision = await this.firebaseFunctions.provisionPortalClient(id);
                this.loadingService.hide();
                setTimeout(() => {
                  const mailOk = provision.emailSent === true;
                  Swal.fire({
                    title: mailOk ? 'Cliente y portal listos' : 'Cliente guardado',
                    text: mailOk
                      ? (provision.message ||
                        'Portal activado. El dueño recibirá un correo con su contraseña temporal.')
                      : (provision.message ||
                        'Cliente y portal listos, pero el correo no se envió. Falta configurar Resend (modo prueba) o el envío falló. Reenvía desde Usuarios cuando haya RESEND_API_KEY.'),
                    icon: mailOk ? 'success' : 'warning',
                    confirmButtonText: 'Entendido',
                    footer: mailOk
                      ? undefined
                      : 'Sin dominio propio Resend solo entrega al email de tu cuenta Resend. Clientes reales = dominio verificado (QA-CRUD-MATRIX).'
                  });
                }, 0);
              } catch (provErr) {
                this.loadingService.hide();
                const msg = this.errorMessages.getUserMessage(provErr, 'activar portal cliente');
                setTimeout(() => {
                  Swal.fire({
                    title: 'Cliente guardado',
                    text:
                      `El cliente se guardó, pero no se activó el portal: ${msg}. ` +
                      'Puedes activarlo después desde Usuarios → Pendientes.',
                    icon: 'warning',
                    confirmButtonText: 'Entendido'
                  });
                }, 0);
              }
              return;
            }

            this.loadingService.hide();
            setTimeout(() => {
              Swal.fire({
                title: '¡Éxito!',
                text: 'Cliente guardado correctamente',
                icon: 'success',
                confirmButtonText: 'Entendido'
              });
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
              }).then((swalResult) => {
                if (swalResult.dismiss === Swal.DismissReason.cancel) {
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

  private esCorreoPortalValido(correo: unknown): boolean {
    const email = String(correo || '').trim();
    if (!email) return false;
    const lower = email.toLowerCase();
    if (
      lower.includes('no proporcionado') ||
      lower.includes('sin email') ||
      lower.includes('sin correo') ||
      lower === 'n/a' ||
      lower === 'n/p'
    ) {
      return false;
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  editarCliente(cliente: any) {
    this.abrirModalCliente(cliente, false);
  }

  verCliente(cliente: any) {
    this.abrirModalCliente(cliente, true);
  }

  bajaLogicaCliente(id: string) {
    Swal.fire({
      title: '¿Borrar este cliente?',
      text: 'Se ocultará el cliente, sus mascotas y citas futuras; también se desactivará el portal del dueño. Los datos se conservan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.saving = true;
        this.loadingService.show(LOADING_MESSAGES.deleting);
        this.clientesService
          .bajaLogicaClienteCascada(id, cid => this.firebaseFunctions.deactivatePortalClient(cid))
          .then(res => {
            this.loadingService.hide();
            this.todosLosClientes = this.todosLosClientes.filter(c => c.id !== id);
            this.aplicarFiltroSucursal();
            this.cargarEstadisticas();
            const detalle = [
              `${res.mascotasDesactivadas} mascota(s)`,
              `${res.citasCanceladas} cita(s)`,
              res.portalRevocado ? 'portal revocado' : (res.portalRevokeError ? 'portal desactivado (revocación Auth pendiente)' : 'sin portal')
            ].join(', ');
            setTimeout(() => {
              Swal.fire('Borrado', `Cliente borrado en cascada (${detalle}).`, 'success');
            }, 0);
          })
          .catch(err => {
            this.loadingService.hide();
            const msg = this.errorMessages.getUserMessage(err, 'borrar cliente');
            setTimeout(() => Swal.fire('Error', msg, 'error'), 0);
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
        pacientesData.map(paciente => paciente.cliente_id || paciente.idCliente).filter(id => id)
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
      error: (error) => {
        this.logger.error('Error al buscar clientes sin pacientes:', error);
        this.loadingService.hide();
        this.saving = false;
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cargar datos'), 'error');
      }
    });
  }

}
