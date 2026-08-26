import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UsuariosService } from './usuarios.service';
import { PortalClientesService, PortalClienteRow } from './portal-clientes.service';
import { MatDialog } from '@angular/material/dialog';
import { UsuarioDialogComponent } from './usuario-dialog.component';
import { ProvisionPortalClienteDialogComponent } from './provision-portal-cliente-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { LoggerService } from '../core/logger.service';
import { ErrorMessagesService } from '../core/error-messages.service';
import { FirebaseFunctionsService } from '../core/services/firebase-functions.service';
import { ADMIN_DIALOG_DETAIL, ADMIN_DIALOG_FORM } from '../core/config/admin-ui.config';
import { ClienteDialogComponent } from '../clientes/cliente-dialog.component';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly destroy$ = new Subject<void>();

  selectedTabIndex = 0;

  displayedColumns: string[] = ['nombre', 'correo', 'perfil', 'acciones'];
  menuContext: any = null;
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild('staffPaginator') staffPaginator!: MatPaginator;

  portalColumns: string[] = ['nombre', 'correo', 'telefono', 'acciones'];
  portalSinCorreoColumns: string[] = ['nombre', 'telefono', 'acciones'];
  portalConAcceso = new MatTableDataSource<PortalClienteRow>([]);
  portalPendientes = new MatTableDataSource<PortalClienteRow>([]);
  portalSinCorreo = new MatTableDataSource<PortalClienteRow>([]);
  @ViewChild('portalPaginator') portalPaginator!: MatPaginator;
  @ViewChild('pendientesPaginator') pendientesPaginator!: MatPaginator;
  @ViewChild('sinCorreoPaginator') sinCorreoPaginator!: MatPaginator;

  portalMenuContext: PortalClienteRow | null = null;
  portalFilter = '';
  pendientesFilter = '';
  sinCorreoFilter = '';

  loadingStaff = false;
  loadingPortal = false;
  saving = false;

  portalStats = { conPortal: 0, pendientes: 0, sinCorreo: 0 };

  constructor(
    private usuariosService: UsuariosService,
    private portalClientesService: PortalClientesService,
    private firebaseFunctions: FirebaseFunctionsService,
    private dialog: MatDialog,
    private loadingService: LoadingService,
    private logger: LoggerService,
    private errorMessages: ErrorMessagesService
  ) {}

  ngOnInit(): void {
    const portalFilterFn = (row: PortalClienteRow, filter: string) => {
      const haystack = [row.nombreCompleto, row.correo, row.telefono, row.expediente]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(filter);
    };
    this.portalConAcceso.filterPredicate = portalFilterFn;
    this.portalPendientes.filterPredicate = portalFilterFn;
    this.portalSinCorreo.filterPredicate = portalFilterFn;
    this.cargarStaff();
    this.cargarPortalClientes();
  }

  ngAfterViewInit(): void {
    this.attachPaginators();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    setTimeout(() => this.attachPaginators(), 0);
  }

  private attachPaginators(): void {
    if (this.staffPaginator) this.dataSource.paginator = this.staffPaginator;
    if (this.portalPaginator) this.portalConAcceso.paginator = this.portalPaginator;
    if (this.pendientesPaginator) this.portalPendientes.paginator = this.pendientesPaginator;
    if (this.sinCorreoPaginator) this.portalSinCorreo.paginator = this.sinCorreoPaginator;
  }

  cargarStaff(): void {
    this.loadingStaff = true;
    this.usuariosService.getUsuarios().pipe(takeUntil(this.destroy$)).subscribe({
      next: usuarios => {
        this.dataSource.data = (usuarios || []).filter((u: { activo?: boolean }) => u.activo !== false);
        this.loadingStaff = false;
        setTimeout(() => this.attachPaginators(), 0);
      },
      error: error => this.handleLoadError('staff', error, () => this.cargarStaff())
    });
  }

  cargarPortalClientes(): void {
    this.loadingPortal = true;
    this.portalClientesService.getPortalClientesLists().pipe(takeUntil(this.destroy$)).subscribe({
      next: lists => {
        this.portalConAcceso.data = lists.conPortal;
        this.portalPendientes.data = lists.pendientes;
        this.portalSinCorreo.data = lists.sinCorreo;
        this.portalStats = {
          conPortal: lists.conPortal.length,
          pendientes: lists.pendientes.length,
          sinCorreo: lists.sinCorreo.length
        };
        this.loadingPortal = false;
        setTimeout(() => this.attachPaginators(), 0);
      },
      error: error => this.handleLoadError('portal', error, () => this.cargarPortalClientes())
    });
  }

  private handleLoadError(scope: string, error: unknown, retry: () => void): void {
    this.logger.error(`Error al cargar ${scope}:`, error);
    if (scope === 'staff') this.loadingStaff = false;
    if (scope === 'portal') this.loadingPortal = false;
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: this.errorMessages.getUserMessage(error, 'cargar datos'),
      showCancelButton: true,
      confirmButtonText: 'Reintentar',
      cancelButtonText: 'Cerrar'
    }).then(result => {
      if (result.isConfirmed) retry();
    });
  }

  aplicarFiltroStaff(event: Event): void {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  aplicarFiltroPortal(event: Event): void {
    this.portalFilter = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.portalConAcceso.filter = this.portalFilter;
  }

  aplicarFiltroPendientes(event: Event): void {
    this.pendientesFilter = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.portalPendientes.filter = this.pendientesFilter;
  }

  aplicarFiltroSinCorreo(event: Event): void {
    this.sinCorreoFilter = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.portalSinCorreo.filter = this.sinCorreoFilter;
  }

  verDetalleCliente(cliente: PortalClienteRow): void {
    this.dialog.open(ClienteDialogComponent, {
      ...ADMIN_DIALOG_DETAIL,
      data: { cliente, modoVer: true }
    });
  }

  getTotalUsuarios(): number {
    return this.dataSource?.data?.length ?? 0;
  }

  getCountPerfil(perfil: string): number {
    return (this.dataSource?.data ?? []).filter(u => u.perfil === perfil).length;
  }

  getPerfilLabel(perfil: string | undefined): string {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      doctor: 'Doctor/Veterinario',
      peluquero: 'Peluquero',
      recepcionista: 'Recepcionista'
    };
    return perfil ? (labels[perfil] ?? perfil) : 'N/P';
  }

  abrirModalUsuario(usuario: any = null, modoVer: boolean = false): void {
    const dialogRef = this.dialog.open(UsuarioDialogComponent, {
      ...(modoVer ? ADMIN_DIALOG_DETAIL : ADMIN_DIALOG_FORM),
      data: { usuario, modoVer }
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result && !modoVer) {
        this.saving = true;
        this.loadingService.show();
        const op = result.id
          ? this.usuariosService.actualizarUsuarioStaff(result.id, {
              uid: result.id,
              nombre: result.nombre,
              telefono: result.telefono,
              perfil: result.perfil,
              activo: result.activo,
              email: result.correo
            })
          : this.usuariosService.provisionarUsuarioStaff({
              email: result.correo,
              password: result.password,
              nombre: result.nombre,
              telefono: result.telefono,
              perfil: result.perfil
            });

        op
          .then(() => {
            this.loadingService.hide();
            Swal.fire(
              'Éxito',
              result.id ? 'Usuario actualizado correctamente' : 'Usuario creado con acceso al sistema',
              'success'
            );
            this.cargarStaff();
          })
          .catch(error => {
            this.logger.error('Error al guardar usuario:', error);
            this.loadingService.hide();
            Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar usuario'), 'error');
          })
          .finally(() => { this.saving = false; });
      }
    });
  }

  editarUsuario(usuario: any): void {
    this.abrirModalUsuario(usuario, false);
  }

  verUsuario(usuario: any): void {
    this.abrirModalUsuario(usuario, true);
  }

  bajaLogicaUsuario(id: string): void {
    Swal.fire({
      title: '¿Borrar este usuario?',
      text: 'El usuario se ocultará y no podrá iniciar sesión. Los datos se conservan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.saving = true;
        this.loadingService.show();
        this.usuariosService.actualizarUsuarioStaff(id, { uid: id, activo: false })
          .then(() => {
            this.loadingService.hide();
            Swal.fire('Borrado', 'El usuario fue borrado correctamente.', 'success');
            this.cargarStaff();
          })
          .catch(error => {
            this.logger.error('Error al dar de baja usuario:', error);
            this.loadingService.hide();
            Swal.fire('Error', this.errorMessages.getUserMessage(error, 'dar de baja usuario'), 'error');
          })
          .finally(() => { this.saving = false; });
      }
    });
  }

  activarPortalCliente(cliente: PortalClienteRow): void {
    const dialogRef = this.dialog.open(ProvisionPortalClienteDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: { cliente }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (!result?.clienteId) return;

      this.saving = true;
      this.loadingService.show();
      this.firebaseFunctions.provisionPortalClient(result.clienteId)
        .then(res => {
          this.loadingService.hide();
          const icon = res.emailSent ? 'success' : 'warning';
          Swal.fire({
            icon,
            title: res.emailSent ? 'Portal activado' : 'Portal activado (revisar correo)',
            text: res.message || 'Cuenta creada correctamente.'
          });
          this.cargarPortalClientes();
        })
        .catch(error => {
          this.logger.error('Error al activar portal:', error);
          this.loadingService.hide();
          Swal.fire('Error', this.errorMessages.getUserMessage(error, 'activar portal cliente'), 'error');
        })
        .finally(() => { this.saving = false; });
    });
  }

  desactivarPortalCliente(cliente: PortalClienteRow): void {
    Swal.fire({
      title: '¿Desactivar portal?',
      text: 'El cliente no podrá iniciar sesión en el portal. Sus datos clínicos se conservan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.saving = true;
      this.loadingService.show(LOADING_MESSAGES.updating);
      this.firebaseFunctions.deactivatePortalClient(cliente.id)
        .then(res => {
          this.loadingService.hide();
          Swal.fire('Desactivado', res.message || 'Portal desactivado.', 'success');
          this.cargarPortalClientes();
        })
        .catch(error => {
          this.logger.error('Error al desactivar portal:', error);
          this.loadingService.hide();
          Swal.fire('Error', this.errorMessages.getUserMessage(error, 'desactivar portal cliente'), 'error');
        })
        .finally(() => { this.saving = false; });
    });
  }

  reenviarAccesoPortal(cliente: PortalClienteRow): void {
    Swal.fire({
      title: '¿Reenviar acceso?',
      text: 'Se generará una nueva contraseña temporal y se enviará al correo del cliente.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Reenviar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.saving = true;
      this.loadingService.show();
      this.firebaseFunctions.resendPortalClientAccess(cliente.id)
        .then(res => {
          this.loadingService.hide();
          Swal.fire({
            icon: res.emailSent ? 'success' : 'warning',
            title: 'Acceso reenviado',
            text: res.message || 'Operación completada.'
          });
        })
        .catch(error => {
          this.logger.error('Error al reenviar acceso:', error);
          this.loadingService.hide();
          Swal.fire('Error', this.errorMessages.getUserMessage(error, 'reenviar acceso portal'), 'error');
        })
        .finally(() => { this.saving = false; });
    });
  }
}
