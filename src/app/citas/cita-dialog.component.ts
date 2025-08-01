import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientesService } from '../clientes/clientes.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-cita-dialog',
  templateUrl: './cita-dialog.component.html',
  styleUrls: ['./cita-dialog.component.css']
})
export class CitaDialogComponent implements OnInit {
  citaForm: FormGroup;
  modoVer: boolean = false;
  clientes: any[] = [];
  pacientes: any[] = [];
  filteredClientes!: Observable<any[]>;
  filteredPacientes!: Observable<any[]>;

  constructor(
    public dialogRef: MatDialogRef<CitaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private clientesService: ClientesService,
    private pacientesService: PacientesService
  ) {
    this.modoVer = data.modoVer;
    this.citaForm = this.fb.group({
      id: [data.cita?.id || ''],
      cliente_id: [data.cita?.cliente_id || '', Validators.required],
      paciente_id: [data.cita?.paciente_id || '', Validators.required],
      fecha_hora: [data.cita?.fecha_hora || '', Validators.required],
      motivo: [data.cita?.motivo || '', Validators.required],
      estado: [data.cita?.estado || 'pendiente', Validators.required],
      veterinario: [data.cita?.veterinario || ''],
      observaciones: [data.cita?.observaciones || ''],
      nombreCliente: [data.cita?.nombreCliente || '', Validators.required],
      nombrePaciente: [data.cita?.nombrePaciente || '', Validators.required]
    });
    if (this.modoVer) {
      this.citaForm.disable();
    }
  }

  ngOnInit() {
    this.cargarClientes();
    this.cargarPacientes();
    this.setupAutocomplete();
  }

  cargarClientes() {
    this.clientesService.getClientes().subscribe(clientes => {
      this.clientes = clientes || [];
    });
  }

  cargarPacientes() {
    this.pacientesService.getPacientes().subscribe(pacientes => {
      this.pacientes = pacientes || [];
    });
  }

  setupAutocomplete() {
    this.filteredClientes = this.citaForm.get('nombreCliente')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterClientes(value))
    );
    
    this.filteredPacientes = this.citaForm.get('nombrePaciente')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPacientes(value))
    );
  }

  private _filterClientes(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.clientes.filter(cliente => 
      this.getNombreCompleto(cliente).toLowerCase().includes(filterValue)
    );
  }

  private _filterPacientes(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.pacientes.filter(paciente => 
      paciente.nombre?.toLowerCase().includes(filterValue) ||
      paciente.especie?.toLowerCase().includes(filterValue)
    );
  }

  getNombreCompleto(cliente: any): string {
    const nombre = cliente.nombre || '';
    const apellidoPaterno = cliente.apellidoPaterno || '';
    const apellidoMaterno = cliente.apellidoMaterno || '';
    const telefono = cliente.telefono || '';
    
    const nombreCompleto = [nombre, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ');
    return telefono ? `${nombreCompleto} - ${telefono}` : nombreCompleto;
  }

  onClienteSelected(cliente: any) {
    this.citaForm.patchValue({
      cliente_id: cliente.id,
      nombreCliente: this.getNombreCompleto(cliente)
    });
  }

  onPacienteSelected(paciente: any) {
    this.citaForm.patchValue({
      paciente_id: paciente.id,
      nombrePaciente: `${paciente.nombre} - ${paciente.especie || 'Sin especie'}`
    });
  }

  guardar() {
    if (this.citaForm.valid) {
      // Asegurar que el cliente_id esté presente
      const formValue = this.citaForm.value;
      if (!formValue.cliente_id) {
        // Si no hay cliente_id pero hay nombreCliente, buscar el cliente
        const clienteSeleccionado = this.clientes.find(c => 
          this.getNombreCompleto(c) === formValue.nombreCliente
        );
        if (clienteSeleccionado) {
          formValue.cliente_id = clienteSeleccionado.id;
        }
      }
      
      // Asegurar que el paciente_id esté presente
      if (!formValue.paciente_id) {
        // Si no hay paciente_id pero hay nombrePaciente, buscar el paciente
        const pacienteSeleccionado = this.pacientes.find(p => 
          `${p.nombre} - ${p.especie || 'Sin especie'}` === formValue.nombrePaciente
        );
        if (pacienteSeleccionado) {
          formValue.paciente_id = pacienteSeleccionado.id;
        }
      }
      
      this.dialogRef.close(formValue);
    }
  }

  cerrar() {
    this.dialogRef.close();
  }
} 