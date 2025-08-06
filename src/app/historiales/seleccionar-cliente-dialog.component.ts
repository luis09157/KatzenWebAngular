import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClientesService } from '../clientes/clientes.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-seleccionar-cliente-dialog',
  templateUrl: './seleccionar-cliente-dialog.component.html',
  styleUrls: ['./seleccionar-cliente-dialog.component.css']
})
export class SeleccionarClienteDialogComponent implements OnInit {
  clientes: any[] = [];
  clientesFiltrados: any[] = [];
  pacientes: any[] = [];
  clienteSeleccionado: any = null;
  pacienteSeleccionado: any = null;
  pasoActual = 1; // 1: seleccionar cliente, 2: seleccionar paciente
  loading = false;
  filtroCliente = '';

  constructor(
    private clientesService: ClientesService,
    private pacientesService: PacientesService,
    private dialogRef: MatDialogRef<SeleccionarClienteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
    this.loading = true;
    console.log('🔄 Cargando clientes...');
    this.clientesService.getClientes().subscribe({
      next: (clientes) => {
        console.log('📋 Clientes recibidos:', clientes);
        this.clientes = clientes || [];
        this.clientesFiltrados = [...this.clientes];
        console.log('✅ Clientes cargados:', this.clientes.length);
        console.log('🔍 Clientes filtrados:', this.clientesFiltrados.length);
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar clientes:', error);
        this.clientes = [];
        this.clientesFiltrados = [];
        this.loading = false;
      }
    });
  }

  cargarPacientes(clienteId: string) {
    this.loading = true;
    console.log('🔄 Cargando pacientes para cliente:', clienteId);
    this.pacientesService.getPacientes().subscribe({
      next: (pacientes) => {
        console.log('📋 Pacientes recibidos:', pacientes);
        // Mostrar todos los pacientes del cliente (vivos y fallecidos)
        this.pacientes = (pacientes || []).filter(p => p.idCliente === clienteId);
        console.log('✅ Pacientes cargados para cliente', clienteId, ':', this.pacientes.length);
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar pacientes:', error);
        this.pacientes = [];
        this.loading = false;
      }
    });
  }

  aplicarFiltroCliente(event: Event) {
    const filtro = (event.target as HTMLInputElement).value.toLowerCase();
    this.filtroCliente = filtro;
    
    console.log('🔍 Aplicando filtro:', filtro);
    
    if (!filtro) {
      this.clientesFiltrados = [...this.clientes];
      console.log('📋 Mostrando todos los clientes:', this.clientesFiltrados.length);
    } else {
      this.clientesFiltrados = this.clientes.filter(cliente => {
        const nombreCompleto = this.getNombreCompletoCliente(cliente).toLowerCase();
        const telefono = (cliente.telefono || '').toLowerCase();
        const correo = (cliente.correo || '').toLowerCase();
        const expediente = (cliente.expediente || '').toLowerCase();
        
        const coincideNombre = nombreCompleto.includes(filtro);
        const coincideTelefono = telefono.includes(filtro);
        const coincideCorreo = correo.includes(filtro);
        const coincideExpediente = expediente.includes(filtro);
        
        const coincide = coincideNombre || coincideTelefono || coincideCorreo || coincideExpediente;
        
        if (coincide) {
          console.log('✅ Cliente coincide:', {
            nombre: nombreCompleto,
            telefono: telefono,
            correo: correo,
            expediente: expediente
          });
        }
        
        return coincide;
      });
      
      console.log('🔍 Clientes filtrados encontrados:', this.clientesFiltrados.length);
    }
  }

  seleccionarCliente(cliente: any) {
    this.clienteSeleccionado = cliente;
    this.cargarPacientes(cliente.id);
    this.pasoActual = 2;
  }

  seleccionarPaciente(paciente: any) {
    // Validar que el paciente no esté fallecido
    if (paciente.estado === 'Fallecido' || paciente.estado === 'fallecido') {
      console.log('❌ No se puede agregar historial a paciente fallecido:', paciente.nombre);
      return;
    }
    
    this.pacienteSeleccionado = paciente;
    this.continuar();
  }

  continuar() {
    if (this.clienteSeleccionado && this.pacienteSeleccionado) {
      // Validación adicional para pacientes fallecidos
      if (this.pacienteSeleccionado.estado === 'Fallecido' || this.pacienteSeleccionado.estado === 'fallecido') {
        console.log('❌ No se puede agregar historial a paciente fallecido:', this.pacienteSeleccionado.nombre);
        return;
      }
      
      this.dialogRef.close({
        cliente: this.clienteSeleccionado,
        paciente: this.pacienteSeleccionado
      });
    }
  }

  retroceder() {
    this.pasoActual = 1;
    this.pacienteSeleccionado = null;
  }

  cancelar() {
    this.dialogRef.close(null);
  }

  getNombreCompletoCliente(cliente: any): string {
    const nombre = cliente.nombre || '';
    const apellidoPaterno = cliente.apellidoPaterno || '';
    const apellidoMaterno = cliente.apellidoMaterno || '';
    
    return `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim();
  }

  getInformacionCliente(cliente: any): string {
    const nombre = this.getNombreCompletoCliente(cliente);
    const telefono = cliente.telefono || 'Sin teléfono';
    return `${nombre} - ${telefono}`;
  }

  getInformacionPaciente(paciente: any): string {
    const nombre = paciente.nombre || 'Sin nombre';
    const especie = paciente.especie || 'Sin especie';
    const raza = paciente.raza ? ` (${paciente.raza})` : '';
    return `${nombre} - ${especie}${raza}`;
  }

  isPacienteFallecido(paciente: any): boolean {
    return paciente.estado === 'Fallecido' || paciente.estado === 'fallecido';
  }

  getPacientesVivos(): any[] {
    return this.pacientes.filter(p => !this.isPacienteFallecido(p));
  }

  getPacientesFallecidos(): any[] {
    return this.pacientes.filter(p => this.isPacienteFallecido(p));
  }
} 