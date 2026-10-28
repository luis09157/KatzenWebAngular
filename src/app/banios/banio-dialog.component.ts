import { Component, OnInit, Inject, ViewEncapsulation, inject, Injector, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { BaniosService } from './banios.service';
import { BaniosPacienteService } from '../pacientes/banios-paciente.service';
import { Banio } from '../shared/banio.model';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { DefaultsBanioService } from '../finanzas/defaults-banio.service';
import {
  DefaultsBanioPorTamano,
  TAMANO_PERRO_LABELS,
  TAMANOS_PERRO_ORDEN,
  TamanoPerroBanio,
  emptyDefaultsBanio,
} from '../finanzas/defaults-banio.models';
import { PlantillaCostoService } from '../finanzas/plantilla-costo.service';
import { PlantillaCosto } from '../finanzas/plantilla-costo.models';
import { resolverPrefillBanioPorTamano } from '../finanzas/banio-prefill.util';
import { TarifasPeluqueriaService } from '../finanzas/tarifas-peluqueria.service';
import { BanioConPrecio, PrecioAnteriorBanio, precioAnteriorBanio } from './banio-precio-anterior.util';
import { formatearFechaLocalEs } from '../shared/datepicker/datepicker.util';
import {
  FILAS_TARIFA_PELUQUERIA,
  FILA_TARIFA_PELUQUERIA_LABELS,
  FilaTarifaPeluqueria,
  PeloMascota,
  TarifasPeluqueria,
  filaTarifaPara,
  hayTarifasPeluqueria,
  precioTarifaPeluqueria,
  tarifasPeluqueriaVacias,
} from '../finanzas/tarifas-peluqueria.util';
import { ClientePacienteSelection } from '../shared/admin/cliente-paciente-picker.models';
import { StaffPickerFields } from '../shared/admin/staff-picker.models';
import { normalizeAlergias } from '../shared/alergias/alergias.util';
import { PacientesService } from '../pacientes/pacientes.service';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { ClientesService } from '../clientes/clientes.service';
import { Cliente } from '../core/models';
import { DomicilioDatos } from '../domicilios/domicilio.models';
import { abrirDomicilioDialog } from '../domicilios/domicilio-dialog.launcher';
import { prefillCapturaRapidaBanio } from './banio-captura-rapida.util';
import { ClientePacientePickerComponent } from '../shared/admin/cliente-paciente-picker.component';
import { MascotaDelDueno, datosBanioMascotaExtra, otrasMascotasDelDueno } from './banio-varias-mascotas.util';

interface DatosMascotaExtra {
  /** Vacío = los mismos servicios que la principal. El primero es el principal del baño. */
  servicios: string[];
  tamano: string;
  precio: number | null;
  precioManual: boolean;
  nota: string;
  ultimo: PrecioAnteriorBanio | null;
  banios: BanioConPrecio[];
}
import {
  serviciosExtraDeBanio,
  buscarOpcionTipoServicioBanio,
  opcionesTipoServicioAlta,
  tipoServicioPerteneceAlModo,
} from './banio-tipos-servicio.util';
import { debeMostrarPickerAltaRapida } from '../alta-rapida/alta-rapida-prefill.util';
import { formatLocalDateToIso, parseIsoDateToLocalDate } from '../shared/datepicker/datepicker.util';

@Component({
  selector: 'app-banio-dialog',
  templateUrl: './banio-dialog.component.html',
  styleUrls: ['./banio-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-MX' }],
})
export class BanioDialogComponent implements OnInit {
  banioForm: FormGroup;
  loading = false;
  esEdicion = false;
  hidePatientInfo = false; // Flag para ocultar campos de paciente/cliente
  /** Spec 085 A — captura rápida por defecto en alta; edición abre completo. */
  modoRapido = true;
  masDetallesAbiertos = false;
  iniciarYa = false;
  defaultsBanio: DefaultsBanioPorTamano = emptyDefaultsBanio();
  plantillasCosto: PlantillaCosto[] = [];
  /** Spec 034 — alergias canónicas desde Mascota (editor + alerta). */
  alergiasPaciente: string[] = [];
  /** Hint cuando no hay defaults ni plantilla (spec 031). */
  prefillHint = '';
  private defaultsListos = false;
  readonly tamanos = TAMANOS_PERRO_ORDEN;
  readonly tamanoLabels = TAMANO_PERRO_LABELS;
  readonly staffPickerFields: StaffPickerFields = {
    uidField: 'peluquero_id',
    nombreField: 'peluquero',
  };
  /** Si el usuario editó precio_total manualmente, no pisarlo al cambiar tamaño. */
  private precioTotalManual = false;

  /** Tarifas de peluquería (Finanzas) — tamaño × pelo × con corte, y gato (2026-10-26). */
  tarifasPelu: TarifasPeluqueria = tarifasPeluqueriaVacias();
  readonly filasTarifa = FILAS_TARIFA_PELUQUERIA;
  readonly filaTarifaLabels = FILA_TARIFA_PELUQUERIA_LABELS;
  /** Tamaño elegido en los chips (Gato incluido). */
  filaTarifa: FilaTarifaPeluqueria | null = null;
  pelo: PeloMascota = 'corto';
  private especiePaciente = '';
  /** Baños anteriores de la mascota para sugerir el último precio (2026-10-26). */
  private baniosMascota: BanioConPrecio[] = [];
  precioAnterior: PrecioAnteriorBanio | null = null;

  /** 2026-10-27 — mismo dueño trae varias mascotas: un baño por cada una. */
  @ViewChild(ClientePacientePickerComponent) private picker?: ClientePacientePickerComponent;
  mascotasExtra = new Set<string>();
  private clienteDeExtras = '';

  /** Las demás mascotas del dueño elegido (solo al crear). */
  get otrasMascotas(): MascotaDelDueno[] {
    if (this.esEdicion || this.hidePatientInfo) return [];
    const clienteId = String(this.banioForm.get('cliente_id')?.value || '');
    const pacienteId = String(this.banioForm.get('paciente_id')?.value || '');
    if (!clienteId || !pacienteId) return [];
    // Con buscador: las mascotas que ya cargó. Desde «Llegó un paciente» (sin buscador): las del dueño.
    const fuente = this.muestraPickerClientePaciente
      ? (this.picker?.pacientesDelCliente as any[]) || []
      : this.mascotasClienteResumen;
    return otrasMascotasDelDueno(fuente, pacienteId);
  }

  /**
   * 2026-10-28 — cada mascota extra es su propia tarjeta: servicio, tamaño (si su ficha no tiene),
   * precio opcional (sugiere el último que se le cobró) y nota. Fecha, hora, pagado y domicilio son de todos.
   */
  datosExtra = new Map<string, DatosMascotaExtra>();
  /** Mascotas del dueño cuando el diálogo viene sin buscador («Llegó un paciente» / expediente). */
  private mascotasClienteResumen: any[] = [];

