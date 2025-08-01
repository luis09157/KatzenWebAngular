import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientesService } from '../clientes/clientes.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { UsuariosService } from '../usuarios/usuarios.service';
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
  doctores: any[] = [];
  motivos: string[] = [
    'Consulta General',
    'Vacunación',
    'Desparasitación',
    'Esterilización/Castración',
    'Cirugía',
    'Emergencia',
    'Control Post-operatorio',
    'Revisión de Heridas',
    'Tratamiento Dental',
    'Análisis de Sangre',
    'Radiografía',
    'Ecografía',
    'Dermatología',
    'Oftalmología',
    'Cardiología',
    'Neurología',
    'Oncología',
    'Fisioterapia',
    'Rehabilitación',
    'Control de Peso',
    'Nutrición',
    'Comportamiento',
    'Grooming (Peluquería)',
    'Otro'
  ];
  filteredClientes!: Observable<any[]>;
  clienteSeleccionado: any = null;
  pacientesDelCliente: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<CitaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private clientesService: ClientesService,
    private pacientesService: PacientesService,
    private usuariosService: UsuariosService
  ) {
    this.modoVer = data.modoVer;
    
    // Separar fecha_hora en fecha y hora si existe
    let fecha = '';
    let hora = '';
    if (data.cita?.fecha_hora) {
      const fechaHora = new Date(data.cita.fecha_hora);
      fecha = fechaHora.toISOString().split('T')[0]; // YYYY-MM-DD
      hora = fechaHora.toTimeString().slice(0, 5); // HH:MM
    }
    
    this.citaForm = this.fb.group({
      id: [data.cita?.id || ''],
      cliente_id: [data.cita?.cliente_id || '', Validators.required],
      paciente_id: [data.cita?.paciente_id || '', Validators.required],
      fecha: [fecha, [Validators.required, this.validarFecha.bind(this)]],
      hora: [hora, [Validators.required, this.validarHora.bind(this)]],
      motivo: [data.cita?.motivo || '', Validators.required],
      estado: [data.cita?.estado || 'pendiente', Validators.required],
      veterinario: [data.cita?.veterinario || ''],
      observaciones: [data.cita?.observaciones || ''],
      nombreCliente: [data.cita?.nombreCliente || '', Validators.required]
    });
    if (this.modoVer) {
      this.citaForm.disable();
    }
  }

  ngOnInit() {
    this.cargarClientes();
    this.cargarPacientes();
    this.cargarDoctores();
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

  cargarDoctores() {
    this.usuariosService.getUsuarios().subscribe(usuarios => {
      // Filtrar solo usuarios con perfil doctor o doctor_a
      this.doctores = (usuarios || []).filter(usuario => 
        usuario.perfil === 'doctor' || usuario.perfil === 'doctor_a'
      );
    });
  }

  setupAutocomplete() {
    this.filteredClientes = this.citaForm.get('nombreCliente')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterClientes(value))
    );
  }

  private _filterClientes(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.clientes.filter(cliente => 
      this.getNombreCompleto(cliente).toLowerCase().includes(filterValue)
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
    this.clienteSeleccionado = cliente;
    this.citaForm.patchValue({
      cliente_id: cliente.id,
      nombreCliente: this.getNombreCompleto(cliente),
      paciente_id: '' // Limpiar paciente seleccionado
    });
    
    // Filtrar pacientes del cliente seleccionado
    this.pacientesDelCliente = this.pacientes.filter(paciente => 
      paciente.cliente_id === cliente.id || paciente.idCliente === cliente.id
    );
  }

  async guardar() {
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
      
      // Combinar fecha y hora en el formato correcto
      if (formValue.fecha && formValue.hora) {
        const fecha = new Date(formValue.fecha);
        const [horas, minutos] = formValue.hora.split(':');
        fecha.setHours(parseInt(horas), parseInt(minutos));
        formValue.fecha_hora = fecha.toISOString().slice(0, 16); // Formato YYYY-MM-DDTHH:MM
      }
      
      // Limpiar campos temporales que no deben guardarse
      delete formValue.nombreCliente;
      
      this.dialogRef.close(formValue);
    }
  }

  cerrar() {
    this.dialogRef.close();
  }

  // Validadores personalizados
  validarFecha(control: any): {[key: string]: any} | null {
    if (!control.value) {
      return { 'required': true };
    }
    
    const fecha = new Date(control.value);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fecha < hoy) {
      return { 'fechaPasada': true };
    }
    
    return null;
  }

  validarHora(control: any): {[key: string]: any} | null {
    if (!control.value) {
      return { 'required': true };
    }
    
    const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!horaRegex.test(control.value)) {
      return { 'formatoInvalido': true };
    }
    
    return null;
  }

  // Método para verificar si el formulario es válido
  esFormularioValido(): boolean {
    return this.citaForm.valid && 
           this.citaForm.get('cliente_id')?.value && 
           this.citaForm.get('paciente_id')?.value &&
           this.citaForm.get('fecha')?.value &&
           this.citaForm.get('hora')?.value &&
           this.citaForm.get('motivo')?.value;
  }
} 