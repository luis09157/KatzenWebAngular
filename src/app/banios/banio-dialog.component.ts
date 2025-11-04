import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BaniosService } from './banios.service';
import { BaniosPacienteService } from '../pacientes/banios-paciente.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Banio } from '../shared/banio.model';
import Swal from 'sweetalert2/dist/sweetalert2.js';

@Component({
  selector: 'app-banio-dialog',
  templateUrl: './banio-dialog.component.html',
  styleUrls: ['./banio-dialog.component.css']
})
export class BanioDialogComponent implements OnInit {
  banioForm: FormGroup;
  usuarios: any[] = [];
  loading = false;
  esEdicion = false;
  hidePatientInfo = false; // Flag para ocultar campos de paciente/cliente
  
  // Opciones para los selects
  tiposServicios = [
    { value: 'baño_básico', label: 'Baño Básico', icon: 'shower' },
    { value: 'baño_completo', label: 'Baño Completo', icon: 'spa' },
    { value: 'corte_pelo', label: 'Corte de Pelo', icon: 'content_cut' },
    { value: 'corte_uñas', label: 'Corte de Uñas', icon: 'scissors' },
    { value: 'deslanado', label: 'Deslanado', icon: 'brush' },
    { value: 'tratamiento_especial', label: 'Tratamiento Especial', icon: 'healing' }
  ];

  estados = [
    { value: 'programado', label: 'Programado', color: '#2196f3' },
    { value: 'en_proceso', label: 'En Proceso', color: '#ff9800' },
    { value: 'completado', label: 'Completado', color: '#4caf50' },
    { value: 'cancelado', label: 'Cancelado', color: '#f44336' }
  ];

  prioridades = [
    { value: 'baja', label: 'Baja', color: '#4caf50' },
    { value: 'media', label: 'Media', color: '#ff9800' },
    { value: 'alta', label: 'Alta', color: '#f44336' },
    { value: 'urgente', label: 'Urgente', color: '#9c27b0' }
  ];

  comportamientos = [
    { value: 'tranquilo', label: 'Tranquilo' },
    { value: 'nervioso', label: 'Nervioso' },
    { value: 'agresivo', label: 'Agresivo' },
    { value: 'cooperativo', label: 'Cooperativo' }
  ];

  // Opciones predefinidas para servicios adicionales
  serviciosAdicionales = [
    { value: 'corte_uñas', label: 'Corte de Uñas', precio: 50 },
    { value: 'limpieza_oidos', label: 'Limpieza de Oídos', precio: 80 },
    { value: 'cepillado_especial', label: 'Cepillado Especial', precio: 60 },
    { value: 'perfume', label: 'Perfume', precio: 40 },
    { value: 'lazo_decorativo', label: 'Lazo Decorativo', precio: 30 },
    { value: 'tratamiento_antipulgas', label: 'Tratamiento Antipulgas', precio: 120 },
    { value: 'mascarilla_hidratante', label: 'Mascarilla Hidratante', precio: 90 }
  ];

  // Opciones predefinidas para alergias
  tiposAlergias = [
    { value: 'shampoo_comun', label: 'Shampoo Común' },
    { value: 'perfume', label: 'Perfume' },
    { value: 'productos_quimicos', label: 'Productos Químicos' },
    { value: 'alergenos_ambientales', label: 'Alergenos Ambientales' },
    { value: 'alimentos', label: 'Alimentos' },
    { value: 'medicamentos', label: 'Medicamentos' }
  ];

