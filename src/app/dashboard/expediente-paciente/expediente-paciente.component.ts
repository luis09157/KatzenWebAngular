import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { PacientesService } from '../../pacientes/pacientes.service';
import { ClientesService } from '../../clientes/clientes.service';
import { CitasService } from '../../citas/citas.service';
import { HistorialesService } from '../../historiales/historiales.service';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-expediente-paciente',
  templateUrl: './expediente-paciente.component.html',
  styleUrls: ['./expediente-paciente.component.css']
})
export class ExpedientePacienteComponent implements OnInit {
  // Menú lateral
  sidenavOpened = true;

  // Formularios reactivos
  vaccineForm: FormGroup;
  searchForm: FormGroup;
  filterForm: FormGroup;

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
  ingresosHoy = 0;

  // Datos de citas próximas
  citasProximas = [
    {
      hora: '09:00',
      fecha: 'Hoy',
      paciente: 'Luna',
      cliente: 'María González',
      tipo: 'Consulta',
      estado: 'confirmada'
    },
    {
      hora: '11:30',
      fecha: 'Hoy',
      paciente: 'Max',
      cliente: 'Carlos Rodríguez',
      tipo: 'Vacuna',
      estado: 'pendiente'
    },
    {
      hora: '14:00',
      fecha: 'Hoy',
      paciente: 'Bella',
      cliente: 'Ana Martínez',
      tipo: 'Cirugía',
      estado: 'confirmada'
    },
    {
      hora: '16:30',
      fecha: 'Hoy',
      paciente: 'Rocky',
      cliente: 'Luis Pérez',
      tipo: 'Consulta',
      estado: 'pendiente'
    }
  ];

  // Pacientes recientes
  pacientesRecientes = [
    {
      nombre: 'Luna',
      raza: 'Golden Retriever',
      propietario: 'María González'
    },
    {
      nombre: 'Max',
      raza: 'Pastor Alemán',
      propietario: 'Carlos Rodríguez'
    },
    {
      nombre: 'Bella',
      raza: 'Persa',
      propietario: 'Ana Martínez'
    },
    {
      nombre: 'Rocky',
      raza: 'Bulldog',
      propietario: 'Luis Pérez'
    }
  ];

  // Actividades recientes
  actividadesRecientes = [
    {
      tipo: 'cita',
      icono: 'event',
      descripcion: 'Nueva cita programada para Luna',
      tiempo: 'Hace 5 minutos'
    },
    {
      tipo: 'paciente',
      icono: 'pets',
      descripcion: 'Nuevo paciente registrado: Max',
      tiempo: 'Hace 15 minutos'
    },
    {
      tipo: 'vacuna',
      icono: 'medical_services',
      descripcion: 'Vacuna aplicada a Bella',
      tiempo: 'Hace 1 hora'
    },
    {
      tipo: 'consulta',
      icono: 'stethoscope',
      descripcion: 'Consulta completada para Rocky',
      tiempo: 'Hace 2 horas'
    }
  ];

  // Recordatorios
  recordatorios = [
    {
      icono: 'vaccines',
      titulo: 'Vacuna Pendiente',
      descripcion: 'Luna necesita su vacuna anual',
      fecha: 'Mañana 10:00',
      prioridad: 'alta'
    },
    {
      icono: 'event',
      titulo: 'Cita de Seguimiento',
      descripcion: 'Max - Revisión post-cirugía',
      fecha: '15/01/2024',
      prioridad: 'media'
    },
    {
      icono: 'medication',
      titulo: 'Medicamento',
      descripcion: 'Bella - Continuar tratamiento',
      fecha: 'Cada 8 horas',
      prioridad: 'alta'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private pacientesService: PacientesService,
    private clientesService: ClientesService,
    private citasService: CitasService,
    private historialesService: HistorialesService,
    private authService: AuthService,
    private router: Router
  ) {
    this.inicializarFormularios();
    this.pacientesFiltrados$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPacientes(value || ''))
    );
  }

  ngOnInit() {
    this.cargarDatos();
    this.cargarEstadisticas();
  }

  // Inicializar formularios reactivos
  inicializarFormularios() {
    this.vaccineForm = this.fb.group({
      nuevaAplicacion: ['Ninguna'],
      observaciones: [''],
      proximaAplicacion: ['Ninguna'],
      fecha: ['']
    });

    this.searchForm = this.fb.group({
      busqueda: ['']
    });

    this.filterForm = this.fb.group({
      periodo: ['todas'],
      tipo: ['todos']
    });
  }

  // Funciones del menú lateral
  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
  }

  onSidenavChange(opened: boolean) {
    this.sidenavOpened = opened;
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

  // Funciones de formularios
  onSubmitVaccine() {
    if (this.vaccineForm.valid) {
      console.log('Vacuna agregada:', this.vaccineForm.value);
      this.vaccineForm.reset({
        nuevaAplicacion: 'Ninguna',
        observaciones: '',
        proximaAplicacion: 'Ninguna',
        fecha: ''
      });
    }
  }

  onSearch() {
    const busqueda = this.searchForm.get('busqueda')?.value;
    console.log('Búsqueda:', busqueda);
  }

  onFilterChange() {
    const filtros = this.filterForm.value;
    console.log('Filtros aplicados:', filtros);
  }

  // Funciones de tabs
  onTabChange(event: any) {
    console.log('Tab activo:', event.index);
  }

  // Funciones de historial
  onHistorialClick(item: any) {
    console.log('Historial seleccionado:', item);
  }

  toggleFiltrosAvanzados() {
    // Implementar lógica de filtros avanzados
  }

  // Funciones de acciones
  onActionButton(action: string) {
    switch(action) {
      case 'nueva-cita':
        console.log('Crear nueva cita');
        this.router.navigate(['/admin/citas']);
        break;
      case 'nuevo-paciente':
        console.log('Crear nuevo paciente');
        this.router.navigate(['/admin/pacientes']);
        break;
      case 'carrito':
        console.log('Abrir carrito de compras');
        break;
      case 'agregar':
        console.log('Agregar nuevo registro');
        break;
      case 'editar':
        console.log('Editar paciente');
        break;
      case 'casa':
        console.log('Ir al inicio');
        break;
      case 'plan':
        console.log('Mostrar plan de vacunación');
        break;
      case 'ayuda':
        console.log('Mostrar ayuda');
        break;
    }
  }

  // Funciones de pacientes
  verPaciente(paciente: any) {
    console.log('Ver paciente:', paciente);
    this.router.navigate(['/admin/pacientes']);
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
    this.pacientesService.getPacientes().subscribe(pacientes => {
      this.totalPacientes = pacientes?.length || 0;
    });

    this.clientesService.getClientes().subscribe(clientes => {
      this.totalClientes = clientes?.length || 0;
    });

    this.citasHoy = 5;
    this.historialesRecientes = 3;
    this.ingresosHoy = 1250;
  }

  getClienteInfo(clienteId: string) {
    return this.clientes.find(cliente => cliente.id === clienteId);
  }

  // Funciones de utilidad
  getStatusColor(status: string): string {
    switch(status) {
      case 'H': return 'red';
      case 'R': return 'orange';
      case 'A': return 'green';
      default: return 'gray';
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
} 