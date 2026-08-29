import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  DISCLAIMER_ESQUEMA,
  claseBadgeCategoria,
  etiquetaCategoria,
  fusionarSemanticaTipo
} from './esquema-vacuna.defaults';
import {
  ConfirmacionEsquemaResultado,
  HintEsquema,
  SugerenciaEsquema
} from './esquema-vacuna.models';
import {
  addDaysLocal,
  aplicarHoraAFecha,
  extraerHoraHhMm,
  hintIntervaloCortoSiAplica,
  horaDefaultRecordatorio,
  esProximaResidualSerieCanina,
  resolverIntervaloConfirmacion
} from './esquema-vacuna.util';
import { parseFechaFlexible, dayKeyLocal } from './vacuna-recordatorio.util';

export interface VacunaEsquemaConfirmData {
  sugerencia: SugerenciaEsquema;
  nombreVacuna: string;
  nombrePaciente: string;
  especie?: string;
  fechaAplicacion?: Date | string | null;
  intervaloActual?: number | null;
  proximaActual?: Date | string | null;
  horaActual?: string | null;
  tipoVacuna?: string | null;
  fallecido?: boolean;
}

@Component({
  selector: 'app-vacuna-esquema-confirm-dialog',
  templateUrl: './vacuna-esquema-confirm-dialog.component.html',
  styleUrls: ['./vacuna-esquema-confirm-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VacunaEsquemaConfirmDialogComponent {
  readonly disclaimer = DISCLAIMER_ESQUEMA;
  readonly form: FormGroup;
  editando = true;
  submitting = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<
      VacunaEsquemaConfirmDialogComponent,
      ConfirmacionEsquemaResultado | undefined
    >,
    @Inject(MAT_DIALOG_DATA) public data: VacunaEsquemaConfirmData
  ) {
    const s = data.sugerencia;
    const intervalo = resolverIntervaloConfirmacion({
      especie: data.especie || s.especieNormalizada,
      intervaloActual: data.intervaloActual,
      intervaloSugeridoDias: s.intervaloSugeridoDias,
      puedeSugerir: s.puedeSugerir
    });
    const residualCanina = esProximaResidualSerieCanina({
      especie: data.especie || s.especieNormalizada,
      intervaloActual: data.intervaloActual,
      puedeSugerir: s.puedeSugerir
    });
    const proxima = residualCanina
      ? null
      : parseFechaFlexible(data.proximaActual) || s.proximaSugerida || null;
    const hora =
      data.horaActual || extraerHoraHhMm(data.proximaActual) || horaDefaultRecordatorio();

    this.form = this.fb.group({
      fecha: [proxima],
      hora: [hora, Validators.required],
      intervalo: [intervalo && intervalo > 0 ? intervalo : null]
    });

    this.form.get('intervalo')?.valueChanges.subscribe(val => {
      const dias = Number(val);
      const base = parseFechaFlexible(this.data.fechaAplicacion);
      if (!base || !Number.isFinite(dias) || dias <= 0) return;
      this.form.patchValue({ fecha: addDaysLocal(base, dias) }, { emitEvent: false });
    });
  }

  get sugerencia(): SugerenciaEsquema {
    return this.data.sugerencia;
  }

  get etiquetaCat(): string {
    return etiquetaCategoria(this.sugerencia.categoria);
  }

  get textoAyudaFecha(): string {
    const especie = this.sugerencia.especieNormalizada;
    if (especie === 'CONEJO') {
      return 'Intervalo 100 % manual: no proponemos los 21 días de la serie del perro ni kits europeos. Si agendás, un intervalo típico es 365 días.';
    }
    if (especie === 'HURON' && !this.sugerencia.puedeSugerir) {
      return 'Sin esquema sugerido. No uses combo canino off-label. Indica intervalo o no agendar.';
    }
    if (!this.sugerencia.puedeSugerir) {
      return this.sugerencia.mensajeSinEsquema || 'Sin esquema sugerido. Indica intervalo o no agendar.';
    }
    return 'Confirma la sugerencia o cámbiala aquí mismo. Sin confirmar no se crea recordatorio.';
  }

  get claseCat(): string {
    return claseBadgeCategoria(this.sugerencia.categoria);
  }

  get hintsVisibles(): HintEsquema[] {
    const extra = this.hintIntervaloEditado;
    const list = this.sugerencia.hints.filter(h => h.key !== 'disclaimer');
    return extra ? [...list, extra] : list;
  }

  get hintIntervaloEditado(): HintEsquema | null {
    const dias = Number(this.form.get('intervalo')?.value);
    const sem = fusionarSemanticaTipo(this.data.tipoVacuna);
    return hintIntervaloCortoSiAplica(dias, sem);
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
    this.editando = true;
  }

  cambiar(): void {
    this.editando = true;
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
      this.cambiar();
      return;
    }
    this.submitting = true;
    this.dialogRef.close(this.payload(true));
  }

  cancelar(): void {
    this.dialogRef.close(undefined);
  }

  private payload(agendar: boolean): ConfirmacionEsquemaResultado {
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
      etapaEsquema: this.sugerencia.etapaEsquema,
      hintsMostrados: this.hintsVisibles.map(h => h.key)
    };
  }
}
