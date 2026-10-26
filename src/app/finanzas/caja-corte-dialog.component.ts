import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { formatMoneyMx } from '../core/utils/periodo-filtro.util';
import { CajaCorte, CajaMovimiento } from './caja.models';
import { CajaService } from './caja.service';
import {
  calcularCorteCaja,
  cortesDelDia,
  efectivoNeto,
  fondoParaCorte,
  fondoSiguienteTrasRetiro,
  movimientosPendientesDeCorte,
} from './caja-corte.util';

/**
 * Corte de caja (064/071) — mejoras 2026-10-26:
 * - Guarda con Notas vacías (antes Firebase rechazaba `notas: undefined`).
 * - Día sin ventas: contado 0 cuadra y se guarda.
 * - Si el día ya tiene corte → corte complementario de lo cobrado después.
 * - Retiro de efectivo: lo que queda es el fondo del siguiente corte.
 * - La diferencia se muestra hasta que se escribe lo contado.
 */
@Component({
  selector: 'app-caja-corte-dialog',
  templateUrl: './caja-corte-dialog.component.html',
  styleUrls: ['./caja-corte-dialog.component.scss'],
})
export class CajaCorteDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  form: FormGroup;
  loading = false;
  cargandoDia = false;
  esperado = 0;
  diferencia = 0;
  cuadrado = false;
  ingresosEfectivo = 0;
  egresosEfectivo = 0;
  /** Movimientos (todos los métodos) que entran en este corte. */
  movimientosDelCorte = 0;
  /** Cortes ya guardados ese día (si hay → complementario). */
  cortesPrevios: CajaCorte[] = [];
  private cortes: CajaCorte[] = [];

  constructor(
    private fb: FormBuilder,
    private caja: CajaService,
    private loadingService: LoadingService,
    private errorMessages: ErrorMessagesService,
    private dialogRef: MatDialogRef<CajaCorteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { fecha: string; movimientos: CajaMovimiento[]; fondoInicial?: number }
  ) {
    const fecha = data?.fecha || this.caja.hoyLocalIsoDate();
    this.form = this.fb.group({
      fecha: [fecha, Validators.required],
      fondoInicial: [Number(data?.fondoInicial) || 0, [Validators.required, Validators.min(0)]],
      efectivoContado: [null, [Validators.required, Validators.min(0)]],
      retiroEfectivo: [0, [Validators.min(0)]],
      notas: [''],
    });
  }

  ngOnInit(): void {
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.recalc());
    this.form
      .get('fecha')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => void this.cargarDia());
    void this.cargarDia();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get fecha(): string {
    return String(this.form.get('fecha')?.value || this.caja.hoyLocalIsoDate()).slice(0, 10);
  }

  get complementario(): boolean {
    return this.cortesPrevios.length > 0;
  }

  get ultimoCortePrevio(): CajaCorte | null {
    return this.cortesPrevios.length ? this.cortesPrevios[this.cortesPrevios.length - 1] : null;
  }

  /** Hasta escribir lo contado no se muestra «cuadrada» ni diferencia. */
  get contadoCapturado(): boolean {
    const v = this.form.get('efectivoContado')?.value;
    return v !== null && v !== '' && v !== undefined && !Number.isNaN(Number(v));
  }

  get fondoSiguiente(): number {
    return fondoSiguienteTrasRetiro(
      Number(this.form.get('efectivoContado')?.value) || 0,
      Number(this.form.get('retiroEfectivo')?.value) || 0
    );
  }

  get retiroMayorQueContado(): boolean {
    return (Number(this.form.get('retiroEfectivo')?.value) || 0) > (Number(this.form.get('efectivoContado')?.value) || 0);
  }

  /** Complementario sin nada nuevo que contar: no tiene caso guardar. */
  get sinNadaQueCortar(): boolean {
    return this.complementario && this.movimientosDelCorte === 0;
  }

  horaCorte(c: CajaCorte | null): string {
    if (!c?.createdAt) return '';
    const d = new Date(c.createdAt);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  private async cargarDia(): Promise<void> {
    const fecha = this.fecha;
    this.cargandoDia = true;
    try {
      const [turno, cortes] = await Promise.all([this.caja.getTurnoOnce(fecha), this.caja.getCortesOnce()]);
      this.cortes = cortes || [];
      this.cortesPrevios = cortesDelDia(this.cortes, fecha);
      const fondo = fondoParaCorte(this.cortes, fecha, turno?.fondoInicial ?? (Number(this.data?.fondoInicial) || null));
      this.form.patchValue({ fondoInicial: fondo }, { emitEvent: false });
      this.form.get('fondoInicial')?.markAsPristine();
    } catch {
      this.cortesPrevios = [];
    } finally {
      this.cargandoDia = false;
      this.recalc();
    }
  }

  private recalc(): void {
    const pendientes = movimientosPendientesDeCorte(this.data?.movimientos || [], this.cortes, this.fecha);
    this.movimientosDelCorte = pendientes.length;
    const neto = efectivoNeto(pendientes);
    this.ingresosEfectivo = neto.ingresos;
    this.egresosEfectivo = neto.egresos;
    const r = calcularCorteCaja({
      fondoInicial: Number(this.form.get('fondoInicial')?.value) || 0,
      ingresosEfectivo: neto.ingresos,
      egresosEfectivo: neto.egresos,
      efectivoContado: Number(this.form.get('efectivoContado')?.value) || 0,
    });
    this.esperado = r.esperado;
    this.diferencia = r.diferencia;
    this.cuadrado = r.cuadrado;
  }

  formatMoney(n: number): string {
    return formatMoneyMx(n, 2);
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  async guardar(): Promise<void> {
    if (this.form.invalid || this.retiroMayorQueContado) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.sinNadaQueCortar) {
      Swal.fire('Sin cobros nuevos', 'No hay cobros después del último corte de este día.', 'info');
      return;
    }
    this.recalc();
    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const v = this.form.getRawValue();
      const retiro = Number(v.retiroEfectivo) || 0;
      const previo = this.ultimoCortePrevio;
      await this.caja.guardarCorte({
        fecha: this.fecha,
        fondoInicial: Number(v.fondoInicial) || 0,
        ingresosEfectivo: this.ingresosEfectivo,
        egresosEfectivo: this.egresosEfectivo,
        esperado: this.esperado,
        efectivoContado: Number(v.efectivoContado) || 0,
        diferencia: this.diferencia,
        cuadrado: this.cuadrado,
        notas: String(v.notas || '').trim() || undefined,
        retiroEfectivo: retiro > 0 ? retiro : undefined,
        fondoSiguiente: this.fondoSiguiente,
        complementario: previo ? true : undefined,
        desdeCreatedAt: previo?.createdAt || undefined,
      });
      Swal.fire({
        icon: this.cuadrado ? 'success' : 'info',
        title: this.cuadrado ? 'Caja cuadrada' : 'Corte guardado',
        text: this.cuadrado
          ? `Quedan ${this.formatMoney(this.fondoSiguiente)} en caja para el siguiente turno.`
          : `Diferencia ${this.formatMoney(this.diferencia)}. Quedan ${this.formatMoney(this.fondoSiguiente)} en caja.`,
        timer: 2600,
        showConfirmButton: false,
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
