import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  DISCLAIMER_DESPARASITACION,
  claseBadgeTipo,
  etiquetaTipoDesparasitacion
} from './esquema-desparasitacion.defaults';
import {
  ConfirmacionDesparasitacionResultado,
  HintDesparasitacion,
  SugerenciaDesparasitacion,
  TipoDesparasitacion
} from './esquema-desparasitacion.models';
import {
  addDaysLocal,
  aplicarHoraAFecha,
  extraerHoraHhMm,
  horaDefaultRecordatorio
} from '../vacunas/esquema-vacuna.util';
import { parseFechaFlexible, dayKeyLocal } from '../vacunas/vacuna-recordatorio.util';

export interface DesparasitacionEsquemaConfirmData {
  sugerencia: SugerenciaDesparasitacion;
  nombrePaciente: string;
  tipo: TipoDesparasitacion;
  especie?: string;
  fechaAplicacion?: Date | string | null;
  horaActual?: string | null;
  fallecido?: boolean;
}

@Component({
  selector: 'app-desparasitacion-esquema-confirm-dialog',
  templateUrl: './desparasitacion-esquema-confirm-dialog.component.html',
  styleUrls: ['./desparasitacion-esquema-confirm-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DesparasitacionEsquemaConfirmDialogComponent {
  readonly disclaimer = DISCLAIMER_DESPARASITACION;
  readonly form: FormGroup;
  submitting = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<
      DesparasitacionEsquemaConfirmDialogComponent,
      ConfirmacionDesparasitacionResultado | undefined
    >,
    @Inject(MAT_DIALOG_DATA) public data: DesparasitacionEsquemaConfirmData
  ) {
    const s = data.sugerencia;
    const intervalo = s.intervaloSugeridoDias && s.intervaloSugeridoDias > 0
      ? s.intervaloSugeridoDias
      : null;
    const proxima = parseFechaFlexible(s.proximaSugerida) || null;
    const hora = data.horaActual || extraerHoraHhMm(s.proximaSugerida) || horaDefaultRecordatorio();

    this.form = this.fb.group({
      fecha: [proxima],
      hora: [hora, Validators.required],
      intervalo: [intervalo]
    });

    this.form.get('intervalo')?.valueChanges.subscribe(val => {
      const dias = Number(val);
      const base = parseFechaFlexible(this.data.fechaAplicacion) || new Date();
      if (!Number.isFinite(dias) || dias <= 0) return;
      this.form.patchValue({ fecha: addDaysLocal(base, dias) }, { emitEvent: false });
    });
  }

  get sugerencia(): SugerenciaDesparasitacion {
    return this.data.sugerencia;
  }

  get etiquetaTipo(): string {
    return etiquetaTipoDesparasitacion(this.data.tipo);
  }

  get claseTipo(): string {
    return claseBadgeTipo(this.data.tipo);
  }

  get hintsVisibles(): HintDesparasitacion[] {
    return this.sugerencia.hints.filter(h => h.key !== 'disclaimer');
  }

  get fallecido(): boolean {
    return !!this.data.fallecido;
  }

  get puedeConfirmarAgenda(): boolean {
    if (this.fallecido) return false;
    return !!this.form.get('fecha')?.value && !!this.form.get('hora')?.value;
  }

  aplicarPreset(dias: number): void {
    this.form.patchValue({ intervalo: dias });
  }

  noAgendar(): void {
    if (this.submitting) return;
    this.submitting = true;
    this.dialogRef.close(this.payload(false));
  }

  confirmar(): void {
    if (this.submitting) return;
    if (this.fallecido) {
      this.noAgendar();
      return;
    }
    if (!this.puedeConfirmarAgenda) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.dialogRef.close(this.payload(true));
  }

  cancelar(): void {
    this.dialogRef.close(undefined);
  }

  labelPreset(dias: number): string {
    if (dias === 14) return '14 días';
    if (dias === 21) return '21 días';
    if (dias === 30) return '1 mes';
    if (dias === 90) return '3 meses';
    if (dias === 365) return '1 año';
    return `${dias} días`;
  }

  private payload(agendar: boolean): ConfirmacionDesparasitacionResultado {
    const fechaRaw = this.form.get('fecha')?.value as Date | string | null;
    const hora = String(this.form.get('hora')?.value || horaDefaultRecordatorio());
    const parsed = parseFechaFlexible(fechaRaw);
    const fecha = parsed ? aplicarHoraAFecha(parsed, hora) : null;
    const intervalo = Number(this.form.get('intervalo')?.value) || null;
    return {
      agendar,
      fecha,
      hora,
      intervaloDias: intervalo,
      intervaloSugeridoDias: this.sugerencia.intervaloSugeridoDias,
      proximaSugerida: this.sugerencia.proximaSugerida
        ? dayKeyLocal(this.sugerencia.proximaSugerida)
        : null,
      esquemaCodigo: this.sugerencia.esquemaCodigo,
      tipoDesparasitacion: this.data.tipo,
      hintsMostrados: this.hintsVisibles.map(h => h.key)
    };
  }
}
