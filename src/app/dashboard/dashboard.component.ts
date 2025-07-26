import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';
import { PacientesService } from '../pacientes/pacientes.service';
import { ClientesService } from '../clientes/clientes.service';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        style({ opacity: 0 }),
        animate('250ms', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit {
  breadcrumbs: Array<{ label: string, url: string }> = [];
  
  // Búsqueda de pacientes
  searchControl = new FormControl('');
  pacientes: any[] = [];
  clientes: any[] = [];
  pacientesFiltrados$: Observable<any[]>;
  pacienteSeleccionado: any = null;
  mostrarDetalles = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private pacientesService: PacientesService,
    private clientesService: ClientesService
  ) {
    this.pacientesFiltrados$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPacientes(value || ''))
    );
  }

  ngOnInit(): void {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.breadcrumbs = this.buildBreadcrumbs(this.route.root);
    });

    // Cargar pacientes y clientes
    this.pacientesService.getPacientes().subscribe(pacientes => {
      this.pacientes = (pacientes || []).filter(p => p.activo !== false);
    });

    this.clientesService.getClientes().subscribe(clientes => {
      this.clientes = (clientes || []).filter(c => c.activo !== false);
    });
  }

  logout() {
    this.authService.logout();
  }

  private _filterPacientes(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.pacientes.filter(paciente => {
      const nombrePaciente = paciente.nombre ? paciente.nombre.toLowerCase() : '';
      const nombreCliente = paciente.nombreCliente ? paciente.nombreCliente.toLowerCase() : '';
      const especie = paciente.especie ? paciente.especie.toLowerCase() : '';
      const raza = paciente.raza ? paciente.raza.toLowerCase() : '';
      
      return nombrePaciente.includes(filterValue) || 
             nombreCliente.includes(filterValue) || 
             especie.includes(filterValue) || 
             raza.includes(filterValue);
    });
  }

  onPacienteSelected(paciente: any) {
    this.pacienteSeleccionado = paciente;
    this.mostrarDetalles = true;
    this.searchControl.setValue(paciente.nombre);
  }

  getClienteInfo(paciente: any): any {
    if (!paciente.idCliente) return null;
    return this.clientes.find(c => c.id === paciente.idCliente);
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
      case 'clientes': return 'Clientes';
      case 'pacientes': return 'Pacientes';
      case 'citas': return 'Citas';
      case 'historiales': return 'Historiales';
      default: return '';
    }
  }
}