  // Array para almacenar alergias específicas
  alergiasEspecificas: string[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BanioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private baniosService: BaniosService,
    private baniosPacienteService: BaniosPacienteService,
    private usuariosService: UsuariosService
  ) {
    this.banioForm = this.fb.group({
      paciente_id: ['', Validators.required],
      paciente: [''],
      cliente_id: ['', Validators.required],
      cliente: [''],
      fecha_banio: ['', Validators.required],
      hora_banio: ['', Validators.required],
      tipo_servicio: ['', Validators.required],
      estado: ['programado', Validators.required],
      prioridad: ['media', Validators.required],
      observaciones: [''],
      alergias_conocidas: [[]],
      comportamiento: ['tranquilo'],
      peluquero_id: ['', Validators.required],
      precio_base: [0, [Validators.required, Validators.min(0)]],
      servicios_adicionales: [[]],
      precio_total: [0, [Validators.required, Validators.min(0)]],
      pagado: [false],
      metodo_pago: [''],
      duracion_estimada: [60, [Validators.required, Validators.min(15)]],
      tiempo_inicio: [''],
      tiempo_fin: [''],
      activo: [true],
      created_by: ['system', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
    
    // Verificar si se debe ocultar la información del paciente/cliente
    this.hidePatientInfo = this.data?.hidePatientInfo || false;
    
    if (this.data && this.data.id) {
      this.esEdicion = true;
      this.cargarDatosBanio();
      // En edición, estos campos son de solo lectura; no deben bloquear el guardado
      this.banioForm.get('paciente')?.clearValidators();
      this.banioForm.get('cliente')?.clearValidators();
      this.banioForm.get('paciente')?.updateValueAndValidity({ emitEvent: false });
      this.banioForm.get('cliente')?.updateValueAndValidity({ emitEvent: false });
      
      // Si se oculta la información del paciente, también limpiar validaciones de IDs
      if (this.hidePatientInfo) {
        this.banioForm.get('paciente_id')?.clearValidators();
        this.banioForm.get('cliente_id')?.clearValidators();
        this.banioForm.get('paciente_id')?.updateValueAndValidity({ emitEvent: false });
        this.banioForm.get('cliente_id')?.updateValueAndValidity({ emitEvent: false });
      }
      
      // Mantener la fecha original de alta (solo lectura en edición)
      this.banioForm.get('fecha_banio')?.disable({ emitEvent: false });
    } else if (this.data) {
      // Datos del cliente y paciente seleccionados
      this.banioForm.patchValue({
        paciente_id: this.data.paciente_id,
        paciente: this.data.paciente,
        cliente_id: this.data.cliente_id,
        cliente: this.data.cliente,
        created_by: 'system' // Valor por defecto para nuevos baños
      });
      
      // Si se oculta la información del paciente, no validar estos campos
      if (this.hidePatientInfo) {
        this.banioForm.get('paciente')?.clearValidators();
        this.banioForm.get('cliente')?.clearValidators();
        this.banioForm.get('paciente_id')?.clearValidators();
        this.banioForm.get('cliente_id')?.clearValidators();
        this.banioForm.get('paciente')?.updateValueAndValidity({ emitEvent: false });
        this.banioForm.get('cliente')?.updateValueAndValidity({ emitEvent: false });
        this.banioForm.get('paciente_id')?.updateValueAndValidity({ emitEvent: false });
        this.banioForm.get('cliente_id')?.updateValueAndValidity({ emitEvent: false });
      } else {
        // En creación normal, mantener requerido para mostrar consistencia de datos
        this.banioForm.get('paciente')?.setValidators([Validators.required]);
        this.banioForm.get('cliente')?.setValidators([Validators.required]);
        this.banioForm.get('paciente')?.updateValueAndValidity({ emitEvent: false });
        this.banioForm.get('cliente')?.updateValueAndValidity({ emitEvent: false });
      }
    }
    
    this.configurarCalculoPrecio();

    // Debug: Log del estado del formulario
    console.log('🔍 Estado del formulario después de inicialización:', {
      valid: this.banioForm.valid,
      errors: this.banioForm.errors,
      hidePatientInfo: this.hidePatientInfo,
      esEdicion: this.esEdicion
    });

    // Log de errores de campos específicos
    Object.keys(this.banioForm.controls).forEach(key => {
      const control = this.banioForm.get(key);
      if (control && control.errors) {
        console.log(`🔍 Error en campo ${key}:`, control.errors);
      }
    });

    // Listener para cambios en el formulario
    this.banioForm.statusChanges.subscribe(status => {
      console.log('🔍 Estado del formulario cambió:', status);
      if (status === 'INVALID') {
        Object.keys(this.banioForm.controls).forEach(key => {
          const control = this.banioForm.get(key);
          if (control && control.errors) {
            console.log(`🔍 Error en campo ${key}:`, control.errors);
          }
        });
      }
    });

    // Reglas de negocio: si el estado no es 'completado', no se puede marcar pagado
    const estadoCtrl = this.banioForm.get('estado');
    const pagadoCtrl = this.banioForm.get('pagado');
    if (estadoCtrl && pagadoCtrl) {
      estadoCtrl.valueChanges.subscribe((estado) => {
        if (estado !== 'completado') {
          pagadoCtrl.patchValue(false, { emitEvent: false });
          pagadoCtrl.disable({ emitEvent: false });
        } else {
          pagadoCtrl.enable({ emitEvent: false });
        }
      });
      // Aplicar regla al iniciar
      const estadoInicial = estadoCtrl.value;
      if (estadoInicial !== 'completado') {
        pagadoCtrl.patchValue(false, { emitEvent: false });
        pagadoCtrl.disable({ emitEvent: false });
      }
    }
  }

  cargarUsuarios() {
    this.usuariosService.getUsuarios().subscribe(usuarios => {
      this.usuarios = (usuarios || []).filter(u => u.activo !== false);
      // Si falta peluquero_id, usar el primero disponible para no bloquear el guardado
      const peluqueroControl = this.banioForm.get('peluquero_id');
      if (peluqueroControl && !peluqueroControl.value && this.usuarios.length > 0) {
        peluqueroControl.patchValue(this.usuarios[0].id);
      }
    });
  }

  cargarDatosBanio() {
    if (this.data.id) {
      this.baniosService.getBanioById(this.data.id).subscribe(banio => {
        if (banio) {
          // Normalizar datos para cumplir validaciones requeridas
          const normalizado: any = { ...banio };
          if (!normalizado.created_by) normalizado.created_by = 'system';
          if (normalizado.precio_base === undefined || normalizado.precio_base === null) {
            normalizado.precio_base = 0;
          }
          if (normalizado.precio_total === undefined || normalizado.precio_total === null) {
            normalizado.precio_total = normalizado.precio_base || 0;
          }
          if (!normalizado.duracion_estimada) normalizado.duracion_estimada = 60;
          // Normalizar hora a formato HH:mm para input type="time"
          if (normalizado.hora_banio) {
            normalizado.hora_banio = this.normalizarHora(normalizado.hora_banio);
          }
          // Conservar nombres de cliente/paciente del row si el registro no los trae
          if (!normalizado.paciente && this.data.paciente) normalizado.paciente = this.data.paciente;
          if (!normalizado.cliente && this.data.cliente) normalizado.cliente = this.data.cliente;
          if (!normalizado.paciente_id && this.data.paciente_id) normalizado.paciente_id = this.data.paciente_id;
          if (!normalizado.cliente_id && this.data.cliente_id) normalizado.cliente_id = this.data.cliente_id;
          if (!normalizado.tipo_servicio) normalizado.tipo_servicio = 'baño_básico';
          if (!normalizado.estado) normalizado.estado = 'programado';
          // Asegurar que el datepicker reciba un Date válido y conservar la fecha original
          if (typeof normalizado.fecha_banio === 'string') {
            const d = new Date(normalizado.fecha_banio);
            if (!isNaN(d.getTime())) {
              // Elimina la parte de hora para evitar desfaces de zona horaria
              normalizado.fecha_banio = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            }
          } else if (normalizado.fecha_banio instanceof Date) {
            const d = normalizado.fecha_banio as Date;
            normalizado.fecha_banio = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          } else if (!normalizado.fecha_banio && normalizado.created_at) {
            // Fallback: usar la fecha de creación si no existe fecha_banio
            const creada = this.parseCreatedAtToDate(normalizado.created_at);
            if (creada) normalizado.fecha_banio = creada;
          }
          // Fallback: si no hay fecha válida del backend, intentar tomarla del row de la tabla (dd/mm/yyyy)
          if (!normalizado.fecha_banio && this.data && this.data.fecha_banio) {
            const f = this.parseFechaLista(this.data.fecha_banio);
            if (f) normalizado.fecha_banio = f;
          }

          this.banioForm.patchValue(normalizado);
          // Recalcular precio por si faltaba precio_total
          this.calcularPrecioTotal();
        }
        // Si por alguna razón no llegó el registro (null), intentar poblar al menos la fecha desde la fila
        else if (this.data && this.data.fecha_banio) {
          const f = this.parseFechaLista(this.data.fecha_banio);
          if (f) {
            this.banioForm.patchValue({ fecha_banio: f });
          }
        }
      });
    }
  }

  /**
   * Normaliza la fecha a formato YYYY-MM-DD preservando exactamente la fecha seleccionada
   * sin importar si es pasada o futura. Esto evita problemas de zona horaria.
   */
  private normalizarFecha(fecha: any): string {
    try {
      if (!fecha) return '';
      
      let date: Date;
      
      // Si ya es string en formato YYYY-MM-DD, retornarlo directamente
      if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return fecha;
      }
      
      // Si es un objeto Date, usar los componentes directamente para evitar zona horaria
      if (fecha instanceof Date) {
        const year = fecha.getFullYear();
        const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const day = fecha.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      // Si es string, intentar parsearlo
      if (typeof fecha === 'string') {
        // Si viene en formato ISO con hora, extraer solo la fecha
        if (fecha.includes('T')) {
          const datePart = fecha.split('T')[0];
          if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
            return datePart;
          }
        }
        
        // Si viene en formato YYYY-MM-DD HH:mm:ss
        if (fecha.includes(' ')) {
          const datePart = fecha.split(' ')[0];
          if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
            return datePart;
          }
        }
        
        // Intentar crear Date y extraer componentes
        date = new Date(fecha);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const day = date.getDate().toString().padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      }
      
      // Si no se pudo parsear, retornar string vacío
      console.warn('⚠️ No se pudo normalizar la fecha:', fecha);
      return '';
    } catch (error) {
      console.error('❌ Error al normalizar fecha:', error);
      return '';
    }
  }

  private normalizarHora(hora: any): string {
    try {
      if (!hora) return '';
      const texto = hora.toString().trim();
      // Si ya está en HH:mm
      if (/^\d{1,2}:\d{2}$/.test(texto)) return texto;
      // Variantes con AM/PM en español o inglés
      const ampmMatch = texto
        .replace(/\s+/g, ' ')
        .replace('a. m.', 'AM').replace('p. m.', 'PM')
        .replace('a.m.', 'AM').replace('p.m.', 'PM')
        .replace('am', 'AM').replace('pm', 'PM')
        .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (ampmMatch) {
        let h = parseInt(ampmMatch[1], 10);
        const m = ampmMatch[2];
        const isPM = ampmMatch[3].toUpperCase() === 'PM';
        if (isPM && h < 12) h += 12;
        if (!isPM && h === 12) h = 0;
        return `${h.toString().padStart(2, '0')}:${m}`;
      }
      // Último recurso: intentar parsear con Date
      const d = new Date(`1970-01-01T${texto}`);
      if (!isNaN(d.getTime())) {
        const hh = d.getHours().toString().padStart(2, '0');
        const mm = d.getMinutes().toString().padStart(2, '0');
        return `${hh}:${mm}`;
      }
      return texto;
    } catch {
      return '';
    }
  }

  // Convierte 'dd/mm/yyyy' a Date truncada a día.
  private parseFechaLista(fechaStr: string): Date | null {
    try {
      const m = fechaStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!m) return null;
      const d = parseInt(m[1], 10);
      const mo = parseInt(m[2], 10) - 1;
      const y = parseInt(m[3], 10);
      return new Date(y, mo, d);
    } catch {
      return null;
    }
  }

