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
  usuario: any = { nombre: 'Administrador', rol: 'admin' };
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

  checkMobile() {
    this.isMobile = window.innerWidth < 900;
    if (!this.isMobile) {
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
    this.authService.logout?.();
    this.router.navigate(['/admin/login']);
  }
  navegar(ruta: string) {
    this.router.navigate([ruta]);
    this.closeSidenav();
  }
} 