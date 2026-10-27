import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, merge, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { Cliente } from '../../core/models';
import { ClientesService } from '../../clientes/clientes.service';
import { CurrentStaffService } from '../../core/services/current-staff.service';
import { TarifasDomicilioService } from '../tarifas-domicilio.service';
import { DomicilioDatos } from '../domicilio.models';
import {
  CotizacionDomicilio,
  TarifasDomicilio,
  TipoDomicilio,
  cotizarDomicilio,
  gananciaDomicilio,
  kmDesdeTexto,
  tarifasDomicilioDefault,
} from '../domicilio-cotizacion.util';
import { direccionDeCliente } from '../domicilio-cliente.util';

/**
 * Cotizador de domicilio (spec 107) — el mismo en Nuevo baño, Citas y Cobrar.
 * Toma los km de la ficha del cliente, sugiere el precio y deja cambiarlo.
 * Emite `cambio` con los datos listos para guardar (o null si falta km).
 */
@Component({
  selector: 'app-domicilio-cotizador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  templateUrl: './domicilio-cotizador.component.html',
  styleUrls: ['./domicilio-cotizador.component.scss'],
})
export class DomicilioCotizadorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cliente: Cliente | null = null;
  /** Domicilio ya guardado (al editar). */
  @Input() valor: DomicilioDatos | null | undefined = null;
  @Input() disabled = false;
  @Output() cambio = new EventEmitter<DomicilioDatos | null>();

  private readonly destroy$ = new Subject<void>();
  tarifas: TarifasDomicilio = tarifasDomicilioDefault();
  tiposActivos: TipoDomicilio[] = this.tarifas.tipos;
  cotizacion: CotizacionDomicilio | null = null;

  readonly km = new FormControl<number | null>(null);
  readonly tipoId = new FormControl<string>('');
  readonly precio = new FormControl<number | null>(null);
  /** true cuando la veterinaria escribió su propio precio. */
  precioManual = false;
  guardandoKm = false;
  private staff = '';

  constructor(
    private tarifasService: TarifasDomicilioService,
    private clientesService: ClientesService,
    private currentStaff: CurrentStaffService
  ) {}

  async ngOnInit(): Promise<void> {
    merge(this.km.valueChanges, this.tipoId.valueChanges)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.recalcular());
    this.precio.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.emitir());
    try {
      this.staff = await this.currentStaff.getStaffLabel();
      this.tarifas = await this.tarifasService.getOnce();
    } catch {
      this.tarifas = tarifasDomicilioDefault();
    }
    this.tiposActivos = this.tarifas.tipos.filter((t) => t.activo !== false);
    this.inicializar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cliente'] && !changes['cliente'].firstChange && !this.valor) {
      this.km.setValue(this.kmFicha || null, { emitEvent: false });
      this.recalcular();
    }
    if (changes['disabled']) {
      const opts = { emitEvent: false };
      [this.km, this.tipoId, this.precio].forEach((c) => (this.disabled ? c.disable(opts) : c.enable(opts)));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private inicializar(): void {
    const v = this.valor;
    const tipoInicial =
      (v?.tipoId && this.tarifas.tipos.find((t) => t.id === v.tipoId)?.id) || this.tiposActivos[0]?.id || '';
    this.tipoId.setValue(tipoInicial, { emitEvent: false });
    this.km.setValue(v?.km || this.kmFicha || null, { emitEvent: false });
    if (v && Number(v.precio) >= 0 && v.precio !== v.precioSugerido) {
      this.precioManual = true;
      this.precio.setValue(v.precio, { emitEvent: false });
    }
    this.recalcular();
  }

  get kmFicha(): number {
    return kmDesdeTexto(this.cliente?.['kilometrosCasa']);
  }

  get direccion(): string {
    return direccionDeCliente(this.cliente).texto;
  }

  get linkMaps(): string {
    return String(this.cliente?.['urlGoogleMaps'] || '').trim();
  }

  get tipoSeleccionado(): TipoDomicilio | undefined {
    return this.tarifas.tipos.find((t) => t.id === this.tipoId.value);
  }

  /** Mostrar «Guardar km en su ficha» si escribió km distintos a los de la ficha. */
  get kmDistintoDeFicha(): boolean {
    const k = Number(this.km.value) || 0;
    return !!this.cliente?.id && k > 0 && Math.abs(k - this.kmFicha) > 0.001;
  }

  get ganancia(): number {
    return gananciaDomicilio(this.precio.value, this.cotizacion?.costoGasolina ?? 0);
  }

  private recalcular(): void {
    const tipo = this.tipoSeleccionado;
    const k = Number(this.km.value) || 0;
    this.cotizacion = tipo && k > 0 ? cotizarDomicilio(k, tipo, this.tarifas) : null;
    if (!this.precioManual) {
      this.precio.setValue(this.cotizacion ? this.cotizacion.precioSugerido : null, { emitEvent: false });
    }
    this.emitir();
  }

  onPrecioTecleado(): void {
    this.precioManual = true;
  }

  usarSugerido(): void {
    this.precioManual = false;
    this.recalcular();
  }

  private emitir(): void {
    const c = this.cotizacion;
    const tipo = this.tipoSeleccionado;
    const precio = Number(this.precio.value);
    if (!c || !tipo || !(precio >= 0) || this.precio.value === null) {
      this.cambio.emit(null);
      return;
    }
    const dir = direccionDeCliente(this.cliente);
    this.cambio.emit({
      km: c.km,
      tipoId: tipo.id,
      tipoNombre: tipo.nombre,
      recorridos: tipo.recorridos,
      precioLitro: this.tarifas.precioLitro,
      kmPorLitro: this.tarifas.kmPorLitro,
      margenPct: tipo.margenPct,
      costoGasolina: c.costoGasolina,
      precioSugerido: c.precioSugerido,
      precio: Math.round(precio * 100) / 100,
      ganancia: gananciaDomicilio(precio, c.costoGasolina),
      ...(dir.texto ? { direccion: dir.texto } : {}),
      ...(dir.colonia ? { colonia: dir.colonia } : {}),
      ...(dir.municipio ? { municipio: dir.municipio } : {}),
      ...(this.linkMaps ? { linkMaps: this.linkMaps } : {}),
      cotizadoEn: this.valor?.cotizadoEn || new Date().toISOString(),
      ...(this.staff ? { cotizadoPor: this.valor?.cotizadoPor || this.staff } : {}),
    });
  }

  /** Solo cambia `kilometrosCasa` del cliente (número, como lo guarda la app). */
  async guardarKmEnFicha(): Promise<void> {
    const id = this.cliente?.id;
    const k = Number(this.km.value) || 0;
    if (!id || !(k > 0)) return;
    this.guardandoKm = true;
    try {
      await this.clientesService.actualizarCliente(id, { kilometrosCasa: k } as never);
      if (this.cliente) this.cliente = { ...this.cliente, kilometrosCasa: k };
      Swal.fire({ icon: 'success', title: 'Km guardados en su ficha', timer: 1400, showConfirmButton: false });
    } catch {
      Swal.fire('No se pudo guardar', 'Intenta de nuevo o guárdalo desde Clientes.', 'error');
    } finally {
      this.guardandoKm = false;
    }
  }
}
