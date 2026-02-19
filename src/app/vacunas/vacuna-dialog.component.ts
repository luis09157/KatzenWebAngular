import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VacunasService } from './vacunas.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { RecordatoriosService } from '../recordatorios/recordatorios.service';
import { PacientesService } from '../pacientes/pacientes.service';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService } from '../core/loading.service';

@Component({
  selector: 'app-vacuna-dialog',
  templateUrl: './vacuna-dialog.component.html',
  styleUrls: ['./vacuna-dialog.component.css']
})
export class VacunaDialogComponent implements OnInit {
  vacunaForm: FormGroup;
  isEditMode = false;
  loading = false;
  doctores: any[] = [];
  pacienteInfo: any = null;
  private operationId: string = '';

  // Tipos de vacunas - Cargados desde Firebase con fallback
  tiposVacunas: any[] = [];
  
  // Tipos de vacunas predefinidos (fallback si Firebase falla)
  private tiposVacunasFallback = [
    { value: 'puppy', label: 'Puppy', activo: true },
    { value: 'quintuple', label: 'Quíntuple', activo: true },
    { value: 'sextuple', label: 'Séxtuple', activo: true },
    { value: 'triple_felina', label: 'Triple Felina', activo: true },
    { value: 'antirrabica', label: 'Antirrábica', activo: true },
    { value: 'bordetella', label: 'Bordetella', activo: true },
    { value: 'leucemia_felina', label: 'Leucemia Felina', activo: true },
    { value: 'giardia', label: 'Giardia', activo: true },
    { value: 'otra', label: 'Otra', activo: true }
  ];

  // Dosis más comunes utilizadas por veterinarios
  dosisComunes = [
    { value: '0.5ml', label: '0.5ml' },
    { value: '1ml', label: '1ml' },
    { value: '1.5ml', label: '1.5ml' },
    { value: '2ml', label: '2ml' },
    { value: '2.5ml', label: '2.5ml' },
    { value: '3ml', label: '3ml' },
    { value: '5ml', label: '5ml' },
    { value: '10ml', label: '10ml' },
    { value: '0.25ml', label: '0.25ml' },
    { value: '0.75ml', label: '0.75ml' }
  ];

