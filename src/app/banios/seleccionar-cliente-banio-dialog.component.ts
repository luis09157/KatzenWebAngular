import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ClientesService } from '../clientes/clientes.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-seleccionar-cliente-banio-dialog',
  templateUrl: './seleccionar-cliente-banio-dialog.component.html',
  styleUrls: ['./seleccionar-cliente-banio-dialog.component.css']
})
export class SeleccionarClienteBanioDialogComponent implements OnInit {
  clientes: any[] = [];
  pacientes: any[] = [];
  clienteSeleccionado: any = null;
  pacienteSeleccionado: any = null;
  
  // Controles de búsqueda
  clienteControl = new FormControl();
  pacienteControl = new FormControl();
  
  // Filtros
  clientesFiltrados: Observable<any[]> = new Observable();
  pacientesFiltrados: Observable<any[]> = new Observable();

  constructor(
    private dialogRef: MatDialogRef<SeleccionarClienteBanioDialogComponent>,
    private clientesService: ClientesService,
    private pacientesService: PacientesService
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
    this.configurarFiltros();
  }

  cargarClientes() {
    this.clientesService.getClientes().subscribe(clientes => {
      this.clientes = (clientes || []).filter(c => c.activo !== false);
    });
  }

  configurarFiltros() {
    // Filtro de clientes
    this.clientesFiltrados = this.clienteControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300), // Esperar 300ms después de que el usuario deje de escribir
      distinctUntilChanged(), // Solo emitir si el valor cambió
      map(value => this._filtrarClientes(value))
    );

    // Filtro de pacientes
    this.pacientesFiltrados = this.pacienteControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300), // Esperar 300ms después de que el usuario deje de escribir
      distinctUntilChanged(), // Solo emitir si el valor cambió
      map(value => this._filtrarPacientes(value))
    );
  }

  private _filtrarClientes(value: string): any[] {
    if (!value || value.trim() === '') {
      return this.clientes;
    }
    
    const filterValue = value.toLowerCase().trim();
    return this.clientes.filter(cliente => {
      // Búsqueda por nombre completo (incluye apellidos)
      const nombre = cliente.nombre ? cliente.nombre.toLowerCase() : '';
      const apellidoPaterno = cliente.apellidoPaterno ? cliente.apellidoPaterno.toLowerCase() : '';
      const apellidoMaterno = cliente.apellidoMaterno ? cliente.apellidoMaterno.toLowerCase() : '';
      const telefono = cliente.telefono ? cliente.telefono : '';
      const expediente = cliente.expediente ? cliente.expediente.toString() : '';
      
      // Construir nombre completo para búsqueda
      const nombreCompleto = `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.toLowerCase().trim();
      
      // Búsqueda por nombre completo (incluye apellidos)
      const coincideNombreCompleto = nombreCompleto.includes(filterValue);
      
      // Búsqueda por palabras individuales (nombre, apellido paterno, apellido materno)
      const palabrasNombre = nombre.split(' ').filter(palabra => palabra.length > 0);
      const palabrasApellidoPaterno = apellidoPaterno.split(' ').filter(palabra => palabra.length > 0);
      const palabrasApellidoMaterno = apellidoMaterno.split(' ').filter(palabra => palabra.length > 0);
      
      const coincidePorPalabras = [
        ...palabrasNombre,
        ...palabrasApellidoPaterno,
        ...palabrasApellidoMaterno
      ].some(palabra => 
        palabra.includes(filterValue) || filterValue.includes(palabra)
      );
      
      // Búsqueda por teléfono
      const coincideTelefono = telefono.includes(filterValue);
      
      // Búsqueda por expediente
      const coincideExpediente = expediente.includes(filterValue);
      
      return coincideNombreCompleto || coincidePorPalabras || coincideTelefono || coincideExpediente;
    });
  }

  private _filtrarPacientes(value: string): any[] {
    if (!this.clienteSeleccionado) return [];
    
    if (!value || value.trim() === '') {
      // Solo mostrar pacientes activos del cliente
      // Usar idCliente como en historiales y vacunas
      return this.getPacientesActivos().filter(p => 
        p.idCliente === this.clienteSeleccionado.id || p.cliente_id === this.clienteSeleccionado.id
      );
    }
    
    const filterValue = value.toLowerCase().trim();
    const pacientesDelCliente = this.getPacientesActivos().filter(p => 
      p.idCliente === this.clienteSeleccionado.id || p.cliente_id === this.clienteSeleccionado.id
    );
    
    return pacientesDelCliente.filter(paciente => {
      const nombre = paciente.nombre ? paciente.nombre.toLowerCase() : '';
      const especie = paciente.especie ? paciente.especie.toLowerCase() : '';
      const raza = paciente.raza ? paciente.raza.toLowerCase() : '';
      
      // Búsqueda por palabras individuales del nombre
      const palabrasNombre = nombre.split(' ').filter(palabra => palabra.length > 0);
      const coincidePorPalabras = palabrasNombre.some(palabra => 
        palabra.includes(filterValue) || filterValue.includes(palabra)
      );
      
      // Búsqueda exacta por nombre completo
      const coincideNombre = nombre.includes(filterValue);
      
      // Búsqueda por especie o raza
      const coincideEspecie = especie.includes(filterValue) || raza.includes(filterValue);
      
      return coincideNombre || coincidePorPalabras || coincideEspecie;
    });
  }

  cargarPacientes(clienteId: string) {
    console.log('🔄 Cargando pacientes para baño del cliente:', clienteId);
    this.pacientesService.getPacientes().subscribe({
      next: (pacientes) => {
        console.log('📋 Pacientes recibidos:', pacientes);
        // Filtrar solo pacientes activos (no fallecidos) para baños
        // Usar idCliente como en historiales y vacunas
        this.pacientes = (pacientes || []).filter(p => 
          (p.idCliente === clienteId || p.cliente_id === clienteId) && 
          p.activo !== false && 
          p.estado !== 'Fallecido' && 
          p.estado !== 'fallecido'
        );
        console.log('✅ Pacientes activos cargados para cliente', clienteId, ':', this.pacientes.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar pacientes:', error);
        this.pacientes = [];
      }
    });
  }

  seleccionarCliente(cliente: any) {
    this.clienteSeleccionado = cliente;
    this.pacienteSeleccionado = null;
    this.pacienteControl.setValue('');
    
    // Cargar pacientes del cliente seleccionado
    this.cargarPacientes(cliente.id);
  }

  seleccionarPaciente(paciente: any) {
    // Validar que el paciente esté activo
    if (paciente.activo === false || paciente.estado === 'Fallecido' || paciente.estado === 'fallecido') {
      console.log('❌ No se puede crear baño para paciente inactivo o fallecido:', paciente.nombre);
      return;
    }
    
    this.pacienteSeleccionado = paciente;
  }

  continuar() {
    if (this.clienteSeleccionado && this.pacienteSeleccionado) {
      // Validación adicional para pacientes inactivos o fallecidos
      if (this.pacienteSeleccionado.activo === false || 
          this.pacienteSeleccionado.estado === 'Fallecido' || 
          this.pacienteSeleccionado.estado === 'fallecido') {
        console.log('❌ No se puede crear baño para paciente inactivo o fallecido:', this.pacienteSeleccionado.nombre);
        return;
      }
      
      this.dialogRef.close({
        cliente_id: this.clienteSeleccionado.id,
        cliente: this.getNombreCompletoCliente(this.clienteSeleccionado),
        paciente_id: this.pacienteSeleccionado.id,
        paciente: this.pacienteSeleccionado.nombre
      });
    }
  }

  cancelar() {
    this.dialogRef.close();
  }

  getClienteDisplay(cliente: any): string {
    return cliente ? `${cliente.nombre} - ${cliente.telefono}` : '';
  }

  getNombreCompletoCliente(cliente: any): string {
    const nombre = cliente.nombre || '';
    const apellidoPaterno = cliente.apellidoPaterno || '';
    const apellidoMaterno = cliente.apellidoMaterno || '';
    
    return `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim();
  }

  isPacienteActivo(paciente: any): boolean {
    return paciente.activo !== false && 
           paciente.estado !== 'Fallecido' && 
           paciente.estado !== 'fallecido';
  }

  getPacientesActivos(): any[] {
    return this.pacientes.filter(p => this.isPacienteActivo(p));
  }

  getPacienteDisplay(paciente: any): string {
    return paciente ? `${paciente.nombre} (${paciente.especie})` : '';
  }
}
