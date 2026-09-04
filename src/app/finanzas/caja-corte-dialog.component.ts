import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { CajaMovimiento } from './caja.models';
import { CajaService } from './caja.service';
import { calcularCorteCaja, efectivoNetoDelDia } from './caja-corte.util';

@Component({
  selector: 'app-caja-corte-dialog',
  templateUrl: './caja-corte-dialog.component.html'
})
export class CajaCorteDialogComponent implements OnInit {
  form: FormGroup;
  loading = false;
  esperado = 0;
  diferencia = 0;
  cuadrado = false;

  constructor(
    private fb: FormBuilder,
    private caja: CajaService,
    private loadingService: LoadingService,
    private errorMessages: ErrorMessagesService,
    private dialogRef: MatDialogRef<CajaCorteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { fecha: string; movimientos: CajaMovimiento[] }
  ) {
    const fecha = data?.fecha || this.caja.hoyLocalIsoDate();
    const neto = efectivoNetoDelDia(data?.movimientos || [], fecha);
    this.form = this.fb.group({
      fecha: [fecha, Validators.required],
      fondoInicial: [0, [Validators.required, Validators.min(0)]],
      efectivoContado: [null, [Validators.required, Validators.min(0)]],
      notas: ['']
    });
    this.recalc(neto.ingresos, neto.egresos);
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.recalcFromForm());
  }

  get ingresosEfectivo(): number {
    return efectivoNetoDelDia(this.data?.movimientos || [], this.form.get('fecha')?.value).ingresos;
  }

  get egresosEfectivo(): number {
    return efectivoNetoDelDia(this.data?.movimientos || [], this.form.get('fecha')?.value).egresos;
  }

  private recalcFromForm(): void {
    this.recalc(this.ingresosEfectivo, this.egresosEfectivo);
  }

  private recalc(ingresos: number, egresos: number): void {
    const r = calcularCorteCaja({
      fondoInicial: Number(this.form.get('fondoInicial')?.value) || 0,
      ingresosEfectivo: ingresos,
      egresosEfectivo: egresos,
      efectivoContado: Number(this.form.get('efectivoContado')?.value) || 0
    });
    this.esperado = r.esperado;
    this.diferencia = r.diferencia;
    this.cuadrado = r.cuadrado;
  }

  formatMoney(n: number): string {
    return `$${(Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const v = this.form.getRawValue();
      await this.caja.guardarCorte({
        fecha: v.fecha,
        fondoInicial: Number(v.fondoInicial) || 0,
        ingresosEfectivo: this.ingresosEfectivo,
        egresosEfectivo: this.egresosEfectivo,
        esperado: this.esperado,
        efectivoContado: Number(v.efectivoContado) || 0,
        diferencia: this.diferencia,
        cuadrado: this.cuadrado,
        notas: String(v.notas || '').trim() || undefined
      });
      Swal.fire({
        icon: this.cuadrado ? 'success' : 'info',
        title: this.cuadrado ? 'Caja cuadrada' : 'Corte guardado',
        text: this.cuadrado ? 'El efectivo coincide con lo esperado.' : `Diferencia ${this.formatMoney(this.diferencia)}.`,
        timer: 2200,
        showConfirmButton: false
      });
      this.dialogRef.close({ saved: true });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar corte de caja'), 'error');
    } finally {
      this.loading = false;
      this.loadingService.hide();
    }
  }
}