  // Estados de la vacuna
  estados = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'aplicada', label: 'Aplicada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  constructor(
    private fb: FormBuilder,
    private vacunasService: VacunasService,
    private usuariosService: UsuariosService,
    private recordatoriosService: RecordatoriosService,
    private pacientesService: PacientesService,
    private dialogRef: MatDialogRef<VacunaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService
  ) {
    this.vacunaForm = this.fb.group({
      // Información básica
      vacuna: ['', Validators.required],
      idVacuna: [''],
      dosis: ['', Validators.required],
      dosisPersonalizada: [''],
      lote: [''],
      
      // Fechas
      fechaAplicacion: ['', Validators.required],
      fechaRecordatorio: [''],
      proximaAplicacion: [''],
      intervalo: [0],
      
      // Estado y recordatorio
      aplicada: [false],
      recordatorio: [false],
      
      // Personal médico
      veterinario: [''],
      
      // Observaciones médicas
      reaccion: [''],
      observaciones: [''],
      
      // IDs de relación
      idPaciente: [''],
      idCliente: [''],
      
      // Metadatos
      fechaRegistro: [''],
      fechaActualizacion: [''],
      stability: [0]
    });

    // Observar cambios en el campo dosis para validar dosis personalizada
    this.vacunaForm.get('dosis')?.valueChanges.subscribe(value => {
      const dosisPersonalizadaControl = this.vacunaForm.get('dosisPersonalizada');
      if (value === 'personalizada') {
        dosisPersonalizadaControl?.setValidators([Validators.required]);
      } else {
        dosisPersonalizadaControl?.clearValidators();
        dosisPersonalizadaControl?.setValue('');
      }
      dosisPersonalizadaControl?.updateValueAndValidity();
    });
  }

  cargarInformacionPaciente(pacienteId: string) {
    this.pacientesService.getPaciente(pacienteId).subscribe(paciente => {
      this.pacienteInfo = paciente;
    });
  }

  getNombreCompletoCliente(cliente: any): string {
    const nombre = cliente.nombre || '';
    const apellidoPaterno = cliente.apellidoPaterno || '';
    const apellidoMaterno = cliente.apellidoMaterno || '';
    
    return `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim();
  }

  ngOnInit() {
    console.log('VacunaDialogComponent - Datos recibidos:', this.data);
    
    // Cargar tipos de vacunas desde Firebase
    this.cargarTiposVacunas();
    
    // Cargar doctores
    this.cargarDoctores();
    
    // Establecer IDs si vienen en los datos
    if (this.data?.paciente_id || this.data?.idPaciente) {
      this.vacunaForm.patchValue({
        idPaciente: this.data.paciente_id || this.data.idPaciente
      });
    }
    
    if (this.data?.cliente_id || this.data?.idCliente) {
      this.vacunaForm.patchValue({
        idCliente: this.data.cliente_id || this.data.idCliente
      });
    }

    // Cargar información del paciente si no viene completa en data
    if ((this.data?.paciente_id || this.data?.idPaciente) && !this.data?.paciente) {
      this.cargarInformacionPaciente(this.data.paciente_id || this.data.idPaciente);
    }

    if (this.data && this.data.id) {
      this.isEditMode = true;
      this.vacunaForm.patchValue({
        vacuna: this.data.vacuna || '',
        idVacuna: this.data.idVacuna || '',
        dosis: this.data.dosis || '',
        lote: this.data.lote || '',
        fechaAplicacion: this.data.fechaAplicacion || this.data.fecha || '',
        fechaRecordatorio: this.data.fechaRecordatorio || '',
        proximaAplicacion: this.data.proximaAplicacion || '',
        intervalo: this.data.intervalo || 0,
        observaciones: this.data.observaciones || '',
        reaccion: this.data.reaccion || '',
        recordatorio: this.data.recordatorio || false,
        aplicada: this.data.aplicada || false,
        veterinario: this.data.veterinario || '',
        idPaciente: this.data.idPaciente || this.data.paciente_id || '',
        idCliente: this.data.idCliente || this.data.cliente_id || '',
        fechaRegistro: this.data.fechaRegistro || '',
        fechaActualizacion: this.data.fechaActualizacion || '',
        stability: this.data.stability || 0
      });
    }
  }

  async guardarVacuna() {
    // Prevenir múltiples ejecuciones
    if (this.loading) {
      console.log('VacunaDialogComponent - Operación ya en progreso, ignorando llamada');
      return;
    }
    
    // Generar ID único para esta operación
    this.operationId = 'op_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    console.log('VacunaDialogComponent - ID de operación:', this.operationId);
    
    // Validaciones personalizadas antes de guardar
    const errorValidacion = this.validarDatosFormulario();
    if (errorValidacion) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación Fallida',
        html: errorValidacion
      });
      return;
    }
    
    if (this.vacunaForm.valid) {
      this.loading = true;
      console.log('VacunaDialogComponent - Iniciando guardado de vacuna');
      
      try {
        const vacunaData = { ...this.vacunaForm.value };
        
        // Si se seleccionó dosis personalizada, usar ese valor como dosis
        if (vacunaData.dosis === 'personalizada' && vacunaData.dosisPersonalizada) {
          vacunaData.dosis = vacunaData.dosisPersonalizada;
        }
        
        // Limpiar el campo dosisPersonalizada antes de enviar
        delete vacunaData.dosisPersonalizada;
        
        // Convertir fechas a formato ISO string si son objetos Date
        if (vacunaData.fechaAplicacion instanceof Date) {
          vacunaData.fechaAplicacion = vacunaData.fechaAplicacion.toISOString();
        }
        if (vacunaData.fechaRecordatorio instanceof Date) {
          vacunaData.fechaRecordatorio = vacunaData.fechaRecordatorio.toISOString();
        }
        if (vacunaData.proximaAplicacion instanceof Date) {
          vacunaData.proximaAplicacion = vacunaData.proximaAplicacion.toISOString();
        }
        
        if (this.isEditMode && this.data.id) {
          // Actualizar vacuna existente
          console.log('VacunaDialogComponent - Actualizando vacuna existente');
          await this.vacunasService.actualizarVacuna(this.data.id, vacunaData);
          
          // Registrar en el log de actividades
          if (vacunaData.idPaciente) {
            await this.registrarVacunaEnLog(vacunaData, 'editada');
          }
          
          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Vacuna actualizada correctamente'
          });
        } else {
          // Crear nueva vacuna
          console.log('VacunaDialogComponent - Creando nueva vacuna - Operación ID:', this.operationId);
          const resultado = await this.vacunasService.crearVacuna(vacunaData);
          const vacunaId = resultado.key;
          vacunaData.id = vacunaId;
          
          console.log('VacunaDialogComponent - Vacuna creada con ID:', vacunaId, '- Operación ID:', this.operationId);
          
          // Crear recordatorio automático si está marcado
          if (vacunaData.recordatorio && vacunaData.fechaRecordatorio && vacunaData.idPaciente) {
            console.log('VacunaDialogComponent - Creando recordatorio automático - Operación ID:', this.operationId);
            await this.crearRecordatorioAutomatico(vacunaData);
          }
          
          // Registrar en el log de actividades
          if (vacunaData.idPaciente) {
            console.log('VacunaDialogComponent - Registrando en log - Operación ID:', this.operationId);
            await this.registrarVacunaEnLog(vacunaData, 'creada');
          }
          
          console.log('VacunaDialogComponent - Mostrando mensaje de éxito - Operación ID:', this.operationId);
          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Vacuna creada correctamente'
          });
        }
        
        console.log('VacunaDialogComponent - Operación completada exitosamente, cerrando diálogo');
        this.loadingService.show();
        this.dialogRef.close(vacunaData);
      } catch (error) {
        console.error('VacunaDialogComponent - Error al guardar vacuna:', error);
        this.loadingService.hide();
        setTimeout(() => Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.errorMessages.getUserMessage(error, 'guardar vacuna')
        }), 0);
      } finally {
        this.loading = false;
      }
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.vacunaForm.controls).forEach(key => {
        const control = this.vacunaForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      
      // Identificar campos faltantes
      const camposFaltantes: string[] = [];
      if (!this.vacunaForm.get('vacuna')?.value) camposFaltantes.push('Tipo de Vacuna');
      if (!this.vacunaForm.get('fechaAplicacion')?.value) camposFaltantes.push('Fecha de Aplicación');
      if (!this.vacunaForm.get('dosis')?.value) camposFaltantes.push('Dosis');
      
      Swal.fire({
        icon: 'warning',
        title: 'Campos Obligatorios Incompletos',
        html: `
          <p>Los siguientes campos son requeridos:</p>
          <ul style="text-align: left; margin: 10px 40px;">
            ${camposFaltantes.map(campo => `<li>${campo}</li>`).join('')}
          </ul>
        `
      });
    }
  }

  // Validar datos del formulario con reglas de negocio
  validarDatosFormulario(): string | null {
    const formValue = this.vacunaForm.value;
    
    // 1. Validar formato de dosis personalizada
    if (formValue.dosis === 'personalizada') {
      const dosisPersonalizada = formValue.dosisPersonalizada?.trim();
      if (!dosisPersonalizada) {
        return 'Debes especificar la <strong>dosis personalizada</strong>';
      }
      
      // Validar formato (número seguido de unidad)
      const formatoValido = /^\d+(\.\d+)?\s?(ml|mg|g|cc|UI|IU)$/i.test(dosisPersonalizada);
      if (!formatoValido) {
        return `
          <p>El formato de la dosis personalizada no es válido.</p>
          <p class="text-muted">Ejemplos válidos: <code>1ml</code>, <code>2.5 mg</code>, <code>500 UI</code></p>
        `;
      }
    }
    
    // 2. Validar que la fecha de próxima aplicación sea posterior a fecha de aplicación
    if (formValue.proximaAplicacion && formValue.fechaAplicacion) {
      const fechaAplicacion = new Date(formValue.fechaAplicacion);
      const proximaAplicacion = new Date(formValue.proximaAplicacion);
      
      if (proximaAplicacion <= fechaAplicacion) {
        return `
          <p>La <strong>Fecha de Próxima Dosis</strong> debe ser <strong>posterior</strong> a la Fecha de Aplicación.</p>
          <p class="text-muted">Por favor, ajusta las fechas.</p>
        `;
      }
    }
    
    // 3. Validar que la fecha de recordatorio sea futura si el recordatorio está activo
    if (formValue.recordatorio && formValue.fechaRecordatorio) {
      const fechaRecordatorio = new Date(formValue.fechaRecordatorio);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaRecordatorio < hoy) {
        return `
          <p>La <strong>Fecha de Recordatorio</strong> debe ser <strong>futura</strong>.</p>
          <p class="text-muted">No puedes crear recordatorios para fechas pasadas.</p>
        `;
      }
    }
    
    // 4. Validar fechas futuras solo para vacunas pendientes
    if (formValue.estado === 'pendiente' && formValue.fechaAplicacion) {
      const fechaAplicacion = new Date(formValue.fechaAplicacion);
      const hoy = new Date();
      const hace30Dias = new Date(hoy);
      hace30Dias.setDate(hoy.getDate() - 30);
      
      if (fechaAplicacion < hace30Dias) {
        return `
          <p>Estás intentando crear una vacuna <strong>pendiente</strong> con una fecha de más de 30 días en el pasado.</p>
          <p class="text-muted">¿Seguro que el estado debería ser "Pendiente" y no "Aplicada"?</p>
        `;
      }
    }
    
    return null; // Sin errores
  }

  cancelar() {
    this.dialogRef.close(false);
  }

  async eliminarVacuna() {
    if (!this.data?.id) return;

    // Obtener información de la vacuna para el mensaje
    const nombreVacuna = this.getNombreVacunaParaMostrar();
    const nombrePaciente = this.pacienteInfo?.nombre || 'este paciente';
    
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Estás seguro?',
      html: `
        <p>Estás a punto de <strong>eliminar</strong> la siguiente vacuna:</p>
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">
          <p><strong>Vacuna:</strong> ${nombreVacuna}</p>
          <p><strong>Paciente:</strong> ${nombrePaciente}</p>
        </div>
        <p class="text-danger">Esta acción <strong>no se puede deshacer</strong>.</p>
      `,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.loading = true;
      
      try {
        // Usar baja lógica en lugar de eliminación física
        await this.vacunasService.bajaLogicaVacuna(this.data.id);
        
        // Registrar en el log de actividades si hay paciente
        if (this.data.idPaciente) {
          await this.registrarEliminacionEnLog();
        }
        
        this.loadingService.show();
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error al eliminar vacuna:', error);
        this.loadingService.hide();
        setTimeout(() => Swal.fire({
          icon: 'error',
          title: 'Error al Eliminar',
          text: this.errorMessages.getUserMessage(error, 'eliminar vacuna')
        }), 0);
      } finally {
        this.loading = false;
      }
    }
  }

  // Obtener nombre de vacuna para mostrar
  private getNombreVacunaParaMostrar(): string {
    const vacunaValue = this.data?.vacuna || this.vacunaForm.get('vacuna')?.value;
    if (!vacunaValue) return 'Vacuna';
    
    // Buscar en tipos de vacunas
    const tipoVacuna = this.tiposVacunas.find(t => t.value === vacunaValue);
    if (tipoVacuna) return tipoVacuna.label;
    
    // Si no se encuentra, formatear el valor
    return vacunaValue
      .replace(/_/g, ' ')
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  async cambiarEstado(estado: string) {
    if (!this.data?.id) return;

    this.loading = true;
    
    try {
      if (estado === 'aplicada') {
        await this.vacunasService.marcarAplicada(this.data.id);
      } else {
        await this.vacunasService.marcarPendiente(this.data.id);
      }
      
      this.loadingService.show();
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      this.loadingService.hide();
      setTimeout(() => Swal.fire({
        icon: 'error',
        title: 'Error',
        text: this.errorMessages.getUserMessage(error, 'cambiar estado vacuna')
      }), 0);
    } finally {
      this.loading = false;
    }
  }

  // Calcular próxima fecha automáticamente
  calcularProximaFecha() {
    const fecha = this.vacunaForm.get('fechaAplicacion')?.value;
    const intervalo = this.vacunaForm.get('intervalo')?.value;
    
    if (fecha && intervalo) {
      const fechaActual = new Date(fecha);
      const proximaFecha = new Date(fechaActual.getTime() + (intervalo * 24 * 60 * 60 * 1000));
      this.vacunaForm.patchValue({
        proximaAplicacion: proximaFecha
      });
    }
  }
  
  // Cargar tipos de vacunas desde Firebase con fallback
  cargarTiposVacunas() {
    console.log('🔄 Cargando tipos de vacunas desde Firebase...');
    
    this.vacunasService.getTiposVacunas().subscribe({
      next: (tipos) => {
        console.log('📦 Tipos de vacunas obtenidos de Firebase:', tipos);
        
        if (tipos && tipos.length > 0) {
          // Filtrar solo los activos
          this.tiposVacunas = tipos.filter((tipo: any) => tipo.activo !== false);
          console.log('✅ Tipos de vacunas cargados desde Firebase:', this.tiposVacunas.length);
        } else {
          // Si no hay datos en Firebase, usar fallback
          console.log('⚠️ Firebase vacío, usando tipos predefinidos (fallback)');
          this.tiposVacunas = [...this.tiposVacunasFallback];
          this.inicializarTiposEnFirebase();
        }
      },
      error: (error) => {
        // Si hay error en Firebase, usar fallback
        console.error('❌ Error al cargar tipos de vacunas desde Firebase:', error);
        console.log('🔄 Usando tipos predefinidos (fallback)');
        this.tiposVacunas = [...this.tiposVacunasFallback];
      }
    });
  }

  // Inicializar tipos de vacunas en Firebase si no existen
  private async inicializarTiposEnFirebase() {
    try {
      console.log('🔄 Inicializando tipos de vacunas en Firebase...');
      
      // Aquí podrías agregar lógica para poblar Firebase con los datos iniciales
      // Por ahora solo registramos el intento
      console.log('ℹ️ Los tipos predefinidos están siendo usados como fallback');
      console.log('ℹ️ Para persistir en Firebase, el administrador debe configurarlos manualmente');
    } catch (error) {
      console.error('❌ Error al inicializar tipos en Firebase:', error);
    }
  }

  // Cargar lista de doctores
  cargarDoctores() {
    this.usuariosService.getUsuarios().subscribe({
      next: (usuarios: any) => {
        console.log('Usuarios obtenidos:', usuarios);
        
        if (usuarios) {
          // Convertir el objeto de usuarios a array y filtrar doctores
          const usuariosArray = Object.keys(usuarios).map(key => ({
            id: key,
            ...usuarios[key]
          }));
          
          // Filtrar solo los usuarios con perfil "doctor" o "doctor_a" y que estén activos
          this.doctores = usuariosArray.filter(usuario => 
            usuario && 
            usuario.activo && 
            (usuario.perfil === 'doctor' || usuario.perfil === 'doctor_a')
          ).map(doctor => ({
            id: doctor.id,
            nombre: doctor.nombre,
            correo: doctor.correo,
            telefono: doctor.telefono
          }));
          
          console.log('Doctores filtrados:', this.doctores);
        }
      },
      error: (error) => {
        console.error('Error al cargar doctores:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los veterinarios'
        });
      }
    });
  }

  // Crear recordatorio automático
  private async crearRecordatorioAutomatico(vacunaData: any): Promise<void> {
    try {
      const tipoVacuna = this.tiposVacunas.find(t => t.value === vacunaData.vacuna);
      const nombreVacuna = tipoVacuna ? tipoVacuna.label : vacunaData.vacuna;
      
      const recordatorioData = {
        titulo: `Recordatorio de Vacuna: ${nombreVacuna}`,
        descripcion: `Recordatorio para la próxima aplicación de la vacuna ${nombreVacuna} (${vacunaData.dosis})`,
        tipo: 'vacuna',
        fecha_hora_recordatorio: vacunaData.fechaRecordatorio,
        fecha_recordatorio: vacunaData.fechaRecordatorio,
        estado: 'pendiente',
        prioridad: 'alta',
        paciente_id: vacunaData.idPaciente,
        notas: `Vacuna relacionada: ${nombreVacuna} - Dosis: ${vacunaData.dosis}`,
        vacuna_relacionada_id: vacunaData.id
      };

      await this.recordatoriosService.crearRecordatorio(recordatorioData);
      console.log('Recordatorio automático creado exitosamente');
    } catch (error) {
      console.error('Error al crear recordatorio automático:', error);
      // No interrumpir el flujo principal si falla el recordatorio
    }
  }

  // Registrar vacuna en log de actividades
  private async registrarVacunaEnLog(vacunaData: any, accion: string): Promise<void> {
    try {
      // Validar que los datos necesarios estén presentes
      if (!vacunaData || !vacunaData.vacuna || !vacunaData.idPaciente) {
        console.warn('VacunaDialogComponent - Datos insuficientes para registrar en log:', vacunaData);
        return;
      }

      const tipoVacuna = this.tiposVacunas.find(t => t.value === vacunaData.vacuna);
      const nombreVacuna = tipoVacuna ? tipoVacuna.label : vacunaData.vacuna || 'Vacuna sin nombre';
      
      // Asegurar que fecha_aplicacion tenga un valor válido
      let fechaAplicacion = vacunaData.fechaAplicacion;
      if (!fechaAplicacion) {
        fechaAplicacion = new Date().toISOString();
        console.warn('VacunaDialogComponent - fechaAplicacion undefined, usando fecha actual:', fechaAplicacion);
      }
      
      const datosLog = {
        nombre_vacuna: nombreVacuna,
        dosis: vacunaData.dosis || 'Sin dosis',
        fecha_aplicacion: fechaAplicacion,
        veterinario: vacunaData.veterinario || 'Sin veterinario',
        lote: vacunaData.lote || 'Sin lote',
        estado: vacunaData.aplicada ? 'aplicada' : 'pendiente',
        observaciones: vacunaData.observaciones || 'Sin observaciones'
      };

      console.log('VacunaDialogComponent - Registrando en log:', datosLog);
      await this.pacientesService.registrarVacuna(vacunaData.idPaciente, datosLog);
      console.log(`Vacuna ${accion} registrada en log exitosamente`);
    } catch (error) {
      console.error('Error al registrar vacuna en log:', error);
      // No interrumpir el flujo principal si falla el log
    }
  }

  // Registrar eliminación en log de actividades
  private async registrarEliminacionEnLog(): Promise<void> {
    try {
      const tipoVacuna = this.tiposVacunas.find(t => t.value === this.data.vacuna);
      const nombreVacuna = tipoVacuna ? tipoVacuna.label : this.data.vacuna;
      
      const actividad = {
        tipo: 'vacuna_eliminada',
        titulo: 'Vacuna Eliminada',
        descripcion: `${nombreVacuna} - ${this.data.dosis}`,
        icono: 'delete',
        color: '#f44336',
        datos: {
          nombre_vacuna: nombreVacuna,
          dosis: this.data.dosis,
          fecha_eliminacion: new Date().toISOString(),
          motivo: 'Eliminación por usuario'
        }
      };

      await this.pacientesService.agregarLogActividad(this.data.idPaciente, actividad);
      console.log('Eliminación de vacuna registrada en log exitosamente');
    } catch (error) {
      console.error('Error al registrar eliminación en log:', error);
    }
  }

  // Generar ID único (método auxiliar)
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
} 