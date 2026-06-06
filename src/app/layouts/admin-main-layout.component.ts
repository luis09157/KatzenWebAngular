import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { SucursalContextService } from '../core/services/sucursal-context.service';
import { StaffModule } from '../core/config/staff-role.config';
import { Router } from '@angular/router';
import { LoggerService } from '../core/logger.service';

@Component({
  selector: 'app-admin-main-layout',
  templateUrl: './admin-main-layout.component.html',
  styleUrls: ['./admin-main-layout.component.css']
})
export class AdminMainLayoutComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private resizeHandler = () => this.checkMobile();
  sidenavOpened = false;
  totalPacientes = 0;
  totalClientes = 0;
  citasHoy = 0;
  usuario: { nombre: string; rol: string; email: string } = { nombre: 'Administrador', rol: 'admin', email: '' };
  isMobile = false;
  isAdmin = false;
  accessibleModules = new Set<StaffModule>();
  sucursales: { id: string; nombre: string }[] = [];
  sucursalSeleccionada = 'principal';

  constructor(
    private authService: AuthService,
    private authProfileService: AuthProfileService,
    private sucursalContext: SucursalContextService,
    private router: Router,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    this.checkMobile();
    this.sucursales = this.sucursalContext.sucursales;
    this.sucursalSeleccionada = this.sucursalContext.getSelectedId();
    window.addEventListener('resize', this.resizeHandler);
    this.authService.user$.pipe(
      takeUntil(this.destroy$),
      switchMap(user => {
        if (!user?.uid) return of(null);
        this.usuario = { nombre: user.displayName || 'Administrador', rol: 'admin', email: user.email || '' };
        return this.authProfileService.getAccessibleModules().then(modules => {
          this.accessibleModules = new Set(modules);
          this.isAdmin = modules.includes('usuarios');
          return null;
        });
      })
    ).subscribe();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeHandler);
    this.destroy$.next();
    this.destroy$.complete();
  }

  getSaludo(): string {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) {
      return '¡Buenos días!';
    } else if (hora >= 12 && hora < 19) {
      return '¡Buenas tardes!';
    } else {
      return '¡Buenas noches!';
    }
  }

  getNombreUsuario(): string {
    if (this.usuario?.email) {
      return this.usuario.email;
    }
    return 'Administrador';
  }

  onSucursalChange(sucursalId: string): void {
    this.sucursalContext.setSelectedId(sucursalId);
    this.sucursalSeleccionada = sucursalId;
  }

  checkMobile() {
    this.isMobile = window.innerWidth < 900;
    this.sidenavOpened = !this.isMobile;
  }

  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
  }

  closeSidenav() {
    this.sidenavOpened = false;
  }

  logout() {
    this.logger.log('Iniciando logout...');
    this.authService.logout().then(() => {
      this.logger.log('Logout exitoso, redirigiendo...');
    }).catch(error => {
      this.logger.error('Error en logout:', error);
      this.router.navigate(['/admin/login']);
    });
  }

  navegar(ruta: string) {
    this.logger.log('🚀 Navegando a:', ruta);
    this.router.navigate([ruta]);
    this.closeSidenav();
  }

  irAlInicio() {
    this.router.navigate(['/admin/inicio']);
  }

  canShow(module: StaffModule): boolean {
    return this.accessibleModules.has(module);
  }
} 