import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
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

  constructor(
    private authService: AuthService,
    private router: Router,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    this.checkMobile();
    window.addEventListener('resize', this.resizeHandler);
    this.authService.user$?.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        const u = user as { email?: string; displayName?: string };
        this.usuario = { nombre: u?.displayName || 'Administrador', rol: 'admin', email: u?.email || '' };
      }
    });
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

  checkMobile() {
    this.isMobile = window.innerWidth < 900;
    // En móvil, cerrar el menú automáticamente
    if (this.isMobile && this.sidenavOpened) {
      this.sidenavOpened = false;
    }
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
} 