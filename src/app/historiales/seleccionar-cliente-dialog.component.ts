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
    this.clientesService.getClientes().subscribe(clientes => {
      this.clientes = clientes.filter(c => c.activo !== false);
      this.clientesFiltrados = [...this.clientes];
      this.loading = false;
    });
  }

  cargarPacientes(clienteId: string) {
    this.loading = true;
    this.pacientesService.getPacientes().subscribe(pacientes => {
      this.pacientes = pacientes.filter(p => p.cliente_id === clienteId);
      this.loading = false;
    });
  }

  aplicarFiltroCliente(event: Event) {
    const filtro = (event.target as HTMLInputElement).value.toLowerCase();
    this.filtroCliente = filtro;
    
    if (!filtro) {
      this.clientesFiltrados = [...this.clientes];
    } else {
      this.clientesFiltrados = this.clientes.filter(cliente => {
        const nombreCompleto = this.getNombreCompletoCliente(cliente).toLowerCase();
        const telefono = (cliente.telefono || '').toLowerCase();
        const email = (cliente.email || '').toLowerCase();
        
        return nombreCompleto.includes(filtro) || 
               telefono.includes(filtro) || 
               email.includes(filtro);
      });
    }
  }

  seleccionarCliente(cliente: any) {
    this.clienteSeleccionado = cliente;
    this.cargarPacientes(cliente.id);
    this.pasoActual = 2;
  }

  seleccionarPaciente(paciente: any) {
    this.pacienteSeleccionado = paciente;
    this.continuar();
  }

  continuar() {
    if (this.clienteSeleccionado && this.pacienteSeleccionado) {
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
    return `${cliente.nombre} ${cliente.apellido || ''}`.trim();
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
} 