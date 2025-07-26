import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { PacientesService } from '../pacientes/pacientes.service';
import { ClientesService } from '../clientes/clientes.service';
import { CitasService } from '../citas/citas.service';
import { HistorialesService } from '../historiales/historiales.service';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-expediente-paciente',
  templateUrl: './expediente-paciente/expediente-paciente.component.html',
  styleUrls: ['./expediente-paciente/expediente-paciente.component.css']
})
export class ExpedientePacienteComponent implements OnInit {
  // Menú hamburguesa
  sidenavOpened = true;

  // Búsqueda de pacientes
  searchControl = new FormControl('');
  pacientes: any[] = [];
  clientes: any[] = [];
  pacientesFiltrados$: Observable<any[]>;
  pacienteSeleccionado: any = null;
  mostrarDetalles = false;

  // Estadísticas del dashboard
  totalPacientes = 0;
  totalClientes = 0;
  citasHoy = 0;
  historialesRecientes = 0;

  constructor(
    private pacientesService: PacientesService,
    private clientesService: ClientesService,
    private citasService: CitasService,
    private historialesService: HistorialesService,
    private authService: AuthService,
    private router: Router
  ) {
    this.pacientesFiltrados$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPacientes(value || ''))
    );
  }

  ngOnInit() {
    this.cargarDatos();
    this.cargarEstadisticas();
  }

  // Funciones del menú hamburguesa
  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
  }

  closeSidenav() {
    this.sidenavOpened = false;
  }

  // Funciones de búsqueda
  private _filterPacientes(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.pacientes.filter(paciente => 
      paciente.nombre?.toLowerCase().includes(filterValue) ||
      paciente.nombreCliente?.toLowerCase().includes(filterValue)
    );
  }

  onPacienteSelected(paciente: any) {
    this.pacienteSeleccionado = paciente;
    this.mostrarDetalles = true;
    this.searchControl.setValue('');
  }

  // Cargar datos
  cargarDatos() {
    this.pacientesService.getPacientes().subscribe(pacientes => {
      this.pacientes = pacientes || [];
      this.pacientes = this.pacientes.map(paciente => ({
        ...paciente,
        nombreCliente: this.getClienteInfo(paciente.cliente_id)?.nombre || 'N/A'
      }));
    });

    this.clientesService.getClientes().subscribe(clientes => {
      this.clientes = clientes || [];
    });
  }

  cargarEstadisticas() {
    // Cargar estadísticas básicas
    this.pacientesService.getPacientes().subscribe(pacientes => {
      this.totalPacientes = pacientes?.length || 0;
    });

    this.clientesService.getClientes().subscribe(clientes => {
      this.totalClientes = clientes?.length || 0;
    });

    // Aquí puedes agregar más lógica para cargar citas de hoy y historiales recientes
    this.citasHoy = 5; // Ejemplo
    this.historialesRecientes = 3; // Ejemplo
  }

  getClienteInfo(clienteId: string) {
    return this.clientes.find(cliente => cliente.id === clienteId);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
} 