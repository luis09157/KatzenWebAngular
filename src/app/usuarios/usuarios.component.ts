import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UsuariosService } from './usuarios.service';
import { MatDialog } from '@angular/material/dialog';
import { UsuarioDialogComponent } from './usuario-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2';
import { LoadingService } from '../core/loading.service';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  displayedColumns: string[] = ['nombre', 'correo', 'perfil', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  loading = false;
  saving = false;

  constructor(
    private usuariosService: UsuariosService,
    private dialog: MatDialog,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.usuariosService.getUsuarios().pipe(takeUntil(this.destroy$)).subscribe({
      next: usuarios => {
        this.dataSource.data = (usuarios || []).filter((u: { activo?: boolean }) => u.activo !== false);
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
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
        this.usuariosService.guardarUsuario(result).then(() => {
          Swal.fire('Éxito', 'Usuario guardado correctamente', 'success');
          this.ngOnInit();
        }).catch(() => {}).finally(() => { this.saving = false; this.loadingService.hide(); });
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
      text: 'El usuario será dado de baja (baja lógica).',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.saving = true;
        this.loadingService.show();
        this.usuariosService.actualizarUsuario(id, { activo: false }).then(() => {
          Swal.fire('Baja lógica', 'El usuario fue dado de baja correctamente.', 'success');
          this.ngOnInit();
        }).catch(() => {}).finally(() => { this.saving = false; this.loadingService.hide(); });
      }
    });
  }

  // Método temporal para agregar a Veronica Lizbeth Guerra Estrada
  agregarVeronica() {
    Swal.fire({
      title: '¿Agregar a Veronica?',
      text: '¿Deseas agregar a Veronica Lizbeth Guerra Estrada como doctora?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, agregar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.saving = true;
        this.loadingService.show();
        this.usuariosService.agregarVeronicaGuerra().then(success => {
          if (success) {
            Swal.fire({
              title: '¡Éxito!',
              text: 'Veronica Lizbeth Guerra Estrada ha sido agregada como doctora',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
            this.ngOnInit();
          } else {
            Swal.fire({
              title: 'Error',
              text: 'No se pudo agregar a Veronica',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        }).finally(() => { this.saving = false; this.loadingService.hide(); });
      }
    });
  }
}
