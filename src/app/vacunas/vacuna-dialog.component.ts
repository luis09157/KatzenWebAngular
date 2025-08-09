import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VacunasService } from './vacunas.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { RecordatoriosService } from '../recordatorios/recordatorios.service';
import { PacientesService } from '../pacientes/pacientes.service';
import Swal from 'sweetalert2';

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

  // Tipos de vacunas predefinidos
  tiposVacunas = [
    { value: 'quintuple', label: 'Quíntuple' },
    { value: 'sextuple', label: 'Séxtuple' },
    { value: 'antirrabica', label: 'Antirrábica' },
    { value: 'coronavirus', label: 'Coronavirus' },
    { value: 'triple_felina', label: 'Triple Felina' },
    { value: 'leucemia', label: 'Leucemia' },
    { value: 'parvovirus', label: 'Parvovirus' },
    { value: 'moquillo', label: 'Moquillo' },
    { value: 'hepatitis', label: 'Hepatitis' },
    { value: 'otra', label: 'Otra' }
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
    @Inject(MAT_DIALOG_DATA) public data: any
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

  ngOnInit() {
    console.log('VacunaDialogComponent - Datos recibidos:', this.data);
    console.log('VacunaDialogComponent - Tipos de vacunas:', this.tiposVacunas);
    
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
    if (this.vacunaForm.valid) {
      this.loading = true;
      
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
          const ref = await this.vacunasService.crearVacuna(vacunaData);
          const vacunaId = ref ? (typeof ref === 'string' ? ref : ref.key) : this.generateId();
          vacunaData.id = vacunaId;
          
          // Crear recordatorio automático si está marcado
          if (vacunaData.recordatorio && vacunaData.fechaRecordatorio && vacunaData.idPaciente) {
            await this.crearRecordatorioAutomatico(vacunaData);
          }
          
          // Registrar en el log de actividades
          if (vacunaData.idPaciente) {
            await this.registrarVacunaEnLog(vacunaData, 'creada');
          }
          
          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Vacuna creada correctamente'
          });
        }
        
        // Cerrar con los datos del formulario en lugar de true
        this.dialogRef.close(vacunaData);
      } catch (error) {
        console.error('Error al guardar vacuna:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar la vacuna'
        });
      } finally {
        this.loading = false;
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor completa los campos obligatorios'
      });
    }
  }

  cancelar() {
    this.dialogRef.close(false);
  }

  async eliminarVacuna() {
    if (!this.data?.id) return;

    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Estás seguro?',
      text: 'Esta acción marcará la vacuna como eliminada (baja lógica)',
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
        
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'Vacuna eliminada correctamente'
        });
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error al eliminar vacuna:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar la vacuna'
        });
      } finally {
        this.loading = false;
      }
    }
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
      
      Swal.fire({
        icon: 'success',
        title: '¡Estado actualizado!',
        text: `Vacuna marcada como ${estado}`
      });
      
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cambiar el estado de la vacuna'
      });
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
  
  // Método para obtener el nombre completo del cliente
  getNombreCompletoCliente(cliente: any): string {
    if (!cliente) return '';
    const nombre = cliente.nombre || '';
    const apellido = cliente.apellido || '';
    return `${nombre} ${apellido}`.trim();
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
      const tipoVacuna = this.tiposVacunas.find(t => t.value === vacunaData.vacuna);
      const nombreVacuna = tipoVacuna ? tipoVacuna.label : vacunaData.vacuna;
      
      const datosLog = {
        nombre_vacuna: nombreVacuna,
        dosis: vacunaData.dosis,
        fecha_aplicacion: vacunaData.fechaAplicacion,
        veterinario: vacunaData.veterinario,
        lote: vacunaData.lote,
        estado: vacunaData.aplicada ? 'aplicada' : 'pendiente',
        observaciones: vacunaData.observaciones
      };

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