  // Convierte 'YYYY-MM-DD HH:mm:ss' o 'YYYY-MM-DD' a Date truncada a día.
  private parseCreatedAtToDate(createdAt: string): Date | null {
    try {
      if (!createdAt) return null;
      const datePart = createdAt.split(' ')[0];
      const m = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return null;
      const y = parseInt(m[1], 10);
      const mo = parseInt(m[2], 10) - 1;
      const d = parseInt(m[3], 10);
      return new Date(y, mo, d);
    } catch {
      return null;
    }
  }

  configurarCalculoPrecio() {
    // Escuchar cambios en precio base y servicios adicionales para calcular precio total
    this.banioForm.get('precio_base')?.valueChanges.subscribe(() => {
      this.calcularPrecioTotal();
    });

    this.banioForm.get('servicios_adicionales')?.valueChanges.subscribe(() => {
      this.calcularPrecioTotal();
    });
    
    // Calcular precio inicial
    setTimeout(() => {
      this.calcularPrecioTotal();
      this.banioForm.updateValueAndValidity({ onlySelf: false, emitEvent: true });
    }, 100);
  }

  // Función para actualizar precio automáticamente cuando se selecciona un servicio
  actualizarPrecioServicio(servicio: any, index: number) {
    if (servicio.servicio && servicio.servicio !== 'otro') {
      const servicioPredefinido = this.serviciosAdicionales.find(s => s.value === servicio.servicio);
      if (servicioPredefinido) {
        servicio.precio = servicioPredefinido.precio;
        // Forzar actualización del formulario
        const serviciosActuales = this.banioForm.get('servicios_adicionales')?.value || [];
        serviciosActuales[index] = servicio;
        this.banioForm.patchValue({ servicios_adicionales: serviciosActuales });
        this.calcularPrecioTotal();
      }
    }
  }

