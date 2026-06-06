import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UsuariosService } from './usuarios.service';
import { MatDialog } from '@angular/material/dialog';
import { UsuarioDialogComponent } from './usuario-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2';
import { LoadingService } from '../core/loading.service';
import { LoggerService } from '../core/logger.service';
import { ErrorMessagesService } from '../core/error-messages.service';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly destroy$ = new Subject<void>();
  displayedColumns: string[] = ['nombre', 'correo', 'perfil', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  readonly pageSize = 50;
  loading = false;
  saving = false;

  constructor(
    private usuariosService: UsuariosService,
    private dialog: MatDialog,
    private loadingService: LoadingService,
    private logger: LoggerService,
    private errorMessages: ErrorMessagesService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.usuariosService.getUsuarios().pipe(takeUntil(this.destroy$)).subscribe({
      next: usuarios => {
        this.dataSource.data = (usuarios || []).filter((u: { activo?: boolean }) => u.activo !== false);
        this.loading = false;
        setTimeout(() => {
          if (this.paginator) this.dataSource.paginator = this.paginator;
        }, 0);
      },
      error: (error) => {
        this.logger.error('Error al cargar usuarios:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los usuarios.',
          showCancelButton: true,
          confirmButtonText: 'Reintentar',
          cancelButtonText: 'Cerrar'
        }).then(result => {
          if (result.isConfirmed) {
            this.ngOnInit();
          }
        });
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.paginator) this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  aplicarFiltro(event: Event) {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  abrirModalUsuario(usuario: any = null, modoVer: boolean = false) {
    const dialogRef = this.dialog.open(UsuarioDialogComponent, {
      width: '80vw',
      maxWidth: '90vw',
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
            setTimeout(() => {
              Swal.fire(
                'Éxito',
                result.id ? 'Usuario actualizado correctamente' : 'Usuario creado con acceso al sistema',
                'success'
              );
              this.ngOnInit();
            }, 0);
          })
          .catch((error) => {
            this.logger.error('Error al guardar usuario:', error);
            this.loadingService.hide();
            setTimeout(() => {
              Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar usuario'), 'error');
            }, 0);
          })
          .finally(() => { this.saving = false; });
      }
    });
  }

  editarUsuario(usuario: any) {
    this.abrirModalUsuario(usuario, false);
  }

  verUsuario(usuario: any) {
    this.abrirModalUsuario(usuario, true);
  }

  bajaLogicaUsuario(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'El usuario será dado de baja y no podrá iniciar sesión.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.saving = true;
        this.loadingService.show();
        this.usuariosService.actualizarUsuarioStaff(id, { uid: id, activo: false })
          .then(() => {
            this.loadingService.hide();
            setTimeout(() => {
              Swal.fire('Baja lógica', 'El usuario fue dado de baja correctamente.', 'success');
              this.ngOnInit();
            }, 0);
          })
          .catch((error) => {
            this.logger.error('Error al dar de baja usuario:', error);
            this.loadingService.hide();
            setTimeout(() => {
              Swal.fire('Error', this.errorMessages.getUserMessage(error, 'dar de baja usuario'), 'error');
            }, 0);
          })
          .finally(() => { this.saving = false; });
      }
    });
  }
}
