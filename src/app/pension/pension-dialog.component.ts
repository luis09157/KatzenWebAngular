import { Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { DefaultsPensionService } from '../finanzas/defaults-pension.service';
import {
  ESTADO_PENSION_LABELS,
  EstadoPension,
  PensionEstancia,
  TAMANOS_PENSION_ORDEN,
  TamanoMascotaPension,
} from './pension.models';
import { PaquetePensionOficial, paquetesPensionOficiales, sugerirTamanoPensionPorPeso } from './pension-tarifas.util';
import {
  AltaRapidaPickerDeps,
  crearClienteRapidoDesdePicker,
  crearMascotaRapidaDesdePicker,
} from '../shared/admin/alta-rapida-picker.helper';
import { ClientePacientePickerComponent } from '../shared/admin/cliente-paciente-picker.component';
import { ClientePacienteSelection } from '../shared/admin/cliente-paciente-picker.models';
import { Cliente } from '../core/models';
import { ClientesService } from '../clientes/clientes.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { normalizeCostoDiaPension, omitUndefinedRtdb } from './pension-estancia-payload.util';
import { PensionService } from './pension.service';
import { debeMostrarPickerAltaRapida } from '../alta-rapida/alta-rapida-prefill.util';

@Component({
  selector: 'app-pension-dialog',
  templateUrl: './pension-dialog.component.html',
  styleUrls: ['./pension-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PensionDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild(ClientePacientePickerComponent) picker?: ClientePacientePickerComponent;
  form: FormGroup;
  loading = false;
  esEdicion = false;

  readonly paquetes: PaquetePensionOficial[] = paquetesPensionOficiales();
  readonly tamanos = TAMANOS_PENSION_ORDEN;
  readonly estados: EstadoPension[] = ['reservada', 'activa', 'finalizada', 'cancelada'];
  readonly estadoLabels = ESTADO_PENSION_LABELS;

  get muestraPickerClientePaciente(): boolean {
    return debeMostrarPickerAltaRapida({
      esEdicion: this.esEdicion,
      paciente_id: this.data?.paciente_id,
    });
  }

  get paqueteSeleccionado(): PaquetePensionOficial | null {
    const t = this.form?.get('tamano_mascota')?.value as TamanoMascotaPension | '';
    if (!t) return null;
    return this.paquetes.find((p) => p.tamano === t) || null;
  }

  get diasEstimados(): number {
    return this.pensionService.calcularDias(
      this.form?.get('fecha_ingreso')?.value,
      this.form?.get('fecha_salida_prevista')?.value
    );
  }

  get precioDiaActual(): number {
    return Number(this.form?.get('precio_dia')?.value) || 0;
  }

  /** Siempre precio/día × días (fechas de arriba). */
  get resumenTotal(): number {
    return Math.round(this.precioDiaActual * this.diasEstimados * 100) / 100;
  }

  constructor(
    private fb: FormBuilder,
    private pensionService: PensionService,
    private defaultsPension: DefaultsPensionService,
    private dialogRef: MatDialogRef<PensionDialogComponent>,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    private clientesService: ClientesService,
    private pacientesService: PacientesService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      estancia?: PensionEstancia;
      paciente_id?: string;
      cliente_id?: string;
      paciente?: string;
      cliente?: string;
    }
  ) {
    this.form = this.fb.group({
      paciente: [''],
      paciente_id: ['', Validators.required],
      cliente: [''],
      cliente_id: ['', Validators.required],
      fecha_ingreso: ['', Validators.required],
      fecha_salida_prevista: [''],
      tamano_mascota: ['', Validators.required],
      // Internos: los pone el paquete; no se editan en UI.
      precio_dia: [null as number | null, [Validators.required, Validators.min(1)]],
      precio_total: [null as number | null],
      costo_dia: [null as number | null],
      estado: ['activa' as EstadoPension, Validators.required],
      notas: [''],
    });
  }

  ngOnInit(): void {
    const hoy = new Date();
    const iso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    if (this.data?.estancia?.id) {
      this.esEdicion = true;
      const e = this.data.estancia;
      this.form.patchValue({
        paciente: e.paciente || '',
        paciente_id: e.paciente_id || 'manual',
        cliente: e.cliente || '',
        cliente_id: e.cliente_id || 'manual',
        fecha_ingreso: e.fecha_ingreso,
        fecha_salida_prevista: e.fecha_salida_prevista || '',
        tamano_mascota: e.tamano_mascota || '',
        precio_dia: e.precio_dia > 0 ? e.precio_dia : null,
        precio_total: e.precio_total ?? null,
        costo_dia: e.costo_dia ?? null,
        estado: e.estado,
        notas: e.notas || '',
      });
      this.recalcularTotal();
    } else {
      this.form.patchValue({
        fecha_ingreso: iso,
        estado: 'activa',
        paciente_id: this.data?.paciente_id || '',
        cliente_id: this.data?.cliente_id || '',
        paciente: this.data?.paciente || '',
        cliente: this.data?.cliente || '',
      });
    }

    this.form
      .get('tamano_mascota')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((t: TamanoMascotaPension) => this.aplicarDefaultsTamano(t));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  elegirPaquete(tamano: TamanoMascotaPension): void {
    if (this.esEdicion && this.form.get('tamano_mascota')?.value === tamano) {
      return;
    }
    this.form.patchValue({ tamano_mascota: tamano });
    void this.aplicarDefaultsTamano(tamano);
  }

  private async aplicarDefaultsTamano(tamano: TamanoMascotaPension | ''): Promise<void> {
    if (!tamano) return;
    try {
      const defaults = await this.defaultsPension.getDefaultsOnce();
      const row = this.defaultsPension.defaultParaTamano(defaults, tamano);
      if (!row || !(row.precioDia > 0)) return;
      const patch: Record<string, unknown> = { precio_dia: row.precioDia };
      // Costo interno (margen): viene de Finanzas, no se muestra en el alta.
      if (row.costoDia != null && !this.esEdicion) {
        patch['costo_dia'] = row.costoDia;
      }
      this.form.patchValue(patch);
      this.recalcularTotal();
    } catch {
      /* defaults opcionales */
    }
  }

  recalcularTotal(): void {
    const precioDia = Number(this.form.get('precio_dia')?.value) || 0;
    const dias = this.diasEstimados;
    this.form.patchValue({ precio_total: Math.round(precioDia * dias * 100) / 100 }, { emitEvent: false });
  }

  private altaRapidaDeps(): AltaRapidaPickerDeps {
    return {
      dialog: this.dialog,
      clientesService: this.clientesService,
      pacientesService: this.pacientesService,
      loadingService: this.loadingService,
      errorMessages: this.errorMessages,
      picker: this.picker,
    };
  }

  async crearClienteRapido(prefill = ''): Promise<void> {
    if (this.esEdicion) return;
    await crearClienteRapidoDesdePicker(this.altaRapidaDeps(), prefill);
  }

  async crearMascotaRapida(cliente?: Cliente | null): Promise<void> {
    if (this.esEdicion) return;
    await crearMascotaRapidaDesdePicker(this.altaRapidaDeps(), cliente);
  }

  onClientePacienteSelected(sel: ClientePacienteSelection): void {
    const tamano = this.inferirTamanoMascota(sel.pacienteData);
    if (tamano && !this.esEdicion) {
      this.elegirPaquete(tamano);
    }
  }

  private inferirTamanoMascota(paciente: ClientePacienteSelection['pacienteData']): TamanoMascotaPension | '' {
    const raw = String(paciente?.['tamano_perro'] || paciente?.['tamano'] || '').toLowerCase();
    if (raw === 'pequeno' || raw === 'mediano' || raw === 'grande' || raw === 'gigante') {
      return raw as TamanoMascotaPension;
    }
    const peso = Number(paciente?.['peso'] ?? paciente?.['peso_kg'] ?? paciente?.['pesoKg']);
    return sugerirTamanoPensionPorPeso(peso);
  }

  async guardar(): Promise<void> {
    this.recalcularTotal();
    if (!this.form.get('tamano_mascota')?.value) {
      this.form.get('tamano_mascota')?.markAsTouched();
      Swal.fire('Elige un paquete', 'Selecciona cuánto se cobra por día.', 'info');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const raw = this.form.getRawValue();
      const precioDia = Number(raw.precio_dia) || 0;
      // RTDB no acepta undefined: omitir opcionales vacíos (costo interno, fechas, etc.).
      const payload = omitUndefinedRtdb({
        paciente_id: String(raw.paciente_id || '').trim(),
        paciente: String(raw.paciente || '').trim(),
        cliente_id: String(raw.cliente_id || '').trim(),
        cliente: String(raw.cliente || '').trim(),
        fecha_ingreso: raw.fecha_ingreso,
        fecha_salida_prevista: raw.fecha_salida_prevista || undefined,
        tamano_mascota: raw.tamano_mascota || undefined,
        precio_dia: precioDia,
        precio_total: this.resumenTotal,
        costo_dia: normalizeCostoDiaPension(raw.costo_dia),
        estado: raw.estado as EstadoPension,
        notas: raw.notas || '',
      });
      if (this.esEdicion && this.data.estancia?.id) {
        await this.pensionService.actualizarEstancia(this.data.estancia.id, payload);
      } else {
        await this.pensionService.crearEstancia(payload);
      }
      this.dialogRef.close(true);
      Swal.fire({
        icon: 'success',
        title: this.esEdicion ? 'Estancia actualizada' : 'Estancia registrada',
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar pensión'), 'error');
    } finally {
      this.loadingService.hide();
      this.loading = false;
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  formatMoney(n: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);
  }
}
