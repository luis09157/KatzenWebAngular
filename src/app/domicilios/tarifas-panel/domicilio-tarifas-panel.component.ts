import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { TarifasDomicilioService } from '../tarifas-domicilio.service';
import {
  RedondeoDomicilio,
  TarifasDomicilio,
  TipoDomicilio,
  cotizarDomicilio,
  tarifasDomicilioDefault,
} from '../domicilio-cotizacion.util';

/** Finanzas → Precios y costos → Domicilios (spec 107). */
@Component({
  selector: 'app-domicilio-tarifas-panel',
  templateUrl: './domicilio-tarifas-panel.component.html',
  styleUrls: ['./domicilio-tarifas-panel.component.scss'],
})
export class DomicilioTarifasPanelComponent implements OnInit {
  @Input() puedeEditar = true;

  form: FormGroup;
  cargando = true;
  guardando = false;
  /** Km del ejemplo en vivo. */
  kmEjemplo = 3;

  readonly redondeos: Array<{ id: RedondeoDomicilio; label: string }> = [
    { id: 'peso', label: 'Subir al peso ($24.40 → $25)' },
    { id: 'cinco', label: 'Subir a múltiplo de $5 ($40.66 → $45)' },
    { id: 'centavos', label: 'Sin redondear, como la app ($24.40)' },
  ];

  constructor(
    private fb: FormBuilder,
    private tarifas: TarifasDomicilioService,
    private errorMessages: ErrorMessagesService
  ) {
    this.form = this.construir(tarifasDomicilioDefault());
  }

  async ngOnInit(): Promise<void> {
    try {
      this.form = this.construir(await this.tarifas.getOnce());
    } catch {
      /* se queda con los valores de la app */
    } finally {
      this.cargando = false;
      if (!this.puedeEditar) this.form.disable();
    }
  }

  get tiposArray(): FormArray {
    return this.form.get('tipos') as FormArray;
  }

  private construir(t: TarifasDomicilio): FormGroup {
    return this.fb.group({
      precioLitro: [t.precioLitro, [Validators.required, Validators.min(0.01)]],
      kmPorLitro: [t.kmPorLitro, [Validators.required, Validators.min(0.1)]],
      redondeo: [t.redondeo, Validators.required],
      tipos: this.fb.array(
        t.tipos.map((x) =>
          this.fb.group({
            id: [x.id],
            nombreApp: [x.nombreApp || ''],
            nombre: [x.nombre, [Validators.required, Validators.maxLength(60)]],
            recorridos: [x.recorridos, [Validators.required, Validators.min(1), Validators.max(20)]],
            // Se muestra como múltiplo («cobrar la gasolina ×1.66»); se guarda como % (66).
            multiplo: [this.aMultiplo(x.margenPct), [Validators.required, Validators.min(1), Validators.max(11)]],
            activo: [x.activo !== false],
          })
        )
      ),
    });
  }

  private valorActual(): TarifasDomicilio {
    const v = this.form.getRawValue();
    return {
      precioLitro: Number(v.precioLitro) || 0,
      kmPorLitro: Number(v.kmPorLitro) || 0,
      redondeo: v.redondeo,
      tipos: (v.tipos as Array<TipoDomicilio & { multiplo: number }>).map(({ multiplo, ...x }) => ({
        ...x,
        recorridos: Number(x.recorridos) || 1,
        margenPct: this.aPct(multiplo),
        nombreApp: x.nombreApp || undefined,
      })),
    };
  }

  /** 66 % → 1.66 */
  private aMultiplo(pct: number): number {
    return Math.round((1 + (Number(pct) || 0) / 100) * 100) / 100;
  }

  /** 1.66 → 66 % */
  private aPct(multiplo: unknown): number {
    const m = Number(multiplo);
    return Number.isFinite(m) && m >= 1 ? Math.round((m - 1) * 10000) / 100 : 0;
  }

  /** «3 km → gasolina $14.70 → cobras $25» para cada tipo. */
  ejemplo(i: number): string {
    const t = this.valorActual();
    const tipo = t.tipos[i];
    if (!tipo || !(t.precioLitro > 0) || !(t.kmPorLitro > 0)) return '';
    const c = cotizarDomicilio(this.kmEjemplo, tipo, t);
    return `${this.kmEjemplo} km → gasolina $${c.costoGasolina.toFixed(2)} → sugiere $${c.precioSugerido.toFixed(2)}`;
  }

  /** «1.66 = ganas 66 % sobre la gasolina». */
  hintMultiplo(i: number): string {
    const m = Number(this.tiposArray.at(i)?.get('multiplo')?.value);
    if (!Number.isFinite(m) || m < 1) return 'Mínimo ×1 (sin ganancia)';
    return m === 1 ? 'Sin ganancia: solo la gasolina' : `Ganas ${this.aPct(m)} % sobre la gasolina`;
  }

  agregarTipo(): void {
    this.tiposArray.push(
      this.fb.group({
        id: [`tipo_${Date.now().toString(36)}`],
        nombreApp: [''],
        nombre: ['', [Validators.required, Validators.maxLength(60)]],
        recorridos: [2, [Validators.required, Validators.min(1), Validators.max(20)]],
        multiplo: [1.66, [Validators.required, Validators.min(1), Validators.max(11)]],
        activo: [true],
      })
    );
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire('Revisa los datos', 'Hay un campo vacío o fuera de rango.', 'warning');
      return;
    }
    this.guardando = true;
    try {
      await this.tarifas.guardar(this.valorActual());
      Swal.fire({ icon: 'success', title: 'Tarifas de domicilio guardadas', timer: 1600, showConfirmButton: false });
      this.form.markAsPristine();
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar tarifas de domicilio'), 'error');
    } finally {
      this.guardando = false;
    }
  }
}
