import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-main-layout',
  templateUrl: './admin-main-layout.component.html',
  styleUrls: ['./admin-main-layout.component.css']
})
export class AdminMainLayoutComponent implements OnInit {
  sidenavOpened = false;
  totalPacientes = 0;
  totalClientes = 0;
  citasHoy = 0;
  usuario: any = { nombre: 'Administrador', rol: 'admin', email: '' };
  isMobile = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Detectar si es móvil
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile.bind(this));
    // Obtener usuario actual
    this.authService.user$?.subscribe(user => {
      if (user) {
        this.usuario = user;
      }
    });
    // Aquí puedes cargar los contadores reales si lo deseas
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
    console.log('Iniciando logout...');
    this.authService.logout().then(() => {
      console.log('Logout exitoso, redirigiendo...');
      // No necesitamos navegar manualmente porque el AuthService ya lo hace
    }).catch(error => {
      console.error('Error en logout:', error);
      // En caso de error, redirigir manualmente
      this.router.navigate(['/admin/login']);
    });
  }

  navegar(ruta: string) {
    this.router.navigate([ruta]);
    this.closeSidenav();
  }
} 