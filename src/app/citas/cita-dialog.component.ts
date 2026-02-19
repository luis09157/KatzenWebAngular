import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ClientesService } from '../clientes/clientes.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { LoadingService } from '../core/loading.service';

@Component({
  selector: 'app-cita-dialog',
  templateUrl: './cita-dialog.component.html',
  styleUrls: ['./cita-dialog.component.css'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'DD/MM/YYYY',
        },
        display: {
          dateInput: 'DD/MM/YYYY',
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
  ]
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
    private usuariosService: UsuariosService,
    private dateAdapter: DateAdapter<any>,
    private loadingService: LoadingService
  ) {
    this.modoVer = data.modoVer;
    
    // Separar fecha_hora en fecha y hora si existe
    let fecha = '';
    let hora = '';
    
    console.log('🔍 Datos de cita recibidos:', data.cita);
    console.log('🔍 Campos específicos:', {
      fecha: data.cita?.fecha,
      fecha_hora: data.cita?.fecha_hora,
      hora: data.cita?.hora,
      tipo_fecha: typeof data.cita?.fecha,
      tipo_fecha_hora: typeof data.cita?.fecha_hora
    });
    
    // Método para procesar fecha correctamente
    const procesarFecha = (fechaString: string) => {
      try {
        // Si es un string con formato ISO, extraer la fecha sin conversión de zona horaria
        if (fechaString.includes('T')) {
          // Extraer fecha directamente del string ISO sin crear objeto Date
          const fechaPart = fechaString.split('T')[0]; // "2025-08-15"
          const horaPart = fechaString.split('T')[1]; // "00:00:00.000Z"
          
          // Extraer hora de la parte de tiempo
          const hora = horaPart.split(':')[0] + ':' + horaPart.split(':')[1]; // "00:00"
          
          return {
            fecha: fechaPart, // "2025-08-15"
            hora: hora // "00:00"
          };
        } else {
          // Si no tiene T, asumir que es solo fecha
          return {
            fecha: fechaString,
            hora: '00:00'
          };
        }
      } catch (error) {
        console.error('Error procesando fecha:', error);
        return { fecha: '', hora: '' };
      }
    };
    
    // Usar el campo 'fecha' que es la fecha real de la cita
    if (data.cita?.fecha) {
      const resultado = procesarFecha(data.cita.fecha);
      fecha = resultado.fecha;
      // Usar la hora del campo 'hora' si está disponible, sino usar la del resultado
      hora = data.cita.hora || resultado.hora;
      console.log('📅 Constructor: Usando campo fecha:', fecha, hora);
    } else if (data.cita?.fecha_hora) {
      const resultado = procesarFecha(data.cita.fecha_hora);
      fecha = resultado.fecha;
      hora = resultado.hora;
      console.log('📅 Constructor: Usando campo fecha_hora:', fecha, hora);
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
    // Configurar el datepicker para español
    this.dateAdapter.setLocale('es-ES');
    
    this.cargarClientes();
    this.cargarPacientes();
    this.cargarDoctores();
    this.setupAutocomplete();
    
    // Si hay datos de cita, establecer valores (tanto para editar como para ver)
    if (this.data.cita) {
      this.establecerValoresEdicion();
    }
  }

  cargarClientes() {
    this.clientesService.getClientes().subscribe(clientes => {
      this.clientes = clientes || [];
      console.log('👥 Clientes cargados:', this.clientes.length);
      // Si hay datos de cita y pacientes cargados, establecer valores
      if (this.data.cita && this.pacientes.length > 0) {
        console.log('🔄 Intentando establecer valores después de cargar clientes');
        this.establecerValoresEdicion();
      }
    });
  }

  cargarPacientes() {
    this.pacientesService.getPacientes().subscribe(pacientes => {
      this.pacientes = pacientes || [];
      console.log('🐾 Pacientes cargados:', this.pacientes.length);
      // Si hay datos de cita y clientes cargados, establecer valores
      if (this.data.cita && this.clientes.length > 0) {
        console.log('🔄 Intentando establecer valores después de cargar pacientes');
        this.establecerValoresEdicion();
      }
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

  private _filterClientes(value: any): any[] {
    // Verificar que value sea un string
    if (!value || typeof value !== 'string') {
      return this.clientes;
    }
    
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
        
        // Guardar tanto la fecha real como fecha_hora para compatibilidad
        formValue.fecha = fecha.toISOString(); // Fecha real de la cita
        formValue.fecha_hora = fecha.toISOString().slice(0, 16); // Formato YYYY-MM-DDTHH:MM para compatibilidad
      }
      
      // Limpiar campos temporales que no deben guardarse
      delete formValue.nombreCliente;
      this.loadingService.show();
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

  // Método para establecer valores cuando se edita o ve una cita
  establecerValoresEdicion() {
    const cita = this.data.cita;
    if (!cita) return;

    console.log('🔧 Estableciendo valores para cita:', cita, 'Modo ver:', this.modoVer);

    // Buscar el cliente en la lista de clientes
    const cliente = this.clientes.find(c => c.id === cita.cliente_id);
    if (cliente) {
      this.clienteSeleccionado = cliente;
      this.citaForm.patchValue({
        cliente_id: cita.cliente_id,
        nombreCliente: this.getNombreCompleto(cliente)
      });
      
      // Filtrar pacientes del cliente seleccionado
      this.pacientesDelCliente = this.pacientes.filter(paciente => 
        paciente.cliente_id === cliente.id || paciente.idCliente === cliente.id
      );
      console.log('👤 Cliente establecido:', cliente.nombre);
    }

    // Buscar el paciente en la lista de pacientes
    const paciente = this.pacientes.find(p => p.id === cita.paciente_id);
    if (paciente) {
      this.citaForm.patchValue({
        paciente_id: cita.paciente_id
      });
      console.log('🐾 Paciente establecido:', paciente.nombre);
    }

    // Establecer otros valores
    const valoresAEstablecer = {
      motivo: cita.motivo || '',
      estado: cita.estado || 'pendiente',
      veterinario: cita.veterinario || '',
      observaciones: cita.observaciones || ''
    };
    
    console.log('📝 Valores a establecer:', valoresAEstablecer);
    this.citaForm.patchValue(valoresAEstablecer);
    
    // Verificar que los valores se establecieron correctamente
    setTimeout(() => {
      const estadoActual = this.citaForm.get('estado')?.value;
      const fechaActual = this.citaForm.get('fecha')?.value;
      const horaActual = this.citaForm.get('hora')?.value;
      const clienteActual = this.citaForm.get('nombreCliente')?.value;
      const pacienteActual = this.citaForm.get('paciente_id')?.value;
      console.log('✅ Valores actuales del formulario:', {
        estado: estadoActual,
        fecha: fechaActual,
        hora: horaActual,
        cliente: clienteActual,
        paciente: pacienteActual
      });
    }, 100);
  }
} 