  extra(id: string): DatosMascotaExtra {
    let d = this.datosExtra.get(id);
    if (!d) {
      d = { servicios: [], tamano: '', precio: null, precioManual: false, nota: '', ultimo: null, banios: [] };
      this.datosExtra.set(id, d);
    }
    return d;
  }

  /** 2026-10-28 — servicios de la principal: el del formulario + `servicios_adicionales` (uno o varios). */
  get serviciosPrincipal(): string[] {
    const t = String(this.banioForm.get('tipo_servicio')?.value || '');
    return [t, ...serviciosExtraDeBanio(this.banioForm.value)].filter(Boolean);
  }

  servicioPrincipalElegido(valor: string): boolean {
    return this.serviciosPrincipal.includes(valor);
  }

  /** Toca para agregar o quitar. El primero que se elige es el principal (el que manda el precio sugerido). */
  toggleServicioPrincipal(valor: string): void {
    const t = String(this.banioForm.get('tipo_servicio')?.value || '');
    const ad = [...((this.banioForm.get('servicios_adicionales')?.value as any[]) || [])];
    if (!t) {
      this.elegirTipoServicio(valor);
      return;
    }
    if (valor === t) {
      const i = ad.findIndex((s) => s?.servicio && s.servicio !== 'otro' && buscarOpcionTipoServicioBanio(s.servicio));
      if (i >= 0) {
        const [siguiente] = ad.splice(i, 1);
        this.banioForm.patchValue({ servicios_adicionales: ad });
        this.elegirTipoServicio(String(siguiente.servicio));
      } else {
        this.banioForm.patchValue({ tipo_servicio: '' });
      }
      return;
    }
    const i = ad.findIndex((s) => s?.servicio === valor);
    if (i >= 0) ad.splice(i, 1);
    else ad.push({ servicio: valor, precio: 0 });
    this.banioForm.patchValue({ servicios_adicionales: ad });
  }

  /** Servicios de la mascota extra; si no se eligieron, los de la principal. */
  serviciosDeExtra(id: string): string[] {
    const propios = this.datosExtra.get(id)?.servicios || [];
    return propios.length ? propios : this.serviciosPrincipal;
  }

  /** Servicio principal de la extra (el primero). */
  servicioDeExtra(id: string): string {
    return this.serviciosDeExtra(id)[0] || '';
  }

  servicioExtraElegido(id: string, valor: string): boolean {
    return this.serviciosDeExtra(id).includes(valor);
  }

  toggleServicioExtra(id: string, valor: string): void {
    const d = this.extra(id);
    const actuales = [...this.serviciosDeExtra(id)];
    const i = actuales.indexOf(valor);
    if (i >= 0) actuales.splice(i, 1);
    else actuales.push(valor);
    d.servicios = actuales;
    this.recalcularPrecioExtra(id);
  }

  elegirTamanoExtra(id: string, t: string): void {
    this.extra(id).tamano = t;
  }

  onPrecioExtra(id: string, valor: unknown): void {
    const d = this.extra(id);
    const n = valor === '' || valor === null || valor === undefined ? null : Number(valor);
    d.precio = n !== null && Number.isFinite(n) && n >= 0 ? n : null;
    d.precioManual = true;
  }

  onNotaExtra(id: string, valor: string): void {
    this.extra(id).nota = String(valor || '');
  }

  /** Perro sin tamaño en su ficha → se le pide en su tarjeta. */
  necesitaTamanoExtra(m: MascotaDelDueno): boolean {
    const e = String(m.raw?.['especie'] || '').toLowerCase();
    const perro = e.includes('can') || e.includes('perr');
    return perro && !String(m.raw?.['tamano_perro'] || m.raw?.['tamano'] || '').trim();
  }

  readonly tamanosExtra: FilaTarifaPeluqueria[] = ['pequeno', 'mediano', 'grande', 'xl'];

  hintPrecioExtra(id: string): string {
    const u = this.datosExtra.get(id)?.ultimo;
    if (!u) return 'Si aún no lo sabes, déjalo vacío.';
    const fecha = formatearFechaLocalEs(u.fechaIso);
    return `La última vez (${fecha}) se cobró $${u.precio} por ${u.mismoServicio ? 'este servicio' : 'su último baño'}. Cámbialo si hoy es distinto.`;
  }

  private async cargarPrecioExtra(id: string): Promise<void> {
    try {
      const rows = await firstValueFrom(this.baniosPacienteService.getBaniosPorPaciente(id).pipe(take(1)));
      this.extra(id).banios = (rows || []) as BanioConPrecio[];
    } catch {
      this.extra(id).banios = [];
    }
    this.recalcularPrecioExtra(id);
  }

  /** Sugiere el último precio de esa mascota (para el servicio elegido) mientras no lo escriban a mano. */
  private recalcularPrecioExtra(id: string): void {
    const d = this.datosExtra.get(id);
    if (!d) return;
    d.ultimo = precioAnteriorBanio(d.banios, { tipoServicio: this.servicioDeExtra(id) });
    if (!d.precioManual) d.precio = d.ultimo ? d.ultimo.precio : null;
  }

  /** Resumen arriba (sin buscador / al editar): «Molly · Karla Rojas». Faltaban desde un refactor y salía solo «Mascota». */
  get nombrePacienteSeleccionado(): string {
    return String(this.banioForm.get('paciente')?.value || this.data?.paciente || this.data?.paciente_nombre || '').trim();
  }

  get nombreClienteSeleccionado(): string {
    return String(this.banioForm.get('cliente')?.value || this.data?.cliente || this.data?.cliente_nombre || '').trim();
  }

  get tamanoPaciente(): string {
    const t = String(this.banioForm.get('tamano_perro')?.value || '') as TamanoPerroBanio;
    return (t && this.tamanoLabels[t]) || '';
  }

  /** Spec 114 (A6) — tamaño que ya tiene la ficha de la mascota ('' = no tiene). */
  private tamanoMascotaGuardado: string | null = null;

  private esPerro(): boolean {
    const e = this.especiePaciente.toLowerCase();
    return e.includes('can') || e.includes('perr');
  }

  /** Perro sin tamaño en su ficha: se pide aquí una sola vez y se guarda en la ficha. */
  get pideTamanoUnaVez(): boolean {
    return !this.esEdicion && !this.hidePatientInfo && this.tamanoMascotaGuardado === '' && this.esPerro();
  }

  get muestraTamano(): boolean {
    return this.hayTarifas || this.pideTamanoUnaVez;
  }

  get filasTamanoVisibles(): FilaTarifaPeluqueria[] {
    return this.hayTarifas ? this.filasTarifa : this.filasTarifa.filter((f) => f !== 'gato');
  }

  private registrarTamanoMascota(p: Record<string, any> | null | undefined): void {
    if (!p) return;
    if (!this.especiePaciente) this.especiePaciente = String(p['especie'] || '');
    const raw = String(p['tamano_perro'] || p['tamano'] || '').trim();
    this.tamanoMascotaGuardado = raw;
  }

