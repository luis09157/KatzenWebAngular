import { Component, Inject, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PacientesService } from '../pacientes/pacientes.service';
import { ClientesService } from '../clientes/clientes.service';
import { LoggerService } from '../core/logger.service';
import { ErrorMessagesService } from '../core/error-messages.service';
import { getPacienteClienteId } from '../core/utils/paciente-cliente.util';
import { InventarioService } from '../inventario/inventario.service';
import { Movimiento } from '../shared/inventario.models';
import { SalidaDialogComponent } from '../inventario/movimientos/salida-dialog.component';
import { ADMIN_DIALOG_CONFIG } from '../core/config/admin-ui.config';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-historial-detalle',
  templateUrl: './historial-detalle.component.html',
  styleUrls: ['./historial-detalle.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HistorialDetalleComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  pacienteInfo: any = null;
  clienteInfo: any = null;
  loading = true;
  consumos: Movimiento[] = [];
  costoConsumos = 0;
  loadingConsumos = false;

  constructor(
    public dialogRef: MatDialogRef<HistorialDetalleComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private pacientesService: PacientesService,
    private clientesService: ClientesService,
    private logger: LoggerService,
    private errorMessages: ErrorMessagesService,
    private inventarioService: InventarioService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.cargarInformacion();
    this.cargarConsumos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarInformacion() {
    if (!this.data.paciente_id) {
      this.loading = false;
      return;
    }

    this.pacientesService.getPaciente(this.data.paciente_id).pipe(takeUntil(this.destroy$)).subscribe({
      next: paciente => {
        this.pacienteInfo = paciente;
        const clienteId = getPacienteClienteId(paciente);
        if (!clienteId) {
          this.loading = false;
          return;
        }
        this.clientesService.getCliente(clienteId).pipe(takeUntil(this.destroy$)).subscribe({
          next: cliente => {
            this.clienteInfo = cliente;
            this.loading = false;
          },
          error: error => {
            this.logger.error('Error al cargar cliente del historial:', error);
            this.loading = false;
            Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cargar datos'), 'error');
          }
        });
      },
      error: error => {
        this.logger.error('Error al cargar paciente del historial:', error);
        this.loading = false;
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cargar historial detalle'), 'error');
      }
    });
  }

  cargarConsumos(): void {
    if (!this.data?.id) return;
    this.loadingConsumos = true;
    this.inventarioService
      .getMovimientosPorHistorial(this.data.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.consumos = rows || [];
          this.costoConsumos = this.inventarioService.sumarCostoConsumos(this.consumos);
          this.loadingConsumos = false;
        },
        error: (err) => {
          this.logger.error('Error al cargar consumos:', err);
          this.consumos = [];
          this.costoConsumos = 0;
          this.loadingConsumos = false;
        }
      });
  }

  consumirInventario(): void {
    if (!this.data?.id) return;
    const ref = this.dialog.open(SalidaDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '720px',
      disableClose: true,
      data: {
        historialId: this.data.id,
        pacienteId: this.data.paciente_id,
        pacienteNombre: this.getNombrePaciente(),
        motivoDefault: 'uso_consulta',
        hideRegistrarEnCaja: true,
        titulo: 'Consumir inventario',
        subtitulo: `Historial · ${this.getNombrePaciente()}`
      }
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result?.ok) this.cargarConsumos();
    });
  }

  formatMoney(n: number): string {
    return `$${(Number(n) || 0).toFixed(2)}`;
  }

  cerrar() {
    this.dialogRef.close();
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'No disponible';
    
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
      
      return 'No disponible';
    } catch (error) {
      return 'No disponible';
    }
  }

  isActivo(): boolean {
    return !(this.data.activo === false || this.data.activo === 'inactivo' || this.data.activo === 'false');
  }

  getEstadoColor(estado: any): string {
    if (estado === true || estado === 'activo' || estado === 'true') {
      return '#4caf50';
    }
    if (estado === false || estado === 'inactivo' || estado === 'false') {
      return '#f44336';
    }
    return '#4caf50';
  }

  getEstadoText(estado: any): string {
    if (estado === false || estado === 'inactivo' || estado === 'false') {
      return 'Inactivo';
    }
    return 'Activo';
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

  getNombrePaciente(): string {
    if (this.pacienteInfo && this.pacienteInfo.nombre) {
      return this.pacienteInfo.nombre;
    }
    return 'Paciente no encontrado';
  }

  getNombreCliente(): string {
    if (this.clienteInfo) {
      const nombre = this.clienteInfo.nombre || '';
      const apellidoPaterno = this.clienteInfo.apellidoPaterno || '';
      const apellidoMaterno = this.clienteInfo.apellidoMaterno || '';
      return [nombre, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ');
    }
    return 'Cliente no encontrado';
  }

  getInfoPaciente(): string {
    if (!this.pacienteInfo) return 'Información no disponible';
    
    const info = [];
    if (this.pacienteInfo.especie) info.push(this.pacienteInfo.especie);
    if (this.pacienteInfo.raza) info.push(this.pacienteInfo.raza);
    if (this.pacienteInfo.sexo) info.push(this.pacienteInfo.sexo);
    
    return info.length > 0 ? info.join(', ') : 'Información no disponible';
  }

  verArchivo(urlArchivo: string) {
    try {
      window.open(urlArchivo, '_blank');
    } catch (error) {
      this.logger.error('Error al abrir archivo:', error);
      Swal.fire('Error', 'No se pudo abrir el archivo. Inténtalo de nuevo.', 'error');
    }
  }

  descargarArchivo(urlArchivo: string) {
    try {
      const link = document.createElement('a');
      link.href = urlArchivo;
      const nombreArchivo = this.extraerNombreArchivo(urlArchivo);
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      this.logger.error('Error al descargar archivo:', error);
      Swal.fire('Error', 'No se pudo descargar el archivo. Inténtalo de nuevo.', 'error');
    }
  }

  private extraerNombreArchivo(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const nombreArchivo = pathname.split('/').pop();
      
      if (nombreArchivo && nombreArchivo.includes('.')) {
        return nombreArchivo;
      }
      
      return 'archivo_descargado';
    } catch (error) {
      return 'archivo_descargado';
    }
  }
}
