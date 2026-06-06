import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { PacientesService } from './pacientes.service';
import { ClientesService } from '../clientes/clientes.service';
import { HistorialesService } from '../historiales/historiales.service';
import { RecordatoriosService } from '../recordatorios/recordatorios.service';
import { VacunasService } from '../vacunas/vacunas.service';
import { BaniosPacienteService } from './banios-paciente.service';
import { PacienteDialogComponent } from './paciente-dialog.component';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { HistorialDialogComponent } from '../historiales/historial-dialog.component';
import { RecordatorioDialogComponent } from '../recordatorios/recordatorio-dialog.component';
import { VacunaDialogComponent } from '../vacunas/vacuna-dialog.component';
import { VacunaDetalleComponent } from '../vacunas/vacuna-detalle.component';
import { HistorialDetalleComponent } from '../historiales/historial-detalle.component';
import { RecordatorioDetalleComponent } from '../recordatorios/recordatorio-detalle.component';

@Component({
  selector: 'app-pacientes',
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.css']
})
export class PacientesComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
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

  // Propiedades para recordatorios
  recordatorios: any[] = [];

  // Propiedades para vacunas
  vacunas: any[] = [];
  logActividades: any[] = [];
  
  // Propiedades para baños
  banios: any[] = [];
  
  // Control de estado
  isCreatingHistorial = false;
  loading = false;
  private initialLoadCount = 0;

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

  constructor(
    private pacientesService: PacientesService,
    private clientesService: ClientesService,
    private historialesService: HistorialesService,
    private recordatoriosService: RecordatoriosService,
    private vacunasService: VacunasService,
    private baniosPacienteService: BaniosPacienteService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit() {
    this.loading = true;
    this.initialLoadCount = 0;
    this.pacientesService.getPacientes().pipe(takeUntil(this.destroy$)).subscribe({
      next: pacientes => {
        this.allPacientes = (pacientes || []).filter((p: { activo?: boolean }) => p.activo !== false);
        this.filtrarPacientes();
        this.initialLoadCount++;
        if (this.initialLoadCount >= 2) this.loading = false;
      },
      error: () => { this.initialLoadCount++; if (this.initialLoadCount >= 2) this.loading = false; }
    });
    this.clientesService.getClientes().pipe(takeUntil(this.destroy$)).subscribe({
      next: clientes => {
        this.allClientes = clientes || [];
        this.initialLoadCount++;
        if (this.initialLoadCount >= 2) this.loading = false;
      },
      error: () => { this.initialLoadCount++; if (this.initialLoadCount >= 2) this.loading = false; }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(event: any) {
    // Obtener el valor del input de forma segura
    const value = event?.target?.value || '';
    this.searchTerm = value;
    this.filtrarPacientes();
  }

  filtrarPacientes() {
    try {
      // Asegurar que searchTerm sea siempre un string
      const searchValue = String(this.searchTerm || '');
      
      // Verificar que searchTerm no esté vacío después de trim
      const term = searchValue.trim().toLowerCase();
      if (!term) {
        this.pacientesFiltrados = [];
        return;
      }
    
    // Filtrar solo pacientes activos
    const pacientesActivos = this.allPacientes.filter(p => p.activo !== false);
    
    this.pacientesFiltrados = pacientesActivos.filter(p => {
      const nombrePaciente = (p.nombre || '').toLowerCase();
      const nombreCliente = this.getClienteNombre(p.cliente_id || p.idCliente).toLowerCase();
      
      // Buscar en nombre del paciente
      if (nombrePaciente.includes(term)) {
        return true;
      }
      
      // Buscar en nombre completo del cliente
      if (nombreCliente.includes(term)) {
        return true;
      }
      
      // Buscar en partes individuales del nombre del cliente
      const cliente = this.allClientes.find(c => c.id === (p.cliente_id || p.idCliente));
      if (cliente) {
        const nombre = (cliente.nombre || '').toLowerCase();
        const apellidoPaterno = (cliente.apellidoPaterno || '').toLowerCase();
        const apellidoMaterno = (cliente.apellidoMaterno || '').toLowerCase();
        
        if (nombre.includes(term) || apellidoPaterno.includes(term) || apellidoMaterno.includes(term)) {
          return true;
        }
      }
      
      return false;
    });
    } catch (error) {
      console.error('Error en filtrarPacientes:', error);
      this.pacientesFiltrados = [];
    }
  }

  seleccionarPaciente(paciente: any) {
    this.pacienteSeleccionado = paciente;
    // Cargar historial clínico real del paciente
    this.cargarHistorialClinico(paciente.id);
    // Cargar recordatorios del paciente
    this.cargarRecordatorios(paciente.id);
    // Cargar vacunas del paciente
    this.cargarVacunas(paciente.id);
    // Cargar baños del paciente
    this.cargarBanios(paciente.id);
    this.cargarLogActividades(paciente.id);
  }

  cargarHistorialClinico(pacienteId: string) {
    this.historialesService.getHistorialesPorPaciente(pacienteId).pipe(takeUntil(this.destroy$)).subscribe(historiales => {
      
      this.historialClinico = historiales.map(historial => {
        const historialFormateado = {
          ...historial,
          fecha_formateada: this.formatearFecha(historial.fecha_registro),
          tiempo_transcurrido: this.getTiempoTranscurrido(historial.fecha_registro)
        };
        
        console.log('📝 Historial formateado:', historialFormateado);
        console.log('🔍 Campo diagnostico_presuntivo:', historialFormateado.diagnostico_presuntivo);
        
        return historialFormateado;
      });
    });
  }

  getTiempoTranscurrido(fecha: any): string {
    if (!fecha) return '';
    
    try {
      const fechaHistorial = new Date(fecha);
      const ahora = new Date();
      const diferencia = ahora.getTime() - fechaHistorial.getTime();
      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      
      if (dias === 0) {
        return 'Hoy';
      } else if (dias === 1) {
        return 'Ayer';
      } else if (dias < 7) {
        return `Hace ${dias} días`;
      } else if (dias < 30) {
        const semanas = Math.floor(dias / 7);
        return `Hace ${semanas} semana${semanas > 1 ? 's' : ''}`;
      } else {
        const meses = Math.floor(dias / 30);
        return `Hace ${meses} mes${meses > 1 ? 'es' : ''}`;
      }
    } catch (error) {
      return '';
    }
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/P';
    
    try {
      if (fecha instanceof Date) {
        return fecha.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      if (typeof fecha === 'string') {
        const date = new Date(fecha);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }
      
      return 'N/P';
    } catch (error) {
      return 'N/P';
    }
  }

  // Métodos para recordatorios
  cargarRecordatorios(pacienteId: string) {
    this.recordatoriosService.getRecordatoriosPorPaciente(pacienteId).pipe(takeUntil(this.destroy$)).subscribe(recordatorios => {
      this.recordatorios = (recordatorios || []).map(r => {
        // Buscar el campo de fecha correcto
        const fechaRaw = r.fecha_hora_recordatorio || r.fecha_recordatorio || null;
        let fecha = null;
        if (fechaRaw) {
          fecha = new Date(fechaRaw);
        }
        let fecha_formateada = 'No disponible';
        if (fecha && !isNaN(fecha.getTime())) {
          fecha_formateada = fecha.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
        }
        let estadoTiempo = '';
        if (fecha && !isNaN(fecha.getTime())) {
          const ahora = new Date();
          const diferencia = fecha.getTime() - ahora.getTime();
          const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
          if (dias < 0) {
            estadoTiempo = `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) > 1 ? 's' : ''}`;
          } else if (dias === 0) {
            estadoTiempo = 'Hoy';
          } else if (dias === 1) {
            estadoTiempo = 'Mañana';
          } else if (dias < 7) {
            estadoTiempo = `En ${dias} días`;
          } else {
            const semanas = Math.floor(dias / 7);
            estadoTiempo = `En ${semanas} semana${semanas > 1 ? 's' : ''}`;
          }
        }
        return {
          ...r,
          fecha_formateada,
          estado_tiempo: estadoTiempo
        };
      });
    });
  }

  agregarRecordatorio() {
    if (!this.pacienteSeleccionado) {
      Swal.fire('Error', 'Debes seleccionar un paciente primero', 'error');
      return;
    }

    const dialogRef = this.dialog.open(RecordatorioDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: { 
        paciente_id: this.pacienteSeleccionado.id,
        desdePaciente: true // Flag para indicar que viene desde la página del paciente
      }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        // El recordatorio ya se creó en el diálogo, solo recargar y registrar en log
        console.log('Recordatorio creado desde diálogo:', result);
        
        this.cargarRecordatorios(this.pacienteSeleccionado.id);
        
        // Registrar en el log con los datos completos
        const datosParaLog = {
          titulo: result.titulo || 'Sin título',
          fecha_hora_recordatorio: result.fecha_hora_recordatorio || result.fecha_recordatorio,
          prioridad: result.prioridad || 'media',
          paciente_id: this.pacienteSeleccionado.id,
          id: result.id // El ID ya viene del diálogo
        };
        
        console.log('Registrando recordatorio en log:', datosParaLog);
        this.pacientesService.registrarRecordatorio(this.pacienteSeleccionado.id, datosParaLog).then(() => {
          console.log('Recordatorio registrado en log exitosamente');
          this.cargarLogActividades(this.pacienteSeleccionado.id);
        }).catch(error => {
          console.error('Error al registrar recordatorio en log:', error);
        });
      }
    });
  }

  editarRecordatorio(recordatorio: any) {
    const dialogRef = this.dialog.open(RecordatorioDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: recordatorio
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.cargarRecordatorios(this.pacienteSeleccionado.id);
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Recordatorio actualizado correctamente'
        });
      }
    });
  }

  eliminarRecordatorio(recordatorio: any) {
    Swal.fire({
      icon: 'warning',
      title: '¿Archivar recordatorio?',
      text: 'Se marcará como inactivo. Los datos se conservan en RTDB.',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, archivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.recordatoriosService.bajaLogicaRecordatorio(recordatorio.id).then(() => {
          this.cargarRecordatorios(this.pacienteSeleccionado.id);
          Swal.fire({
            icon: 'success',
            title: 'Archivado',
            text: 'Recordatorio dado de baja correctamente'
          });
        }).catch(error => {
          console.error('Error al eliminar recordatorio:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar el recordatorio'
          });
        });
      }
    });
  }

  cambiarEstadoRecordatorio(recordatorio: any, nuevoEstado: string) {
    if (nuevoEstado === 'completado') {
      this.recordatoriosService.marcarCompletado(recordatorio.id).then(() => {
        this.cargarRecordatorios(this.pacienteSeleccionado.id);
        Swal.fire({
          icon: 'success',
          title: '¡Completado!',
          text: 'Recordatorio marcado como completado'
        });
      });
    } else {
      this.recordatoriosService.marcarPendiente(recordatorio.id).then(() => {
        this.cargarRecordatorios(this.pacienteSeleccionado.id);
        Swal.fire({
          icon: 'success',
          title: '¡Pendiente!',
          text: 'Recordatorio marcado como pendiente'
        });
      });
    }
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'completado':
        return '#4caf50';
      case 'pendiente':
        return '#ff9800';
      case 'cancelado':
        return '#f44336';
      default:
        return '#666';
    }
  }

  getPrioridadColor(prioridad: string): string {
    switch (prioridad) {
      case 'urgente':
        return '#9c27b0';
      case 'alta':
        return '#f44336';
      case 'media':
        return '#ff9800';
      case 'baja':
        return '#4caf50';
      default:
        return '#666';
    }
  }

  // Métodos para CRUD del historial clínico
  agregarHistorialClinico() {
    if (!this.pacienteSeleccionado) {
      Swal.fire('Error', 'Debes seleccionar un paciente primero', 'error');
      return;
    }

    // Evitar múltiples clics
    if (this.isCreatingHistorial) {
      return;
    }

    this.isCreatingHistorial = true;

    const dialogRef = this.dialog.open(HistorialDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: { 
        historial: null, 
        modoVer: false,
        paciente_id: this.pacienteSeleccionado.id 
      }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        console.log('✅ Historial creado exitosamente desde diálogo');
        
        // Recargar el historial clínico
        this.cargarHistorialClinico(this.pacienteSeleccionado.id);
        
        // Registrar en el log de actividades (solo para tracking)
        const datosParaLog = {
          diagnostico_presuntivo: result.diagnostico_presuntivo || 'Sin diagnóstico',
          manejo_terapeutico: result.manejo_terapeutico || 'Sin tratamiento',
          receta: result.receta || 'Sin medicamentos',
          paciente_id: this.pacienteSeleccionado.id,
          id: result.id
        };
        
        console.log('Registrando historial clínico en log:', datosParaLog);
        this.pacientesService.registrarHistorialClinico(this.pacienteSeleccionado.id, datosParaLog).then(() => {
          console.log('Historial clínico registrado en log exitosamente');
          this.cargarLogActividades(this.pacienteSeleccionado.id);
        }).catch(error => {
          console.error('Error al registrar historial en log:', error);
        });
      }
      
      this.isCreatingHistorial = false;
    });
  }

  editarHistorialClinico(historial: any) {
    const dialogRef = this.dialog.open(HistorialDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: { 
        historial: historial, 
        modoVer: false 
      }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.historialesService.actualizarHistorial(historial.id, result).then(() => {
          Swal.fire('Éxito', 'Historial clínico actualizado correctamente', 'success');
          this.cargarHistorialClinico(this.pacienteSeleccionado.id);
          // Registrar en el log
          this.pacientesService.registrarEdicionHistorialClinico(this.pacienteSeleccionado.id, result);
          this.cargarLogActividades(this.pacienteSeleccionado.id);
        }).catch(error => {
          console.error('Error al actualizar historial:', error);
          Swal.fire('Error', 'No se pudo actualizar el historial clínico', 'error');
        });
      }
    });
  }

  verDetalleHistorial(historial: any) {
    this.historialesService.getHistorial(historial.id).pipe(takeUntil(this.destroy$)).subscribe((historialCompleto) => {
      this.dialog.open(HistorialDetalleComponent, {
        width: '90vw',
        maxWidth: '95vw',
        data: historialCompleto
      });
    });
  }

  eliminarHistorialClinico(historial: any) {
    Swal.fire({
      title: '¿Archivar historial?',
      text: 'Baja lógica en admin. Para ocultarlo del portal del dueño, edítalo y marca "Ocultar del portal".',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.historialesService.bajaLogicaHistorial(historial.id).then(() => {
          Swal.fire('Baja lógica', 'El historial fue dado de baja correctamente.', 'success');
          this.cargarHistorialClinico(this.pacienteSeleccionado.id);
          // Registrar en el log
          this.pacientesService.registrarEliminacionHistorialClinico(this.pacienteSeleccionado.id, historial);
          this.cargarLogActividades(this.pacienteSeleccionado.id);
        }).catch(error => {
          console.error('Error al dar de baja:', error);
          Swal.fire('Error', 'No se pudo dar de baja el historial', 'error');
        });
      }
    });
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

  getClienteNombreFromPaciente(paciente: any): string {
    // Si el paciente tiene nombreCliente, usarlo directamente
    if (paciente.nombreCliente) {
      return paciente.nombreCliente.trim();
    }
    // Si no, buscar en la lista de clientes
    return this.getClienteNombre(paciente.idCliente);
  }

  displayPaciente = (paciente: any): string => {
    if (!paciente || !paciente.nombre) return '';
    const clienteNombre = this.getClienteNombreFromPaciente(paciente);
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
    return cliente?.correo || 'Sin email';
  }

  calcularEdad(fechaNacimiento: string): string {
    if (!fechaNacimiento) return 'Edad no registrada';
    
    try {
      // Formato esperado: "18/4/2015" o "12/9/2015"
      const partes = fechaNacimiento.split('/');
      if (partes.length !== 3) {
        return 'Edad no registrada';
      }
      
      const dia = parseInt(partes[0]);
      const mes = parseInt(partes[1]) - 1; // Meses en JS van de 0-11
      const año = parseInt(partes[2]);
      
      const fechaNac = new Date(año, mes, dia);
      const hoy = new Date();
      
      // Verificar que la fecha sea válida
      if (isNaN(fechaNac.getTime())) {
        return 'Edad no registrada';
      }
      
      const diferencia = hoy.getTime() - fechaNac.getTime();
      const años = Math.floor(diferencia / (1000 * 60 * 60 * 24 * 365));
      const meses = Math.floor((diferencia % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
      
      if (años > 0) {
        return `${años} año${años > 1 ? 's' : ''} y ${meses} mes${meses > 1 ? 'es' : ''}`;
      } else {
        return `${meses} mes${meses > 1 ? 'es' : ''}`;
      }
    } catch (error) {
      return 'Edad no registrada';
    }
  }

  getPacienteInfo(paciente: any): string {
    const info = [];
    
    if (paciente.especie) info.push(paciente.especie);
    if (paciente.raza) info.push(paciente.raza);
    if (paciente.color) info.push(paciente.color);
    
    return info.length > 0 ? info.join(', ') : 'Información no disponible';
  }

  // Métodos para vacunas
  cargarVacunas(pacienteId: string) {
    this.vacunasService.getVacunasPorPaciente(pacienteId).pipe(takeUntil(this.destroy$)).subscribe(vacunas => {
      this.vacunas = vacunas.map(v => {
        // Usar fechaAplicacion en lugar de fecha, con fallback a fechaRegistro
        const fechaRaw = v.fechaAplicacion || v.fechaRegistro || v.fecha;
        let fecha = null;
        let fecha_formateada = 'N/P';
        let estadoTiempo = '';
        let dias = 0;
        
        if (fechaRaw) {
          try {
            fecha = new Date(fechaRaw);
            if (!isNaN(fecha.getTime())) {
              fecha_formateada = fecha.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              });
              
              // Calcular tiempo restante
              const ahora = new Date();
              const diferencia = fecha.getTime() - ahora.getTime();
              dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
              
              if (dias < 0) {
                estadoTiempo = `Vencida hace ${Math.abs(dias)} día${Math.abs(dias) > 1 ? 's' : ''}`;
              } else if (dias === 0) {
                estadoTiempo = 'Hoy';
              } else if (dias === 1) {
                estadoTiempo = 'Mañana';
              } else if (dias < 7) {
                estadoTiempo = `En ${dias} días`;
              } else {
                const semanas = Math.floor(dias / 7);
                estadoTiempo = `En ${semanas} semana${semanas > 1 ? 's' : ''}`;
              }
            }
          } catch (error) {
            console.warn('Error procesando fecha de vacuna:', error);
            fecha_formateada = 'Fecha inválida';
            estadoTiempo = 'N/A';
          }
        }
        
        return {
          ...v,
          fecha_formateada,
          estado_tiempo: estadoTiempo,
          dias_restantes: dias
        };
      });
    });
  }

  agregarVacuna() {
    if (!this.pacienteSeleccionado) {
      Swal.fire('Error', 'Debes seleccionar un paciente primero', 'error');
      return;
    }

    const dialogRef = this.dialog.open(VacunaDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: { paciente_id: this.pacienteSeleccionado.id }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        // Solo recargar las vacunas y el log - NO crear la vacuna manualmente
        // porque VacunaDialogComponent ya lo hace
        console.log('Vacuna creada desde diálogo, recargando datos...');
        this.cargarVacunas(this.pacienteSeleccionado.id);
        this.cargarLogActividades(this.pacienteSeleccionado.id);
      }
    });
  }

  editarVacuna(vacuna: any) {
    const dialogRef = this.dialog.open(VacunaDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: vacuna
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.cargarVacunas(this.pacienteSeleccionado.id);
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Vacuna actualizada correctamente'
        });
      }
    });
  }

  eliminarVacuna(vacuna: any) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'La vacuna será eliminada del sistema.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        // Usar baja lógica en lugar de eliminación física
        this.vacunasService.bajaLogicaVacuna(vacuna.id).then(() => {
          Swal.fire('Eliminada', 'Vacuna eliminada correctamente.', 'success');
          this.cargarVacunas(this.pacienteSeleccionado.id);
          // Registrar en el log
          this.pacientesService.registrarEliminacionVacuna(this.pacienteSeleccionado.id, vacuna);
          this.cargarLogActividades(this.pacienteSeleccionado.id);
        }).catch(error => {
          console.error('Error al eliminar vacuna:', error);
          Swal.fire('Error', 'No se pudo eliminar la vacuna', 'error');
        });
      }
    });
  }

  cambiarEstadoVacuna(vacuna: any, nuevoEstado: string) {
    if (nuevoEstado === 'aplicada') {
      this.vacunasService.marcarAplicada(vacuna.id).then(() => {
        this.cargarVacunas(this.pacienteSeleccionado.id);
        Swal.fire({
          icon: 'success',
          title: '¡Aplicada!',
          text: 'Vacuna marcada como aplicada'
        });
      });
    } else {
      this.vacunasService.marcarPendiente(vacuna.id).then(() => {
        this.cargarVacunas(this.pacienteSeleccionado.id);
        Swal.fire({
          icon: 'success',
          title: '¡Pendiente!',
          text: 'Vacuna marcada como pendiente'
        });
      });
    }
  }

  getVacunaEstadoColor(estado: boolean): string {
    return estado ? '#4caf50' : '#ff9800';
  }

  getVacunaIcono(tipo: string): string {
    switch (tipo) {
      case 'quintuple':
        return 'vaccines';
      case 'sextuple':
        return 'vaccines';
      case 'antirrabica':
        return 'security';
      case 'coronavirus':
        return 'coronavirus';
      case 'triple_felina':
        return 'pets';
      case 'leucemia':
        return 'healing';
      case 'parvovirus':
        return 'bug_report';
      case 'moquillo':
        return 'sick';
      case 'hepatitis':
        return 'medical_services';
      default:
        return 'vaccines';
    }
  }

  cargarBanios(pacienteId: string) {
    this.baniosPacienteService.getBaniosPorPaciente(pacienteId).pipe(takeUntil(this.destroy$)).subscribe(banios => {
      this.banios = banios;
      console.log('🛁 Baños cargados para paciente:', pacienteId, banios);
    });
  }

  verVacunaDetalle(vacuna: any) {
    const dialogRef = this.dialog.open(VacunaDetalleComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: vacuna
    });
  }

  verDetalleRecordatorio(recordatorio: any) {
    this.dialog.open(RecordatorioDetalleComponent, {
      width: '700px',
      data: recordatorio
    });
  }

  cargarLogActividades(pacienteId: string) {
    this.pacientesService.getLogActividades(pacienteId).pipe(takeUntil(this.destroy$)).subscribe(log => {
      console.log('Número de actividades:', log.length);
      this.logActividades = log;
      console.log('logActividades actualizado:', this.logActividades);
    }, error => {
      console.error('Error al cargar log de actividades:', error);
    });
  }

  getIconoActividad(tipo: string): string {
    switch (tipo) {
      case 'historial_clinico': return 'medical_services';
      case 'historial_clinico_editado': return 'edit';
      case 'historial_clinico_eliminado': return 'delete';
      case 'vacuna': return 'vaccines';
      case 'vacuna_editada': return 'edit';
      case 'vacuna_eliminada': return 'delete';
      case 'recordatorio': return 'notifications';
      case 'recordatorio_editado': return 'edit';
      case 'recordatorio_eliminado': return 'delete';
      case 'cita': return 'event';
      default: return 'info';
    }
  }

  getColorActividad(tipo: string): string {
    switch (tipo) {
      case 'historial_clinico': return '#7b2c5c';
      case 'historial_clinico_editado': return '#ff9800';
      case 'historial_clinico_eliminado': return '#f44336';
      case 'vacuna': return '#4caf50';
      case 'vacuna_editada': return '#ff9800';
      case 'vacuna_eliminada': return '#f44336';
      case 'recordatorio': return '#ff9800';
      case 'recordatorio_editado': return '#ff9800';
      case 'recordatorio_eliminado': return '#f44336';
      case 'cita': return '#2196f3';
      default: return '#888';
    }
  }

  formatearFechaLog(fecha: string): string {
    if (!fecha) return 'Fecha no disponible';
    try {
      const date = new Date(fecha);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return 'Fecha no disponible';
    } catch {
      return 'Fecha no disponible';
    }
  }

  // Método de prueba para verificar el log
  probarLog() {
    if (!this.pacienteSeleccionado) {
      Swal.fire('Error', 'Debes seleccionar un paciente primero', 'error');
      return;
    }

    console.log('Probando log para paciente:', this.pacienteSeleccionado.id);
    
    this.pacientesService.probarLogActividad(this.pacienteSeleccionado.id).then(() => {
      console.log('Prueba de log exitosa');
      Swal.fire('Éxito', 'Prueba de log completada', 'success');
      this.cargarLogActividades(this.pacienteSeleccionado.id);
    }).catch(error => {
      console.error('Error en prueba de log:', error);
      Swal.fire('Error', 'Error en prueba de log: ' + error, 'error');
    });
  }

  // ===== MÉTODOS PARA BAÑOS =====

  onBanioCreado(banio: any) {
    console.log('Baño creado:', banio);
    this.cargarBanios(this.pacienteSeleccionado.id);
    this.cargarLogActividades(this.pacienteSeleccionado.id);
  }

  onBanioActualizado(banio: any) {
    console.log('Baño actualizado:', banio);
    this.cargarBanios(this.pacienteSeleccionado.id);
    this.cargarLogActividades(this.pacienteSeleccionado.id);
  }

  onBanioEliminado(banio: any) {
    console.log('Baño eliminado:', banio);
    this.cargarBanios(this.pacienteSeleccionado.id);
    this.cargarLogActividades(this.pacienteSeleccionado.id);
  }

  // Eliminar métodos y referencias viejas
  // Eliminar cargarDatos(), onSearchInput(), clearSearch(), selectPatient(), backToSearch(), nuevoPaciente(), editPatient(), addHistory(), nuevaCita(), verHistoriales(), agregarVacuna(), onTabChange(), getClienteInfo(), goBack(), aplicarFiltro(), abrirModalPaciente(), verPaciente(), editarPaciente(), bajaLogicaPaciente(), y cualquier referencia a allPatients, allClients, filteredPatients, selectedPatient.
}