  /** Guarda en la ficha el tamaño elegido si la mascota no tenía (aditivo: `tamano_perro`). */
  private async guardarTamanoEnFicha(pacienteId: string): Promise<void> {
    const t = String(this.banioForm.get('tamano_perro')?.value || '');
    if (!pacienteId || !t || this.tamanoMascotaGuardado !== '' || !this.esPerro()) return;
    try {
      await this.pacientesService.actualizarPaciente(pacienteId, { tamano_perro: t } as any);
    } catch (err) {
      console.warn('No se pudo guardar el tamaño en la ficha:', err);
    }
  }

  get nombreServicioPrincipal(): string {
    const v = String(this.banioForm.get('tipo_servicio')?.value || '');
    return buscarOpcionTipoServicioBanio(v)?.label || 'el de arriba';
  }

  private async cargarMascotasClienteResumen(clienteId: string): Promise<void> {
    if (!clienteId) return;
    try {
      const todas = await firstValueFrom(this.pacientesService.getPacientes().pipe(take(1)));
      this.mascotasClienteResumen = (todas || []).filter(
        (p: any) => String(p?.idCliente || p?.cliente_id || '') === clienteId && p?.activo !== false
      );
    } catch {
      this.mascotasClienteResumen = [];
    }
  }

  toggleMascotaExtra(id: string): void {
    if (this.mascotasExtra.has(id)) {
      this.mascotasExtra.delete(id);
      this.datosExtra.delete(id);
    } else {
      this.mascotasExtra.add(id);
      this.extra(id);
      void this.cargarPrecioExtra(id);
    }
  }

  get totalBaniosAGuardar(): number {
    return 1 + this.extrasElegidas().length;
  }

  get extrasElegidasLista(): MascotaDelDueno[] {
    return this.extrasElegidas();
  }

  private extrasElegidas(): MascotaDelDueno[] {
    return this.otrasMascotas.filter((m) => this.mascotasExtra.has(m.id));
  }

  trackMascota(_: number, m: MascotaDelDueno): string {
    return m.id;
  }

  get hayTarifas(): boolean {
    return hayTarifasPeluqueria(this.tarifasPelu);
  }

  /** Pelo corto/largo solo cambia el precio del «Baño». */
  get muestraPelo(): boolean {
    return this.banioForm.get('tipo_servicio')?.value === 'baño';
  }

  /**
   * Si ya vienen dueño/mascota (Llegó un paciente / expediente), no pedirlos otra vez:
   * se muestra el resumen compacto (mismo criterio que vacuna/historial — specs 070 / 085).
   */
  get muestraPickerClientePaciente(): boolean {
    return debeMostrarPickerAltaRapida({
      esEdicion: this.esEdicion,
      hidePatientInfo: this.hidePatientInfo,
      paciente_id: this.data?.paciente_id,
      idPaciente: this.data?.idPaciente,
    });
  }

  /** Hint bajo el único campo de dinero: precio a cobrar. */
  get hintPrecioAlCliente(): string {
    if (this.precioAnterior) {
      const fecha = formatearFechaLocalEs(this.precioAnterior.fechaIso);
      const servicio = this.precioAnterior.mismoServicio ? 'este servicio' : 'su último baño';
      return `La última vez (${fecha}) se cobró $${this.precioAnterior.precio} por ${servicio}. Cámbialo si hoy es distinto.`;
    }
    const adicionales = this.totalServiciosAdicionales();
    if (adicionales > 0) {
      const base = Number(this.banioForm.get('precio_base')?.value) || 0;
      return `Incluye $${adicionales} en extras · base baño: $${base}`;
    }
    return 'Si aún no lo sabes, déjalo vacío. El listado dirá «Falta el precio».';
  }

  /** Los seis servicios. Un baño viejo conserva su tipo al final. */
  get tiposServicioVisibles() {
    return opcionesTipoServicioAlta(this.banioForm.get('tipo_servicio')?.value);
  }

  estados = [
    { value: 'programado', label: 'Programado', color: '#2196f3' },
    { value: 'en_proceso', label: 'En Proceso', color: '#ff9800' },
    { value: 'completado', label: 'Completado', color: '#4caf50' },
    { value: 'cancelado', label: 'Cancelado', color: '#f44336' },
  ];

  prioridades = [
    { value: 'baja', label: 'Baja', color: '#4caf50' },
    { value: 'media', label: 'Media', color: '#ff9800' },
    { value: 'alta', label: 'Alta', color: '#f44336' },
    { value: 'urgente', label: 'Urgente', color: '#9c27b0' },
  ];

  comportamientos = [
    { value: 'tranquilo', label: 'Tranquilo' },
    { value: 'nervioso', label: 'Nervioso' },
    { value: 'agresivo', label: 'Agresivo' },
    { value: 'cooperativo', label: 'Cooperativo' },
  ];

  // Opciones predefinidas para servicios adicionales
  serviciosAdicionales = [
    { value: 'corte_uñas', label: 'Corte de Uñas', precio: 50 },
    { value: 'limpieza_oidos', label: 'Limpieza de Oídos', precio: 80 },
    { value: 'cepillado_especial', label: 'Cepillado Especial', precio: 60 },
    { value: 'perfume', label: 'Perfume', precio: 40 },
    { value: 'lazo_decorativo', label: 'Lazo Decorativo', precio: 30 },
    { value: 'tratamiento_antipulgas', label: 'Tratamiento Antipulgas', precio: 120 },
    { value: 'mascarilla_hidratante', label: 'Mascarilla Hidratante', precio: 90 },
  ];

  /** Spec 107 — baño a domicilio (se cobra aparte como línea «Domicilio»). */
  esDomicilio = false;
  domicilio: DomicilioDatos | null = null;
  clienteDomicilio: Cliente | null = null;

  async cargarClienteDomicilio(clienteId: string): Promise<void> {
    const id = String(clienteId || '').trim();
    if (!id) return;
    try {
      this.clienteDomicilio = await firstValueFrom(this.clientesService.getCliente(id).pipe(take(1)));
    } catch {
      this.clienteDomicilio = null;
    }
  }

  private readonly injector = inject(Injector);

  /**
   * Spec 107 — el cotizador se abre en su propia ventana y se carga al momento
   * (así no pesa en la carga inicial de la app).
   */
  async onDomicilioToggle(on: boolean): Promise<void> {
    if (!on) {
      this.esDomicilio = false;
      this.domicilio = null;
      return;
    }
    this.esDomicilio = true;
    await this.abrirCotizadorDomicilio();
    if (!this.domicilio) this.esDomicilio = false;
  }

