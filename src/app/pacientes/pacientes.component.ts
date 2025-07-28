import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { PacientesService } from './pacientes.service';
import { ClientesService } from '../clientes/clientes.service';
import { PacienteDialogComponent } from './paciente-dialog.component';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pacientes',
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.css']
})
export class PacientesComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Propiedades para la nueva vista
  searchTerm: string = '';
  pacientesFiltrados: any[] = [];
  pacienteSeleccionado: any = null;
  allPacientes: any[] = [];
  allClientes: any[] = [];

  // Propiedades para vacunas
  nuevaVacuna: string = '';
  observacionesVacuna: string = '';
  proximaVacuna: string = '';
  fechaVacuna: Date | null = null;

  // Historial clínico de ejemplo
  historialClinico = [
    {
      fecha: '11/12/2024',
      hora: '09:58',
      descripcion: 'aquí podemos usar la...',
      tiempoAtras: 'Hace 4 semanas y 2 días',
      usuario: 'Martin Soporte'
    },
    {
      fecha: '29/10/2024',
      hora: '11:19',
      descripcion: 'hola',
      tiempoAtras: 'Hace 2 meses y 2 semanas',
      usuario: 'Prueba MyVete Sucursal De Prueba'
    },
    {
      fecha: '29/10/2024',
      hora: '11:18',
      descripcion: 'hola',
      tiempoAtras: 'Hace 2 meses y 2 semanas',
      usuario: 'SysAdmin'
    },
    {
      fecha: '24/01/2024',
      hora: '09:00',
      descripcion: 'ANTIPARASITARIOS F...',
      tiempoAtras: 'Hace 11 meses y 2 semanas',
      usuario: 'SysAdmin'
    }
  ];

  // Propiedades originales
  displayedColumns: string[] = ['nombre', 'especie', 'raza', 'sexo', 'edad', 'color', 'peso', 'nombreCliente', 'acciones'];
  dataSource!: MatTableDataSource<any>;

  duenioEditable: any = { nombre: '', email: '', telefono: '' };
  historialEjemplo: any[] = [
    { fecha: '11/12/2024', descripcion: 'Consulta general, sin novedades.' },
    { fecha: '29/10/2024', descripcion: 'Vacunación anual.' }
  ];
  vacunasEjemplo: any[] = [
    { nombre: 'Quíntuple', fecha: '10/10/2024', observaciones: 'Sin reacción.' }
  ];
  recordatoriosEjemplo: any[] = [
    { tipo: 'Desparasitación', fecha: '01/11/2024', estado: 'Pendiente' }
  ];
  busquedaHistorial: string = '';

  onFotoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.pacienteSeleccionado.foto = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  errores: any = {
    paciente: {},
    duenio: {},
    vacunas: [],
    historial: [],
    recordatorios: []
  };

  validarPaciente() {
    const p = this.pacienteSeleccionado;
    this.errores.paciente = {
      nombre: !p.nombre,
      especie: !p.especie,
      raza: !p.raza,
      edad: !p.edad,
      peso: !p.peso,
      color: !p.color
    };
    return !Object.values(this.errores.paciente).some(e => e);
  }

  validarDuenio() {
    const d = this.duenioEditable;
    this.errores.duenio = {
      nombre: !d.nombre,
      telefono: !d.telefono,
      email: d.email && !/^\S+@\S+\.\S+$/.test(d.email)
    };
    return !Object.values(this.errores.duenio).some(e => e);
  }

  validarVacunas() {
    this.errores.vacunas = this.vacunasEjemplo.map(v => ({
      nombre: !v.nombre,
      fecha: !v.fecha
    }));
    return this.errores.vacunas.every(e => !e.nombre && !e.fecha);
  }

  validarHistorial() {
    this.errores.historial = this.historialEjemplo.map(h => ({
      fecha: !h.fecha,
      descripcion: !h.descripcion
    }));
    return this.errores.historial.every(e => !e.fecha && !e.descripcion);
  }

  validarRecordatorios() {
    this.errores.recordatorios = this.recordatoriosEjemplo.map(r => ({
      tipo: !r.tipo,
      fecha: !r.fecha
    }));
    return this.errores.recordatorios.every(e => !e.tipo && !e.fecha);
  }

  esFormularioValido() {
    return this.validarPaciente() && this.validarDuenio() && this.validarVacunas() && this.validarHistorial() && this.validarRecordatorios();
  }

  guardarCambios() {
    if (!this.esFormularioValido()) {
      alert('Por favor corrige los errores antes de guardar.');
      return;
    }
    // Aquí guardarías los cambios en la base de datos
    alert('Cambios guardados (simulado)');
  }

  agregarHistorial() {
    this.historialEjemplo.push({ fecha: '', descripcion: '' });
  }
  eliminarHistorial(h: any) {
    this.historialEjemplo = this.historialEjemplo.filter(x => x !== h);
  }
  agregarVacuna() {
    this.vacunasEjemplo.push({ nombre: '', fecha: '', observaciones: '' });
  }
  eliminarVacuna(v: any) {
    this.vacunasEjemplo = this.vacunasEjemplo.filter(x => x !== v);
  }
  agregarRecordatorio() {
    this.recordatoriosEjemplo.push({ tipo: '', fecha: '', estado: '' });
  }
  eliminarRecordatorio(r: any) {
    this.recordatoriosEjemplo = this.recordatoriosEjemplo.filter(x => x !== r);
  }

  constructor(
    private pacientesService: PacientesService,
    private clientesService: ClientesService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit() {
    this.pacientesService.getPacientes().subscribe(pacientes => {
      this.allPacientes = pacientes || [];
      this.filtrarPacientes();
    });
    this.clientesService.getClientes().subscribe(clientes => {
      this.allClientes = clientes || [];
    });
  }

  filtrarPacientes() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.pacientesFiltrados = [];
      return;
    }
    this.pacientesFiltrados = this.allPacientes.filter(p => {
      const nombre = (p.nombre || '').toLowerCase();
      const clienteNombre = this.getClienteNombre(p.cliente_id).toLowerCase();
      return nombre.includes(term) || clienteNombre.includes(term);
    });
  }

  seleccionarPaciente(paciente: any) {
    this.pacienteSeleccionado = paciente;
  }

  limpiarSeleccion() {
    this.pacienteSeleccionado = null;
    this.searchTerm = '';
    this.pacientesFiltrados = [];
  }

  getClienteNombre(idCliente: string): string {
    const cliente = this.allClientes.find(c => c.id === idCliente);
    if (!cliente) return 'Desconocido';
    return [cliente.nombre, cliente.apellidoPaterno, cliente.apellidoMaterno].filter(Boolean).join(' ');
  }

  displayPaciente = (paciente: any): string => {
    if (!paciente || !paciente.nombre) return '';
    const clienteNombre = this.getClienteNombre(paciente.idCliente);
    return `${paciente.nombre} - ${clienteNombre}`;
  }

  toggleSidenav() {
    // Este método se puede implementar si necesitas funcionalidad del menú
    console.log('Toggle sidenav');
  }

  getClienteTelefono(idCliente: string): string {
    const cliente = this.allClientes.find(c => c.id === idCliente);
    return cliente?.telefono || 'Sin teléfono';
  }

  getClienteEmail(idCliente: string): string {
    const cliente = this.allClientes.find(c => c.id === idCliente);
    return cliente?.email || 'Sin email';
  }

  calcularEdad(fechaNacimiento: string): string {
    if (!fechaNacimiento) return 'Edad no registrada';
    
    const fechaNac = new Date(fechaNacimiento);
    const hoy = new Date();
    const diferencia = hoy.getTime() - fechaNac.getTime();
    const años = Math.floor(diferencia / (1000 * 60 * 60 * 24 * 365));
    const meses = Math.floor((diferencia % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    
    if (años > 0) {
      return `${años} año${años > 1 ? 's' : ''} y ${meses} mes${meses > 1 ? 'es' : ''}`;
    } else {
      return `${meses} mes${meses > 1 ? 'es' : ''}`;
    }
  }

  // Eliminar métodos y referencias viejas
  // Eliminar cargarDatos(), onSearchInput(), clearSearch(), selectPatient(), backToSearch(), nuevoPaciente(), editPatient(), addHistory(), nuevaCita(), verHistoriales(), agregarVacuna(), onTabChange(), getClienteInfo(), goBack(), aplicarFiltro(), abrirModalPaciente(), verPaciente(), editarPaciente(), bajaLogicaPaciente(), y cualquier referencia a allPatients, allClients, filteredPatients, selectedPatient.
}
