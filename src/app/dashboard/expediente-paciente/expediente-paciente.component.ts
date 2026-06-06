import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { Observable, Subject, forkJoin } from 'rxjs';
import { map, startWith, takeUntil, take } from 'rxjs/operators';
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
export class ExpedientePacienteComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
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
  citasProximas: Array<{
    hora: string;
    fecha: string;
    paciente: string;
    cliente: string;
    tipo: string;
    estado: string;
  }> = [];

  pacientesRecientes: Array<{
    nombre: string;
    raza: string;
    propietario: string;
  }> = [];

  actividadesRecientes: Array<{
    tipo: string;
    icono: string;
    descripcion: string;
    tiempo: string;
  }> = [];

  recordatorios: Array<{
    icono: string;
    titulo: string;
    descripcion: string;
    fecha: string;
    prioridad: string;
  }> = [];

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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.pacientesService.getPacientes().pipe(takeUntil(this.destroy$)).subscribe(pacientes => {
      this.pacientes = pacientes || [];
      this.pacientes = this.pacientes.map(paciente => ({
        ...paciente,
        nombreCliente: this.getClienteInfo(paciente.cliente_id || paciente.idCliente)?.nombre || 'N/A'
      }));
    });

    this.clientesService.getClientes().pipe(takeUntil(this.destroy$)).subscribe(clientes => {
      this.clientes = clientes || [];
    });
  }

  cargarEstadisticas() {
    forkJoin({
      pacientes: this.pacientesService.getPacientes().pipe(take(1)),
      clientes: this.clientesService.getClientes().pipe(take(1)),
      citas: this.citasService.getCitas().pipe(take(1)),
      historiales: this.historialesService.getHistorialesActivos().pipe(take(1))
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ pacientes, clientes, citas, historiales }) => {
        const pacientesActivos = (pacientes || []).filter((p: { activo?: boolean }) => p.activo !== false);
        const clientesActivos = (clientes || []).filter((c: { activo?: boolean }) => c.activo !== false);
        this.totalPacientes = pacientesActivos.length;
        this.totalClientes = clientesActivos.length;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);

        const citasActivas = citas || [];
        this.citasHoy = citasActivas.filter(c => this.parseCitaDate(c)?.getTime() === hoy.getTime()).length;

        const hace7Dias = new Date(hoy);
        hace7Dias.setDate(hace7Dias.getDate() - 7);
        this.historialesRecientes = (historiales || []).filter(h => {
          const fecha = this.parseFlexibleDate(h.fecha_registro || h.created_at);
          return fecha && fecha >= hace7Dias;
        }).length;

        this.ingresosHoy = 0;
        this.cargarCitasProximas(citasActivas, pacientesActivos, clientesActivos);
        this.cargarPacientesRecientes(pacientesActivos, clientesActivos);
      }
    });
  }

  private cargarCitasProximas(citas: any[], pacientes: any[], clientes: any[]) {
    const pacientesMap: Record<string, string> = {};
    const clientesMap: Record<string, string> = {};
    pacientes.forEach(p => { pacientesMap[p.id] = p.nombre || 'N/P'; });
    clientes.forEach(c => {
      clientesMap[c.id] = [c.nombre, c.apellidoPaterno].filter(Boolean).join(' ') || 'N/P';
    });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    this.citasProximas = citas
      .map(cita => {
        const fecha = this.parseCitaDate(cita);
        if (!fecha) {
          return null;
        }
        const pacienteId = cita.paciente_id || cita.idPaciente;
        const clienteId = cita.cliente_id || cita.idCliente;
        return {
          hora: cita.hora || cita.hora_cita || '--:--',
          fecha: this.formatFechaRelativa(fecha, hoy),
          paciente: pacientesMap[pacienteId] || 'N/P',
          cliente: clientesMap[clienteId] || 'N/P',
          tipo: cita.tipo || cita.motivo || 'Consulta',
          estado: cita.estado || 'pendiente',
          _sort: fecha.getTime()
        };
      })
      .filter((c): c is NonNullable<typeof c> => !!c && c._sort >= hoy.getTime())
      .sort((a, b) => a._sort - b._sort)
      .slice(0, 8)
      .map(({ _sort, ...cita }) => cita);
  }

  private cargarPacientesRecientes(pacientes: any[], clientes: any[]) {
    this.pacientesRecientes = [...pacientes]
      .reverse()
      .slice(0, 4)
      .map(p => {
        const cliente = clientes.find(c => c.id === (p.cliente_id || p.idCliente));
        return {
          nombre: p.nombre || 'N/P',
          raza: p.raza || 'N/P',
          propietario: cliente?.nombre || 'N/P'
        };
      });
  }

  private parseCitaDate(cita: any): Date | null {
    const raw = cita.fecha || cita.fecha_cita || cita.fecha_hora;
    if (!raw) {
      return null;
    }
    const fecha = new Date(raw);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }

  private parseFlexibleDate(value: string | undefined): Date | null {
    if (!value) {
      return null;
    }
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const fecha = new Date(normalized);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }

  private formatFechaRelativa(fecha: Date, hoy: Date): string {
    const comparar = new Date(fecha);
    comparar.setHours(0, 0, 0, 0);
    if (comparar.getTime() === hoy.getTime()) {
      return 'Hoy';
    }
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    if (comparar.getTime() === manana.getTime()) {
      return 'Mañana';
    }
    return fecha.toLocaleDateString('es-MX');
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