  async abrirCotizadorDomicilio(): Promise<void> {
    if (!this.clienteDomicilio) {
      await this.cargarClienteDomicilio(String(this.banioForm.get('cliente_id')?.value || ''));
    }
    const dom = await abrirDomicilioDialog(this.injector.get(MatDialog), {
      cliente: this.clienteDomicilio,
      paciente: String(this.banioForm.get('paciente')?.value || ''),
      valor: this.domicilio,
      accion: 'Usar este domicilio',
    });
    if (dom) this.domicilio = dom;
  }

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BanioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private baniosService: BaniosService,
    private baniosPacienteService: BaniosPacienteService,
    private loadingService: LoadingService,
    private defaultsBanioService: DefaultsBanioService,
    private plantillaCostoService: PlantillaCostoService,
    private pacientesService: PacientesService,
    private tarifasPeluqueriaService: TarifasPeluqueriaService,
    private clientesService: ClientesService,
    dateAdapter: DateAdapter<Date>
  ) {
    dateAdapter.setLocale('es-MX');
    this.banioForm = this.fb.group({
      paciente_id: ['', Validators.required],
      paciente: [''],
      cliente_id: ['', Validators.required],
      cliente: [''],
      fecha_banio: ['', Validators.required],
      hora_banio: ['', Validators.required],
      tipo_servicio: ['', Validators.required],
      estado: ['programado', Validators.required],
      prioridad: ['media', Validators.required],
      observaciones: [''],
      alergias_conocidas: [[]],
      comportamiento: ['tranquilo'],
      peluquero_id: [''],
      peluquero: [''],
      precio_base: [0, [Validators.min(0)]],
      servicios_adicionales: [[]],
      precio_total: [null as number | null, [Validators.min(0)]],
      tamano_perro: [''],
      /** KPI interno (background desde tarifas Finanzas); sin UI en el diálogo. */
      costoEstimado: [null as number | null],
      plantillaCostoId: [''],
      pagado: [false],
      metodo_pago: [''],
      duracion_estimada: [60, [Validators.required, Validators.min(15)]],
      tiempo_inicio: [''],
      tiempo_fin: [''],
      activo: [true],
      created_by: ['system', Validators.required],
    });
  }

  ngOnInit(): void {
    void this.cargarDefaultsBanio();

    // Verificar si se debe ocultar la información del paciente/cliente
    this.hidePatientInfo = this.data?.hidePatientInfo || false;

    if (this.data && this.data.id) {
      this.esEdicion = true;
      this.modoRapido = false;
      this.masDetallesAbiertos = true;
      this.cargarDatosBanio();
      // En edición, estos campos son de solo lectura; no deben bloquear el guardado
      this.banioForm.get('paciente')?.clearValidators();
      this.banioForm.get('cliente')?.clearValidators();
      this.banioForm.get('paciente')?.updateValueAndValidity({ emitEvent: false });
      this.banioForm.get('cliente')?.updateValueAndValidity({ emitEvent: false });

      // Si se oculta la información del paciente, también limpiar validaciones de IDs
      if (this.hidePatientInfo) {
        this.banioForm.get('paciente_id')?.clearValidators();
        this.banioForm.get('cliente_id')?.clearValidators();
        this.banioForm.get('paciente_id')?.updateValueAndValidity({ emitEvent: false });
        this.banioForm.get('cliente_id')?.updateValueAndValidity({ emitEvent: false });
      }
    } else if (this.data) {
      this.aplicarPrefillCapturaRapida();
      // Pre-selección (Llegó un paciente / expediente) — ids duales como vacuna (070)
      const pacienteId = String(this.data.paciente_id || this.data.idPaciente || '').trim();
      const clienteId = String(this.data.cliente_id || this.data.idCliente || '').trim();
      if (pacienteId) {
        this.banioForm.patchValue({
          paciente_id: pacienteId,
          paciente: this.data.paciente || this.data.paciente_nombre || '',
          cliente_id: clienteId,
          cliente: this.data.cliente || this.data.cliente_nombre || '',
          created_by: 'system',
        });
        void this.cargarAlergiasDesdeMascota(pacienteId);
        void this.cargarHistorialPrecios(pacienteId);
        void this.cargarClienteDomicilio(clienteId);
        if (!this.hidePatientInfo) void this.cargarMascotasClienteResumen(clienteId);
      } else {
        this.banioForm.patchValue({ created_by: 'system' });
      }

      // Si se oculta la información del paciente, no validar estos campos
      if (this.hidePatientInfo) {
        this.banioForm.get('paciente')?.clearValidators();
        this.banioForm.get('cliente')?.clearValidators();
        this.banioForm.get('paciente_id')?.clearValidators();
        this.banioForm.get('cliente_id')?.clearValidators();
        this.banioForm.get('paciente')?.updateValueAndValidity({ emitEvent: false });
        this.banioForm.get('cliente')?.updateValueAndValidity({ emitEvent: false });
        this.banioForm.get('paciente_id')?.updateValueAndValidity({ emitEvent: false });
        this.banioForm.get('cliente_id')?.updateValueAndValidity({ emitEvent: false });
      } else {
        // En creación normal, mantener requerido para mostrar consistencia de datos
        this.banioForm.get('paciente')?.setValidators([Validators.required]);
        this.banioForm.get('cliente')?.setValidators([Validators.required]);
        this.banioForm.get('paciente')?.updateValueAndValidity({ emitEvent: false });
        this.banioForm.get('cliente')?.updateValueAndValidity({ emitEvent: false });
      }
    } else {
      this.aplicarPrefillCapturaRapida();
    }

    this.configurarCalculoPrecio();
  }

  setModoRapido(rapido: boolean): void {
    if (this.modoRapido === rapido) return;
    this.modoRapido = rapido;
    if (!rapido) {
      this.masDetallesAbiertos = true;
    }
    const actual = String(this.banioForm.get('tipo_servicio')?.value || '');
    if (actual && !tipoServicioPerteneceAlModo(actual, rapido)) {
      this.banioForm.patchValue({ tipo_servicio: '' });
    }
  }

  elegirTipoServicio(value: string): void {
    this.banioForm.patchValue({ tipo_servicio: value });
    // Las extras sin servicio propio siguen al de la principal: su precio sugerido cambia con él.
    for (const id of this.datosExtra.keys()) {
      if (!this.datosExtra.get(id)?.servicios.length) this.recalcularPrecioExtra(id);
    }
    // Primero el precio que se le cobró antes a esta mascota; si no hay, tarifa / defaults por tamaño.
    if (this.aplicarPrecioAnterior()) return;
    if (this.banioForm.get('tamano_perro')?.value || this.filaTarifa) {
      this.onTamanoChange();
    }
  }

  elegirTamano(t: TamanoPerroBanio | ''): void {
    this.banioForm.patchValue({ tamano_perro: t });
    this.onTamanoChange();
  }

  /** Chip de tamaño (Chico…Extragrande, Gato). Gato no cambia el tamaño guardado del perro. */
  elegirFilaTarifa(fila: FilaTarifaPeluqueria): void {
    this.filaTarifa = fila;
    if (fila !== 'gato') {
      this.banioForm.patchValue({ tamano_perro: fila });
    }
    this.onTamanoChange();
  }

  elegirPelo(pelo: PeloMascota): void {
    this.pelo = pelo;
    this.onTamanoChange();
  }

  /** Carga los baños de la mascota (una vez) y sugiere el último precio. */
  private async cargarHistorialPrecios(pacienteId: string): Promise<void> {
    const id = String(pacienteId || '').trim();
    if (!id || this.esEdicion) return;
    try {
      const rows = await firstValueFrom(this.baniosPacienteService.getBaniosPorPaciente(id).pipe(take(1)));
      this.baniosMascota = (rows || []) as BanioConPrecio[];
    } catch {
      this.baniosMascota = [];
    }
    this.aplicarPrecioAnterior();
  }

  /** Pone el último precio cobrado a esta mascota si el precio sigue vacío. true si hubo sugerencia. */
  private aplicarPrecioAnterior(): boolean {
    this.precioAnterior = precioAnteriorBanio(this.baniosMascota, {
      tipoServicio: this.banioForm.get('tipo_servicio')?.value,
      excluirId: this.data?.id,
    });
    if (!this.precioAnterior) return false;
    if (!this.precioTotalManual && !this.esEdicion) {
      this.banioForm.patchValue({ precio_base: this.precioAnterior.precio, precio_total: this.precioAnterior.precio });
      this.calcularPrecioTotal();
    }
    return true;
  }

  /** Precio de la tarifa de peluquería para lo elegido; null si no aplica. */
  private precioPorTarifa(): number | null {
    const fila = this.filaTarifa || filaTarifaPara(this.banioForm.get('tamano_perro')?.value, this.especiePaciente);
    return precioTarifaPeluqueria(this.tarifasPelu, {
      fila,
      tipoServicio: this.banioForm.get('tipo_servicio')?.value,
      pelo: this.pelo,
    });
  }

  onIniciarYaChange(checked: boolean): void {
    this.iniciarYa = checked;
    this.banioForm.patchValue({ estado: checked ? 'en_proceso' : 'programado' });
  }

  private aplicarPrefillCapturaRapida(): void {
    const p = prefillCapturaRapidaBanio({ iniciarYa: this.iniciarYa });
    const [y, m, d] = p.fecha_banio.split('-').map(Number);
    this.banioForm.patchValue({
      fecha_banio: new Date(y, m - 1, d),
      hora_banio: p.hora_banio,
      estado: p.estado,
      prioridad: p.prioridad,
      comportamiento: p.comportamiento,
      duracion_estimada: p.duracion_estimada,
      pagado: p.pagado,
    });
  }

  cargarDatosBanio() {
    if (this.data.id) {
      this.baniosService.getBanioById(this.data.id).subscribe((banio) => {
        if (banio) {
          // Normalizar datos para cumplir validaciones requeridas
          const normalizado: any = { ...banio };
          if (banio.domicilio && typeof banio.domicilio === 'object') {
            this.esDomicilio = true;
            this.domicilio = banio.domicilio as DomicilioDatos;
          }
          void this.cargarClienteDomicilio(String(banio.cliente_id || ''));
          if (!normalizado.created_by) normalizado.created_by = 'system';
          if (normalizado.precio_base === undefined || normalizado.precio_base === null) {
            normalizado.precio_base = 0;
          }
          if (normalizado.precio_total === undefined || normalizado.precio_total === null) {
            normalizado.precio_total = normalizado.precio_base || 0;
          }
          if (!normalizado.duracion_estimada) normalizado.duracion_estimada = 60;
          // Normalizar hora a formato HH:mm (FormControl / timepicker)
          if (normalizado.hora_banio) {
            normalizado.hora_banio = this.normalizarHora(normalizado.hora_banio);
          }
          // Conservar nombres de cliente/paciente del row si el registro no los trae
          if (!normalizado.paciente && this.data.paciente) normalizado.paciente = this.data.paciente;
          if (!normalizado.cliente && this.data.cliente) normalizado.cliente = this.data.cliente;
          if (!normalizado.paciente_id && this.data.paciente_id) normalizado.paciente_id = this.data.paciente_id;
          if (!normalizado.cliente_id && this.data.cliente_id) normalizado.cliente_id = this.data.cliente_id;
          if (!normalizado.tipo_servicio) normalizado.tipo_servicio = 'baño_básico';
          if (!normalizado.estado) normalizado.estado = 'programado';
          // Datepicker: ISO fecha-solo → Date local (no `new Date('yyyy-MM-dd')` = UTC)
          if (typeof normalizado.fecha_banio === 'string') {
            const local =
              parseIsoDateToLocalDate(normalizado.fecha_banio) ||
              this.parseFechaLista(normalizado.fecha_banio) ||
              (() => {
                const d = new Date(normalizado.fecha_banio);
                return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
              })();
            if (local) normalizado.fecha_banio = local;
          } else if (normalizado.fecha_banio instanceof Date) {
            const d = normalizado.fecha_banio as Date;
            normalizado.fecha_banio = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          } else if (!normalizado.fecha_banio && normalizado.created_at) {
            // Fallback: usar la fecha de creación si no existe fecha_banio
            const creada = this.parseCreatedAtToDate(normalizado.created_at);
            if (creada) normalizado.fecha_banio = creada;
          }
          // Fallback: si no hay fecha válida del backend, intentar tomarla del row de la tabla (dd/mm/yyyy)
          if (!normalizado.fecha_banio && this.data && this.data.fecha_banio) {
            const f = this.parseFechaLista(this.data.fecha_banio);
            if (f) normalizado.fecha_banio = f;
          }

          if (this.precioTotalManual) {
            delete normalizado.precio_total;
            delete normalizado.precio_base;
          }
          if (this.banioForm.get('fecha_banio')?.dirty) {
            delete normalizado.fecha_banio;
          }
          this.banioForm.patchValue(normalizado);
          this.precioTotalManual = true;
          // Recalcular precio por si faltaba precio_total
          this.calcularPrecioTotal();
          const pid = String(normalizado.paciente_id || this.data.paciente_id || '');
          if (pid) {
            void this.cargarAlergiasDesdeMascota(pid, normalizeAlergias(normalizado.alergias_conocidas));
          } else {
            this.setAlergiasPaciente(normalizeAlergias(normalizado.alergias_conocidas));
          }
        }
        // Si por alguna razón no llegó el registro (null), intentar poblar al menos la fecha desde la fila
        else if (this.data && this.data.fecha_banio) {
          const f = this.parseFechaLista(this.data.fecha_banio);
          if (f) {
            this.banioForm.patchValue({ fecha_banio: f });
          }
        }
      });
    }
  }

  /**
   * Normaliza a `yyyy-MM-dd` con componentes locales (spec 090 / datepicker.util).
   */
  private normalizarFecha(fecha: any): string {
    try {
      if (!fecha) return '';
      if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return fecha;
      }
      if (fecha instanceof Date) {
        return formatLocalDateToIso(fecha);
      }
      if (typeof fecha === 'string') {
        const dmy = fecha.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (dmy) {
          const day = +dmy[1];
          const month = +dmy[2];
          const year = +dmy[3];
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
            return formatLocalDateToIso(new Date(year, month - 1, day));
          }
        }
        if (fecha.includes('T') || fecha.includes(' ')) {
          const datePart = fecha.split(/[T ]/)[0];
          if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
        }
        const fromIso = parseIsoDateToLocalDate(fecha.slice(0, 10));
        if (fromIso) return formatLocalDateToIso(fromIso);
        const date = new Date(fecha);
        if (!Number.isNaN(date.getTime())) return formatLocalDateToIso(date);
      }
      console.warn('⚠️ No se pudo normalizar la fecha:', fecha);
      return '';
    } catch (error) {
      console.error('❌ Error al normalizar fecha:', error);
      return '';
    }
  }

  private normalizarHora(hora: any): string {
    try {
      if (!hora) return '';
      const texto = hora.toString().trim();
      // Si ya está en HH:mm
      if (/^\d{1,2}:\d{2}$/.test(texto)) return texto;
      // Variantes con AM/PM en español o inglés
      const ampmMatch = texto
        .replace(/\s+/g, ' ')
        .replace('a. m.', 'AM')
        .replace('p. m.', 'PM')
        .replace('a.m.', 'AM')
        .replace('p.m.', 'PM')
        .replace('am', 'AM')
        .replace('pm', 'PM')
        .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (ampmMatch) {
        let h = parseInt(ampmMatch[1], 10);
        const m = ampmMatch[2];
        const isPM = ampmMatch[3].toUpperCase() === 'PM';
        if (isPM && h < 12) h += 12;
        if (!isPM && h === 12) h = 0;
        return `${h.toString().padStart(2, '0')}:${m}`;
      }
      // Último recurso: intentar parsear con Date
      const d = new Date(`1970-01-01T${texto}`);
      if (!isNaN(d.getTime())) {
        const hh = d.getHours().toString().padStart(2, '0');
        const mm = d.getMinutes().toString().padStart(2, '0');
        return `${hh}:${mm}`;
      }
      return texto;
    } catch {
      return '';
    }
  }

  // Convierte 'dd/mm/yyyy' a Date truncada a día.
  private parseFechaLista(fechaStr: string): Date | null {
    try {
      const m = fechaStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!m) return null;
      const d = parseInt(m[1], 10);
      const mo = parseInt(m[2], 10) - 1;
      const y = parseInt(m[3], 10);
      return new Date(y, mo, d);
    } catch {
      return null;
    }
  }

  // Convierte 'YYYY-MM-DD HH:mm:ss' o 'YYYY-MM-DD' a Date truncada a día.
  private parseCreatedAtToDate(createdAt: string): Date | null {
    try {
      if (!createdAt) return null;
      const datePart = createdAt.split(' ')[0];
      const m = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return null;
      const y = parseInt(m[1], 10);
      const mo = parseInt(m[2], 10) - 1;
      const d = parseInt(m[3], 10);
      return new Date(y, mo, d);
    } catch {
      return null;
    }
  }

  configurarCalculoPrecio() {
    this.banioForm.get('servicios_adicionales')?.valueChanges.subscribe(() => {
      this.calcularPrecioTotal();
    });

    setTimeout(() => {
      this.calcularPrecioTotal();
      this.banioForm.updateValueAndValidity({ onlySelf: false, emitEvent: true });
    }, 100);
  }

  private async cargarDefaultsBanio(): Promise<void> {
    try {
      const [defaults, plantillas, tarifas] = await Promise.all([
        this.defaultsBanioService.getDefaultsOnce(),
        firstValueFrom(this.plantillaCostoService.getPlantillas().pipe(take(1))).catch(() => []),
        this.tarifasPeluqueriaService.getOnce().catch(() => tarifasPeluqueriaVacias()),
      ]);
      this.defaultsBanio = defaults;
      this.tarifasPelu = tarifas;
      this.plantillasCosto = plantillas || [];
    } catch {
      this.defaultsBanio = emptyDefaultsBanio();
      this.plantillasCosto = [];
    } finally {
      this.defaultsListos = true;
      const tamano = this.banioForm.get('tamano_perro')?.value as TamanoPerroBanio | '';
      if ((tamano || this.filaTarifa) && !this.esEdicion) {
        this.onTamanoChange();
      }
    }
  }

  onClientePacienteSelected(sel: ClientePacienteSelection): void {
    const clienteId = String(sel.cliente_id || '');
    if (clienteId !== this.clienteDeExtras) {
      this.mascotasExtra.clear();
      this.datosExtra.clear();
      this.clienteDeExtras = clienteId;
    }
    if (sel.paciente_id) this.mascotasExtra.delete(String(sel.paciente_id));
    this.clienteDomicilio = (sel.clienteData as Cliente) || null;
    this.especiePaciente = String(sel.pacienteData?.['especie'] || '');
    this.tamanoMascotaGuardado = null;
    if (sel.pacienteData) this.registrarTamanoMascota(sel.pacienteData as any);
    this.baniosMascota = [];
    this.precioAnterior = null;
    if (sel.paciente_id) {
      void this.cargarHistorialPrecios(sel.paciente_id);
    }
    this.filaTarifa = filaTarifaPara(
      String(sel.pacienteData?.['tamano_perro'] || sel.pacienteData?.['tamano'] || ''),
      this.especiePaciente
    );
    const raw = String(sel.pacienteData?.['tamano_perro'] || sel.pacienteData?.['tamano'] || '').toLowerCase();
    let tamano: TamanoPerroBanio | '' = '';
    if (raw === 'pequeno' || raw === 'chico') tamano = 'pequeno';
    else if (raw === 'mediano') tamano = 'mediano';
    else if (raw === 'grande') tamano = 'grande';
    else if (raw === 'xl' || raw === 'gigante' || raw === 'extra' || raw === 'extragrande') tamano = 'xl';
    if (tamano) {
      this.banioForm.patchValue({ tamano_perro: tamano });
      this.onTamanoChange();
    }
    const fromPaciente = normalizeAlergias(sel.pacienteData);
    if (fromPaciente.length) {
      this.setAlergiasPaciente(fromPaciente);
    } else if (sel.paciente_id) {
      void this.cargarAlergiasDesdeMascota(sel.paciente_id);
    } else {
      this.setAlergiasPaciente([]);
    }
  }

  onAlergiasPacienteChange(lista: string[]): void {
    this.setAlergiasPaciente(lista);
  }

  private setAlergiasPaciente(lista: string[]): void {
    this.alergiasPaciente = normalizeAlergias(lista);
    this.banioForm.patchValue({ alergias_conocidas: this.alergiasPaciente }, { emitEvent: false });
  }

  private async cargarAlergiasDesdeMascota(pacienteId: string, fallbackBanio: string[] = []): Promise<void> {
    if (!pacienteId) {
      this.setAlergiasPaciente(fallbackBanio);
      return;
    }
    try {
      const paciente = await firstValueFrom(this.pacientesService.getPaciente(pacienteId).pipe(take(1)));
      if (!this.esEdicion && this.tamanoMascotaGuardado === null) this.registrarTamanoMascota(paciente as any);
      const fromMascota = normalizeAlergias(paciente);
      this.setAlergiasPaciente(fromMascota.length ? fromMascota : fallbackBanio);
    } catch {
      this.setAlergiasPaciente(fallbackBanio);
    }
  }

  private async sincronizarAlergiasMascota(pacienteId: string, alergias: string[]): Promise<void> {
    if (!pacienteId) return;
    try {
      await this.pacientesService.actualizarPaciente(pacienteId, { alergias: normalizeAlergias(alergias) });
    } catch (err) {
      console.warn('No se pudieron sincronizar alergias a Mascota:', err);
    }
  }

  onTamanoChange(): void {
    // El precio que se le cobró antes a esta mascota manda sobre tarifas y defaults.
    if (this.precioAnterior && !this.esEdicion) return;
    const precioTarifa = this.defaultsListos ? this.precioPorTarifa() : null;
    if (precioTarifa != null) {
      this.prefillHint = 'Precio de la tarifa de peluquería (Finanzas). Puedes cambiarlo.';
      if (!this.precioTotalManual) {
        this.banioForm.patchValue({ precio_base: precioTarifa, precio_total: precioTarifa });
        this.calcularPrecioTotal();
      }
      return;
    }
    const tamano = this.banioForm.get('tamano_perro')?.value as TamanoPerroBanio | '';
    if (!tamano) {
      this.prefillHint = '';
      return;
    }
    if (!this.defaultsListos) {
      this.prefillHint = 'Cargando tarifas de Finanzas…';
      return;
    }
    const prefill = resolverPrefillBanioPorTamano(tamano, this.defaultsBanio, this.plantillasCosto);
    if (prefill.fuente === 'ninguno') {
      this.prefillHint =
        'Escribe el precio. Si quieres que se sugiera, llena «Tarifas de peluquería» en Finanzas → Precios y costos.';
      return;
    }
    this.prefillHint =
      prefill.fuente === 'plantilla'
        ? 'Prefill desde plantilla de costo (Finanzas).'
        : prefill.fuente === 'fallback'
          ? 'Prefill desde tarifa base en código (configura Finanzas para personalizar).'
          : 'Prefill desde defaults baño (Finanzas).';
    const patch: Record<string, unknown> = {
      costoEstimado: prefill.costoEstimado,
      plantillaCostoId: prefill.plantillaCostoId || '',
    };
    if (prefill.precioSugerido != null && !this.precioTotalManual) {
      patch['precio_base'] = prefill.precioSugerido;
      patch['precio_total'] = prefill.precioSugerido;
    }
    this.banioForm.patchValue(patch);
    this.calcularPrecioTotal();
  }

  onPrecioTotalManual(): void {
    this.precioTotalManual = true;
    this.sincronizarPrecioBaseDesdeTotal();
  }

  /** El día del calendario es el que se guarda, en hora local (sin voltear día y mes). */
  fijarFechaBanio(event: MatDatepickerInputEvent<Date>): void {
    const fecha = event.value;
    if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return;
    this.banioForm.patchValue({
      fecha_banio: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()),
    });
    this.banioForm.get('fecha_banio')?.markAsDirty();
  }

  /** RTDB legacy: precio_base = precio_total − servicios adicionales. */
  private sincronizarPrecioBaseDesdeTotal(): void {
    const total = Number(this.banioForm.get('precio_total')?.value) || 0;
    const adicionales = this.totalServiciosAdicionales();
    this.banioForm.patchValue({ precio_base: Math.max(0, total - adicionales) }, { emitEvent: false });
  }

  private totalServiciosAdicionales(): number {
    const servicios = this.banioForm.get('servicios_adicionales')?.value || [];
    return servicios.reduce((sum: number, servicio: { precio?: number }) => {
      return sum + (Number(servicio.precio) || 0);
    }, 0);
  }

  // Función para actualizar precio automáticamente cuando se selecciona un servicio
  actualizarPrecioServicio(servicio: any, index: number) {
    if (servicio.servicio && servicio.servicio !== 'otro') {
      const servicioPredefinido = this.serviciosAdicionales.find((s) => s.value === servicio.servicio);
      if (servicioPredefinido) {
        servicio.precio = servicioPredefinido.precio;
        // Forzar actualización del formulario
        const serviciosActuales = this.banioForm.get('servicios_adicionales')?.value || [];
        serviciosActuales[index] = servicio;
        this.banioForm.patchValue({ servicios_adicionales: serviciosActuales });
        this.calcularPrecioTotal();
      }
    }
  }

  calcularPrecioTotal(): number {
    const precioBase = Number(this.banioForm.get('precio_base')?.value) || 0;
    const totalAdicionales = this.totalServiciosAdicionales();
    const precioTotal = precioBase + totalAdicionales;

    if (!this.precioTotalManual) {
      const actual = this.banioForm.get('precio_total')?.value;
      if (precioTotal === 0 && (actual === null || actual === '')) {
        return 0;
      }
      this.banioForm.patchValue({ precio_total: precioTotal }, { emitEvent: false });
    }

    return Number(this.banioForm.get('precio_total')?.value) || precioTotal;
  }

  agregarServicioAdicional() {
    const serviciosActuales = this.banioForm.get('servicios_adicionales')?.value || [];
    const nuevoServicio = {
      servicio: '',
      precio: 0,
      servicioPersonalizado: '',
    };

    this.banioForm.patchValue({
      servicios_adicionales: [...serviciosActuales, nuevoServicio],
    });
  }

  removerServicioAdicional(index: number) {
    const serviciosActuales = this.banioForm.get('servicios_adicionales')?.value || [];
    serviciosActuales.splice(index, 1);
    this.banioForm.patchValue({ servicios_adicionales: serviciosActuales });
    this.calcularPrecioTotal();
  }

  onSubmit() {
    this.sincronizarPrecioBaseDesdeTotal();

    if (!this.banioForm.get('tipo_servicio')?.value) {
      Swal.fire('Falta el servicio', 'Elige el tipo de baño o corte.', 'warning');
      return;
    }

    const precioIngresado = this.banioForm.get('precio_total')?.value;
    if (precioIngresado === '' || precioIngresado == null) {
      this.banioForm.patchValue({ precio_total: 0 }, { emitEvent: false });
    }

    if (this.esDomicilio && !this.domicilio) {
      Swal.fire('Falta el domicilio', 'Escribe los km a su casa para calcular el domicilio, o quita «Es a domicilio».', 'warning');
      return;
    }

    if (this.banioForm.valid) {
      this.loading = true;

      // Obtener valores del formulario, incluyendo campos disabled
      const banioData = {
        ...this.banioForm.value,
        // Incluir fecha_banio aunque esté disabled (en modo edición)
        fecha_banio: this.banioForm.get('fecha_banio')?.value || this.banioForm.value.fecha_banio,
      };

      // Normalizar fecha a formato YYYY-MM-DD preservando exactamente la fecha seleccionada
      // Esto es crítico para permitir fechas pasadas sin que se cambien a la fecha actual
      banioData.fecha_banio = this.normalizarFecha(banioData.fecha_banio);

      // Validar que la fecha se haya normalizado correctamente
      if (!banioData.fecha_banio || !/^\d{4}-\d{2}-\d{2}$/.test(banioData.fecha_banio)) {
        console.error('❌ Error: La fecha no se pudo normalizar correctamente:', banioData.fecha_banio);
        Swal.fire('Error', 'La fecha seleccionada no es válida. Por favor selecciona una fecha correcta.', 'error');
        this.loading = false;
        return;
      }

      // Asegurar formato de hora válido antes de enviar
      banioData.hora_banio = this.normalizarHora(banioData.hora_banio);

      // Limpiar datos antes de enviar
      const alergiasSync = normalizeAlergias(this.alergiasPaciente);
      const datosLimpios: any = {
        ...banioData,
        // Asegurar que los arrays estén definidos
        servicios_adicionales: banioData.servicios_adicionales || [],
        alergias_conocidas: alergiasSync,
        // Asegurar que el campo created_by esté presente
        created_by: banioData.created_by || 'system',
        // Asegurar que productos_utilizados esté definido
        productos_utilizados: banioData.productos_utilizados || [],
      };

      // Costo = estimado interno (tarifas Finanzas). Solo se persiste si es útil para KPIs
      // (positivo y menor que el precio). El staff no lo edita; no bloquear el alta.
      const precioCobro = Number(datosLimpios.precio_total) || 0;
      const costoNum = Number(datosLimpios.costoEstimado);
      if (
        datosLimpios.costoEstimado != null &&
        datosLimpios.costoEstimado !== '' &&
        Number.isFinite(costoNum) &&
        costoNum > 0 &&
        costoNum < precioCobro
      ) {
        datosLimpios.costoEstimado = costoNum;
      } else {
        delete datosLimpios.costoEstimado;
      }
      if (!datosLimpios.tamano_perro) {
        delete datosLimpios.tamano_perro;
      }
      if (!datosLimpios.plantillaCostoId) {
        delete datosLimpios.plantillaCostoId;
      }

      // Spec 107 — domicilio aparte del precio del baño. En edición, null lo quita.
      if (this.esDomicilio && this.domicilio) {
        datosLimpios.domicilio = this.domicilio;
      } else if (this.esEdicion) {
        datosLimpios.domicilio = null;
      } else {
        delete datosLimpios.domicilio;
      }

      // Remover campos undefined para evitar errores de Firebase
      Object.keys(datosLimpios).forEach((key) => {
        if (datosLimpios[key] === undefined) {
          delete datosLimpios[key];
        }
      });

      if (this.esEdicion) {
        // Actualizar baño existente (solo campos permitidos)
        const permitidos: (keyof typeof datosLimpios)[] = [
          'fecha_banio',
          'hora_banio',
          'tipo_servicio',
          'estado',
          'prioridad',
          'observaciones',
          'alergias_conocidas',
          'comportamiento',
          'peluquero_id',
          'peluquero',
          'precio_base',
          'servicios_adicionales',
          'precio_total',
          'pagado',
          'metodo_pago',
          'duracion_estimada',
          'tiempo_inicio',
          'tiempo_fin',
          'activo',
          'updated_at',
          'updated_by',
          'tamano_perro',
          'costoEstimado',
          'plantillaCostoId',
          'domicilio',
        ];
        const payload: any = {};
        permitidos.forEach((k) => {
          if (datosLimpios[k] !== undefined && datosLimpios[k] !== '') payload[k] = datosLimpios[k];
        });
        if (datosLimpios['costoEstimado'] != null && datosLimpios['costoEstimado'] !== '') {
          payload.costoEstimado = Number(datosLimpios['costoEstimado']);
        }
        if (!datosLimpios['tamano_perro']) {
          delete payload.tamano_perro;
        }
        if (!datosLimpios['plantillaCostoId']) {
          delete payload.plantillaCostoId;
        }

        // Usar el servicio correcto dependiendo del contexto
        const servicioAUsar = this.hidePatientInfo ? this.baniosPacienteService : this.baniosService;
        const metodoActualizar = this.hidePatientInfo ? 'actualizarBanioPaciente' : 'actualizarBanio';

        this.loadingService.show(LOADING_MESSAGES.saving);
        servicioAUsar[metodoActualizar](this.data.id, payload)
          .then(async () => {
            const pid = String(this.banioForm.get('paciente_id')?.value || this.data.paciente_id || '');
            await this.sincronizarAlergiasMascota(pid, alergiasSync);
            this.dialogRef.close(true);
          })
          .catch((error) => {
            console.error('❌ Error al actualizar baño:', error);
            setTimeout(() => Swal.fire('Error', `No se pudo actualizar el baño: ${error.message}`, 'error'), 0);
          })
          .finally(() => {
            this.loadingService.hide();
            this.loading = false;
          });
      } else {
        // Crear nuevo baño
        const servicioAUsar = this.hidePatientInfo ? this.baniosPacienteService : this.baniosService;
        const metodoCrear = this.hidePatientInfo ? 'crearBanioPaciente' : 'crearBanio';

        this.loadingService.show(LOADING_MESSAGES.saving);
        servicioAUsar[metodoCrear](datosLimpios)
          .then(async (nuevoId: string) => {
            const pid = String(datosLimpios.paciente_id || this.banioForm.get('paciente_id')?.value || '');
            await this.sincronizarAlergiasMascota(pid, alergiasSync);
            await this.guardarTamanoEnFicha(pid);
            const ids = [nuevoId];
            if (!this.hidePatientInfo) {
              for (const mascota of this.extrasElegidas()) {
                const d = this.extra(mascota.id);
                const extra = datosBanioMascotaExtra(datosLimpios, mascota, normalizeAlergias(mascota.raw), {
                  servicio: this.servicioDeExtra(mascota.id),
                  serviciosExtra: this.serviciosDeExtra(mascota.id).slice(1),
                  precio: d.precio,
                  nota: d.nota,
                  tamano: d.tamano,
                });
                ids.push(await this.baniosService.crearBanio(extra as any));
                if (d.tamano && this.necesitaTamanoExtra(mascota)) {
                  try {
                    await this.pacientesService.actualizarPaciente(mascota.id, { tamano_perro: d.tamano } as any);
                  } catch (err) {
                    console.warn('No se pudo guardar el tamaño en la ficha:', err);
                  }
                }
              }
            }
            this.dialogRef.close({ created: true, id: nuevoId, ids });
          })
          .catch((error) => {
            console.error('❌ Error al crear baño:', error);
            setTimeout(() => Swal.fire('Error', `No se pudo crear el baño: ${error.message}`, 'error'), 0);
          })
          .finally(() => {
            this.loadingService.hide();
            this.loading = false;
          });
      }
    } else {
      Swal.fire('Error', 'Por favor completa todos los campos requeridos', 'error');
    }
  }

  cancelar() {
    this.dialogRef.close();
  }

  getTipoServicioIcon(tipo: string): string {
    return buscarOpcionTipoServicioBanio(tipo)?.icon || 'pets';
  }

  getTipoServicioLabel(tipo: string): string {
    return buscarOpcionTipoServicioBanio(tipo)?.label || tipo;
  }
}