  calcularPrecioTotal(): number {
    const precioBase = this.banioForm.get('precio_base')?.value || 0;
    const serviciosAdicionales = this.banioForm.get('servicios_adicionales')?.value || [];
    
    const totalAdicionales = serviciosAdicionales.reduce((sum: number, servicio: any) => {
      return sum + (Number(servicio.precio) || 0);
    }, 0);
    
    const precioTotal = Number(precioBase) + totalAdicionales;
    
    // Actualizar el campo precio_total en el formulario
    this.banioForm.patchValue({ precio_total: precioTotal }, { emitEvent: true });
    this.banioForm.get('precio_total')?.updateValueAndValidity({ onlySelf: true, emitEvent: true });
    
    return precioTotal;
  }

  agregarServicioAdicional() {
    const serviciosActuales = this.banioForm.get('servicios_adicionales')?.value || [];
    const nuevoServicio = {
      servicio: '',
      precio: 0,
      servicioPersonalizado: ''
    };
    
    this.banioForm.patchValue({
      servicios_adicionales: [...serviciosActuales, nuevoServicio]
    });
  }

  removerServicioAdicional(index: number) {
    const serviciosActuales = this.banioForm.get('servicios_adicionales')?.value || [];
    serviciosActuales.splice(index, 1);
    this.banioForm.patchValue({ servicios_adicionales: serviciosActuales });
    this.calcularPrecioTotal();
  }

