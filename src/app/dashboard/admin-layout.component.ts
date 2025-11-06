import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        style({ opacity: 0 }),
        animate('250ms', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class AdminLayoutComponent implements OnInit {
  breadcrumbs: Array<{ label: string, url: string }> = [];
  sidenavOpened = false;
  totalPacientes = 0;
  totalClientes = 0;
  citasHoy = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.log('🔍 AdminLayoutComponent inicializado');
    console.log('🔍 Total pacientes:', this.totalPacientes);
    
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.breadcrumbs = this.buildBreadcrumbs(this.route.root);
    });
  }

  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
  }
  closeSidenav() {
    this.sidenavOpened = false;
  }





  logout() {
    // Implementar lógica de logout si es necesario
  }

  private buildBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: Array<{ label: string, url: string }> = []): Array<{ label: string, url: string }> {
    let children: ActivatedRoute[] = route.children;
    if (children.length === 0) {
      return breadcrumbs;
    }
    for (let child of children) {
      let routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }
      let label = child.snapshot.data['breadcrumb'] || this.getLabelFromPath(routeURL);
      if (label) {
        breadcrumbs.push({ label, url });
      }
      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }
    return breadcrumbs;
  }

  private getLabelFromPath(path: string): string {
    switch (path) {
      case 'dashboard': return 'Dashboard';
      case 'usuarios': return 'Usuarios';
      case 'cliente': return 'Clientes';
      case 'paciente': return 'Pacientes';
      case 'citas': return 'Citas';
      case 'historiales': return 'Historiales';
      case 'inventario': return 'Inventario';
      default: return '';
    }
  }
} 