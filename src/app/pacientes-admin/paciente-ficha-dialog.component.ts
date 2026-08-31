import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HistorialesService } from '../historiales/historiales.service';
import { VacunasService } from '../vacunas/vacunas.service';
import { RecordatoriosService } from '../recordatorios/recordatorios.service';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoggerService } from '../core/logger.service';
import { getPacienteNombre } from '../core/utils/paciente-search.util';
import { getClienteNombreCompleto } from '../core/utils/cliente-search.util';
import { collectRelatedIds, pickLegacyString } from '../core/utils/rtdb-row.util';
import { normalizeAlergias } from '../shared/alergias/alergias.util';
import Swal from 'sweetalert2';

export interface PacienteFichaDialogData {
  paciente: Record<string, unknown> | null;
  cliente?: Record<string, unknown> | null;
}

@Component({
  selector: 'app-paciente-ficha-dialog',
  templateUrl: './paciente-ficha-dialog.component.html',
  styleUrls: ['./paciente-ficha-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PacienteFichaDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  paciente: Record<string, unknown> | null = null;
  cliente: Record<string, unknown> | null = null;
  alergias: string[] = [];
  historial: any[] = [];
  vacunas: any[] = [];
  recordatorios: any[] = [];
  loadingClinico = true;
  seccionesPendientes = 3;

  constructor(
    public dialogRef: MatDialogRef<PacienteFichaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PacienteFichaDialogData,
    private router: Router,
    private historialesService: HistorialesService,
    private vacunasService: VacunasService,
    private recordatoriosService: RecordatoriosService,
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.paciente = this.data?.paciente || null;
    this.cliente = this.data?.cliente || null;
    this.alergias = normalizeAlergias(this.paciente);
    this.cargarExpediente();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get nombre(): string {
    return getPacienteNombre(this.paciente as any) || 'Sin nombre';
  }

  get fotoUrl(): string {
    const rec = this.paciente || {};
    return String(rec['imageUrl'] || rec['foto'] || rec['Foto'] || 'assets/katzen-logo.jpg');
  }

  get especieRaza(): string {
    const especie = pickLegacyString(this.paciente, 'especie', 'Especie') || 'Especie N/P';
    const raza = pickLegacyString(this.paciente, 'raza', 'Raza') || 'Raza N/P';
    return `${especie} · ${raza}`;
  }

  get sexo(): string {
    return pickLegacyString(this.paciente, 'sexo', 'Sexo');
  }

  get pesoLabel(): string {
    const raw = this.paciente?.['peso'] ?? this.paciente?.['Peso'];
    if (raw == null || String(raw).trim() === '') {
      return '';
    }
    const text = String(raw).trim();
    return /kg/i.test(text) ? text : `${text} kg`;
  }

  get estado(): string {
    return pickLegacyString(this.paciente, 'estado', 'Estado') || 'Vivo';
  }

  get edadLabel(): string {
    const raw = pickLegacyString(this.paciente, 'edad', 'fechaNacimiento', 'fecha_nacimiento');
    return this.calcularEdad(raw);
  }

  get fechaNacimiento(): string {
    return pickLegacyString(this.paciente, 'edad', 'fechaNacimiento', 'fecha_nacimiento') || 'Fecha no registrada';
  }

  get color(): string {
    return pickLegacyString(this.paciente, 'color', 'Color');
  }

  get microchip(): string {
    return pickLegacyString(this.paciente, 'microchip', 'Microchip', 'chip');
  }

  get duenoNombre(): string {
    return getClienteNombreCompleto(this.cliente as any) || 'Sin dueño';
  }

  get duenoTelefono(): string {
    return pickLegacyString(this.cliente, 'telefono', 'Telefono', 'tel', 'celular');
  }

  get duenoCorreo(): string {
    return pickLegacyString(this.cliente, 'correo', 'Correo', 'email', 'Email');
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  abrirExpedienteCompleto(): void {
    const id = String(this.paciente?.['id'] || '').trim();
    this.dialogRef.close();
    if (!id) {
      return;
    }
    this.router.navigate(['/admin/paciente'], { queryParams: { id } });
  }

  private cargarExpediente(): void {
    const id = String(this.paciente?.['id'] || '').trim();
    if (!id) {
      this.loadingClinico = false;
      return;
    }
    const extra = collectRelatedIds(this.paciente, ['idPaciente', 'paciente_id']);
    this.seccionesPendientes = 3;
    this.loadingClinico = true;

    this.historialesService.getHistorialesPorPaciente(id, extra).pipe(takeUntil(this.destroy$)).subscribe({
      next: rows => {
        this.historial = (rows || []).map(h => ({
          ...h,
          fecha_formateada: this.formatearFecha(h.fecha_registro),
          tiempo_transcurrido: this.getTiempoTranscurrido(h.fecha_registro)
        }));
        this.marcarSeccionLista();
      },
      error: error => {
        this.historial = [];
        this.marcarSeccionLista();
        this.avisarSeccion('cargar historial ficha', error);
      }
    });

    this.vacunasService.getVacunasPorPaciente(id, extra).pipe(takeUntil(this.destroy$)).subscribe({
      next: rows => {
        this.vacunas = (rows || []).map(v => {
          const fechaRaw = v.fechaAplicacion || v.fechaRegistro || v.fecha;
          return {
            ...v,
            fecha_formateada: this.formatearFechaCorta(fechaRaw)
          };
        });
        this.marcarSeccionLista();
      },
      error: error => {
        this.vacunas = [];
        this.marcarSeccionLista();
        this.avisarSeccion('cargar vacunas ficha', error);
      }
    });

    this.recordatoriosService.getRecordatoriosPorPaciente(id, extra).pipe(takeUntil(this.destroy$)).subscribe({
      next: rows => {
        this.recordatorios = (rows || []).map(r => {
          const fechaRaw = r.fecha_hora_recordatorio || r.fecha_recordatorio || null;
          return {
            ...r,
            fecha_formateada: this.formatearFechaCorta(fechaRaw)
          };
        });
        this.marcarSeccionLista();
      },
      error: error => {
        this.recordatorios = [];
        this.marcarSeccionLista();
        this.avisarSeccion('cargar recordatorios ficha', error);
      }
    });
  }

  private marcarSeccionLista(): void {
    this.seccionesPendientes = Math.max(0, this.seccionesPendientes - 1);
    if (this.seccionesPendientes <= 0) {
      this.loadingClinico = false;
    }
  }

  private avisarSeccion(context: string, error: unknown): void {
    this.logger.error(`Error en ficha (${context}):`, error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: this.errorMessages.getUserMessage(error, context),
      toast: true,
      position: 'top-end',
      timer: 4500,
      showConfirmButton: false
    });
  }

  private calcularEdad(fechaNacimiento: string): string {
    if (!fechaNacimiento) {
      return 'Edad N/P';
    }
    try {
      let fechaNac: Date | null = null;
      if (fechaNacimiento.includes('/')) {
        const partes = fechaNacimiento.split('/');
        if (partes.length === 3) {
          fechaNac = new Date(parseInt(partes[2], 10), parseInt(partes[1], 10) - 1, parseInt(partes[0], 10));
        }
      } else {
        const parsed = new Date(fechaNacimiento);
        if (!isNaN(parsed.getTime())) {
          fechaNac = parsed;
        }
      }
      if (!fechaNac || isNaN(fechaNac.getTime())) {
        return 'Edad N/P';
      }
      const hoy = new Date();
      const diferencia = hoy.getTime() - fechaNac.getTime();
      const años = Math.floor(diferencia / (1000 * 60 * 60 * 24 * 365));
      const meses = Math.floor((diferencia % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
      if (años > 0) {
        return `${años} año${años > 1 ? 's' : ''} y ${meses} mes${meses > 1 ? 'es' : ''}`;
      }
      return `${meses} mes${meses > 1 ? 'es' : ''}`;
    } catch {
      return 'Edad N/P';
    }
  }

  private formatearFecha(fecha: unknown): string {
    if (!fecha) {
      return 'N/P';
    }
    try {
      const date = fecha instanceof Date ? fecha : new Date(String(fecha));
      if (isNaN(date.getTime())) {
        return 'N/P';
      }
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/P';
    }
  }

  private formatearFechaCorta(fecha: unknown): string {
    if (!fecha) {
      return 'N/P';
    }
    try {
      const date = fecha instanceof Date ? fecha : new Date(String(fecha));
      if (isNaN(date.getTime())) {
        return 'N/P';
      }
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return 'N/P';
    }
  }

  private getTiempoTranscurrido(fecha: unknown): string {
    if (!fecha) {
      return '';
    }
    try {
      const fechaHistorial = new Date(String(fecha));
      if (isNaN(fechaHistorial.getTime())) {
        return '';
      }
      const dias = Math.floor((Date.now() - fechaHistorial.getTime()) / (1000 * 60 * 60 * 24));
      if (dias === 0) {
        return 'Hoy';
      }
      if (dias === 1) {
        return 'Ayer';
      }
      if (dias < 7) {
        return `Hace ${dias} días`;
      }
      if (dias < 30) {
        const semanas = Math.floor(dias / 7);
        return `Hace ${semanas} semana${semanas > 1 ? 's' : ''}`;
      }
      const meses = Math.floor(dias / 30);
      return `Hace ${meses} mes${meses > 1 ? 'es' : ''}`;
    } catch {
      return '';
    }
  }

}