  agregarAlergia() {
    const alergiasActuales = this.banioForm.get('alergias_conocidas')?.value || [];
    const nuevaAlergia = '';
    
    this.banioForm.patchValue({
      alergias_conocidas: [...alergiasActuales, nuevaAlergia]
    });
    
    // Agregar espacio para alergia específica
    this.alergiasEspecificas.push('');
  }

  removerAlergia(index: number) {
    const alergiasActuales = this.banioForm.get('alergias_conocidas')?.value || [];
    alergiasActuales.splice(index, 1);
    this.banioForm.patchValue({ alergias_conocidas: alergiasActuales });
    
    // Remover alergia específica correspondiente
    this.alergiasEspecificas.splice(index, 1);
  }



  onSubmit() {
    console.log('🔍 Formulario válido:', this.banioForm.valid);
    console.log('🔍 Errores del formulario:', this.banioForm.errors);
    console.log('🔍 Estado del formulario:', this.banioForm.status);
    
    if (this.banioForm.valid) {
      this.loading = true;
      
      // Obtener valores del formulario, incluyendo campos disabled
      const banioData = { 
        ...this.banioForm.value,
        // Incluir fecha_banio aunque esté disabled (en modo edición)
        fecha_banio: this.banioForm.get('fecha_banio')?.value || this.banioForm.value.fecha_banio
      };
      
      // Normalizar fecha a formato YYYY-MM-DD preservando exactamente la fecha seleccionada
      // Esto es crítico para permitir fechas pasadas sin que se cambien a la fecha actual
      banioData.fecha_banio = this.normalizarFecha(banioData.fecha_banio);
      
      // Validar que la fecha se haya normalizado correctamente
      if (!banioData.fecha_banio || !/^\d{4}-\d{2}-\d{2}$/.test(banioData.fecha_banio)) {
        console.error('❌ Error: La fecha no se pudo normalizar correctamente:', banioData.fecha_banio);
        Swal.fire('Error', 'La fecha seleccionada no es válida. Por favor selecciona una fecha correcta.', 'error');
        this.loading = false;
        return;
      }
      
      // Asegurar formato de hora válido antes de enviar
      banioData.hora_banio = this.normalizarHora(banioData.hora_banio);
      console.log('🔍 Datos del formulario:', banioData);
      console.log('🔍 Fecha normalizada (preservada):', banioData.fecha_banio);
      
      // Limpiar datos antes de enviar
      const datosLimpios = {
        ...banioData,
        // Asegurar que los arrays estén definidos
        servicios_adicionales: banioData.servicios_adicionales || [],
        alergias_conocidas: banioData.alergias_conocidas || [],
        // Asegurar que el campo created_by esté presente
        created_by: banioData.created_by || 'system',
        // Asegurar que productos_utilizados esté definido
        productos_utilizados: banioData.productos_utilizados || []
      };
      
      // Remover campos undefined para evitar errores de Firebase
      Object.keys(datosLimpios).forEach(key => {
        if (datosLimpios[key] === undefined) {
          delete datosLimpios[key];
        }
      });
      
      console.log('🔍 Datos limpios a enviar:', datosLimpios);
      
      if (this.esEdicion) {
        // Actualizar baño existente (solo campos permitidos)
        console.log('🔄 Actualizando baño existente...');
        const permitidos: (keyof typeof datosLimpios)[] = [
          'fecha_banio','hora_banio','tipo_servicio','estado','prioridad','observaciones',
          'alergias_conocidas','comportamiento','peluquero_id','precio_base','servicios_adicionales',
          'precio_total','pagado','metodo_pago','duracion_estimada','tiempo_inicio','tiempo_fin','activo','updated_at','updated_by'
        ];
        const payload: any = {};
        permitidos.forEach(k => { if (datosLimpios[k] !== undefined) payload[k] = datosLimpios[k]; });
        // Si el estado no es 'completado', asegurar que pagado sea false para reflejar ingresos
        if (payload.estado && payload.estado !== 'completado') {
          payload.pagado = false;
        }
        
        // Usar el servicio correcto dependiendo del contexto
        const servicioAUsar = this.hidePatientInfo ? this.baniosPacienteService : this.baniosService;
        const metodoActualizar = this.hidePatientInfo ? 'actualizarBanioPaciente' : 'actualizarBanio';
        
        console.log('🔍 Usando servicio:', this.hidePatientInfo ? 'BaniosPacienteService' : 'BaniosService');
        
        servicioAUsar[metodoActualizar](this.data.id, payload)
          .then(() => {
            console.log('✅ Baño actualizado exitosamente');
            Swal.fire('Actualizado', 'El baño ha sido actualizado exitosamente', 'success');
            this.dialogRef.close(true);
          })
          .catch(error => {
            console.error('❌ Error al actualizar baño:', error);
            Swal.fire('Error', `No se pudo actualizar el baño: ${error.message}`, 'error');
            this.loading = false;
          });
      } else {
        // Crear nuevo baño
        console.log('🔄 Creando nuevo baño...');
        
        // Usar el servicio correcto dependiendo del contexto
        const servicioAUsar = this.hidePatientInfo ? this.baniosPacienteService : this.baniosService;
        const metodoCrear = this.hidePatientInfo ? 'crearBanioPaciente' : 'crearBanio';
        
        console.log('🔍 Usando servicio:', this.hidePatientInfo ? 'BaniosPacienteService' : 'BaniosService');
        
        servicioAUsar[metodoCrear](datosLimpios)
          .then((id) => {
            console.log('✅ Baño creado exitosamente con ID:', id);
            Swal.fire('Creado', 'El baño ha sido creado exitosamente', 'success');
            this.dialogRef.close(true);
          })
          .catch(error => {
            console.error('❌ Error al crear baño:', error);
            Swal.fire('Error', `No se pudo crear el baño: ${error.message}`, 'error');
            this.loading = false;
          });
      }
    } else {
      Swal.fire('Error', 'Por favor completa todos los campos requeridos', 'error');
    }
  }

  cancelar() {
    this.dialogRef.close();
  }

  getTipoServicioIcon(tipo: string): string {
    const tipoEncontrado = this.tiposServicios.find(t => t.value === tipo);
    return tipoEncontrado ? tipoEncontrado.icon : 'pets';
  }

  getTipoServicioLabel(tipo: string): string {
    const tipoEncontrado = this.tiposServicios.find(t => t.value === tipo);
    return tipoEncontrado ? tipoEncontrado.label : tipo;
  }
}
