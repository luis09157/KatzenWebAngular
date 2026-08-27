import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject, firstValueFrom } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ADMIN_DIALOG_CONFIG } from '../core/config/admin-ui.config';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { CajaMovimientoDialogComponent } from '../finanzas/caja-movimiento-dialog.component';
import { ClientePacienteSelection } from '../shared/admin/cliente-paciente-picker.models';
import { StaffPickerFields } from '../shared/admin/staff-picker.models';
import { PacientesService } from '../pacientes/pacientes.service';
import { normalizeAlergias } from '../shared/alergias/alergias.util';
import {
  Visita,
  VisitaLinea,
  VisitaLineaCategoria,
  VISITA_ESTADO_LABELS,
  VISITA_LINEA_A_CAJA,
  VISITA_LINEA_CATEGORIA_LABELS
} from './visitas.models';
import { VisitasService } from './visitas.service';
import { hoyLocalIsoDate, nuevaLineaId, recalcularVisita, roundMoney } from './visitas.util';

interface LineaPreset {
  categoria: VisitaLineaCategoria;
  descripcion: string;
  label: string;
}

@Component({
  selector: 'app-visita-dialog',
  templateUrl: './visita-dialog.component.html',
  styleUrls: ['./visita-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VisitaDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  form: FormGroup;
  lineaForm: FormGroup;
  loading = false;
  esEdicion = false;
  soloLectura = false;
  visitaId: string | null = null;
  lineas: VisitaLinea[] = [];
  pagado = 0;
  estadoLabel = VISITA_ESTADO_LABELS.abierta;
  /** Spec 034 */
  alergiasPaciente: string[] = [];
  readonly staffPickerFields: StaffPickerFields = {
    uidField: 'atendidoPorUid',
    nombreField: 'atendidoPorNombre'
  };

  readonly categoriaLabels = VISITA_LINEA_CATEGORIA_LABELS;
  readonly estadoLabels = VISITA_ESTADO_LABELS;
  readonly categorias: VisitaLineaCategoria[] = [
    'consulta',
    'vacuna',
    'banio',
    'corte',
    'venta_producto',
    'pension',
    'cirugia',
    'otro'
  ];

  readonly lineaPresets: LineaPreset[] = [
    { categoria: 'consulta', descripcion: 'Consulta general', label: 'Consulta' },
    { categoria: 'banio', descripcion: 'Baño / peluquería', label: 'Baño' },
    { categoria: 'venta_producto', descripcion: 'Producto', label: 'Producto' },
    { categoria: 'vacuna', descripcion: 'Vacuna', label: 'Vacuna' }
  ];

  get totales() {
    return recalcularVisita({ lineas: this.lineas, pagado: this.pagado });
  }

  get cobrarLabel(): string {
    const t = this.totales;
    if (t.saldo <= 0) return 'Cobrar';
    if (t.pagado > 0) {
      return `Cobrar resto ${this.formatMoney(t.saldo)}`;
    }
    return `Cobrar ${this.formatMoney(t.saldo)}`;
  }

  constructor(
    private fb: FormBuilder,
    private visitasService: VisitasService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<VisitaDialogComponent>,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    private pacientesService: PacientesService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      visita?: Visita;
      cliente_id?: string;
      cliente?: string;
      paciente_id?: string;
      paciente?: string;
      fecha?: string;
    }
  ) {
    this.form = this.fb.group({
      paciente: [''],
      paciente_id: [''],
      cliente: [''],
      cliente_id: ['', Validators.required],
      fecha: [hoyLocalIsoDate(), Validators.required],
      notas: [''],
      atendidoPorUid: [''],
      atendidoPorNombre: ['']
    });
    this.lineaForm = this.fb.group({
      descripcion: ['', [Validators.required, Validators.minLength(2)]],
      monto: [null, [Validators.required, Validators.min(0.01)]],
      categoria: ['consulta' as VisitaLineaCategoria, Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data?.visita?.id) {
      this.esEdicion = true;
      this.visitaId = this.data.visita.id;
      const v = this.data.visita;
      this.lineas = [...(v.lineas || [])];
      this.pagado = Number(v.pagado) || 0;
      this.estadoLabel = VISITA_ESTADO_LABELS[v.estado] || v.estado;
      this.form.patchValue({
        cliente_id: v.cliente_id,
        cliente: v.cliente || '',
        paciente_id: v.paciente_id || '',
        paciente: v.paciente || '',
        fecha: v.fecha,
        notas: v.notas || '',
        atendidoPorUid: v.atendidoPorUid || '',
        atendidoPorNombre: v.atendidoPorNombre || ''
      });
      if (v.estado === 'cerrada' || v.estado === 'cancelada') {
        this.soloLectura = true;
        this.form.disable();
        this.lineaForm.disable();
      }
      if (v.paciente_id) {
        void this.cargarAlergias(v.paciente_id);
      }
    } else {
      this.form.patchValue({
        cliente_id: this.data?.cliente_id || '',
        cliente: this.data?.cliente || '',
        paciente_id: this.data?.paciente_id || '',
        paciente: this.data?.paciente || '',
        fecha: this.data?.fecha || hoyLocalIsoDate()
      });
      if (this.data?.paciente_id) {
        void this.cargarAlergias(this.data.paciente_id);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClientePacienteSelected(sel: ClientePacienteSelection): void {
    this.form.patchValue({
      cliente_id: sel.cliente_id || '',
      cliente: sel.cliente || '',
      paciente_id: sel.paciente_id || '',
      paciente: sel.paciente || ''
    });
    const fromSel = normalizeAlergias(sel.pacienteData);
    if (fromSel.length) {
      this.alergiasPaciente = fromSel;
    } else if (sel.paciente_id) {
      void this.cargarAlergias(sel.paciente_id);
    } else {
      this.alergiasPaciente = [];
    }
  }

  private async cargarAlergias(pacienteId: string): Promise<void> {
    try {
      const p = await firstValueFrom(this.pacientesService.getPaciente(pacienteId).pipe(take(1)));
      this.alergiasPaciente = normalizeAlergias(p);
    } catch {
      this.alergiasPaciente = [];
    }
  }

  aplicarPreset(preset: LineaPreset): void {
    if (this.soloLectura) return;
    this.lineaForm.patchValue({
      categoria: preset.categoria,
      descripcion: preset.descripcion
    });
    this.lineaForm.get('monto')?.markAsUntouched();
  }

  agregarLineaLocal(): void {
    if (this.soloLectura) return;
    if (this.lineaForm.invalid) {
      this.lineaForm.markAllAsTouched();
      return;
    }
    const v = this.lineaForm.getRawValue();
    this.lineas = [
      ...this.lineas,
      {
        id: nuevaLineaId(),
        descripcion: String(v.descripcion).trim(),
        monto: roundMoney(v.monto),
        categoria: v.categoria
      }
    ];
    this.lineaForm.reset({ descripcion: '', monto: null, categoria: 'consulta' });
  }

  quitarLinea(id: string): void {
    if (this.soloLectura || this.pagado > 0) return;
    this.lineas = this.lineas.filter((l) => l.id !== id);
  }

  formatMoney(n: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0);
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  imprimir(): void {
    document.body.classList.add('visita-printing');
    const cleanup = () => {
      document.body.classList.remove('visita-printing');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => window.print(), 50);
  }

  private async persistir(): Promise<string> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      throw new Error('Selecciona un cliente y la fecha de la visita.');
    }
    const raw = this.form.getRawValue();
    if (!String(raw.cliente_id || '').trim()) {
      throw new Error('El cliente es obligatorio para el ticket.');
    }

    if (!this.visitaId) {
      const existente = await this.visitasService.buscarVisitaAbiertaDelDia(
        raw.cliente_id,
        raw.fecha || hoyLocalIsoDate()
      );
      if (existente?.id) {
        const conf = await Swal.fire({
          icon: 'question',
          title: 'Ya hay un ticket abierto',
          html: `Cliente <strong>${existente.cliente || raw.cliente}</strong> · ${existente.fecha}<br/>Saldo ${this.formatMoney(existente.saldo)}. ¿Usar ese ticket en lugar de crear otro?`,
          showCancelButton: true,
          confirmButtonText: 'Usar ticket existente',
          cancelButtonText: 'Crear otro'
        });
        if (conf.isConfirmed) {
          this.visitaId = existente.id;
          this.esEdicion = true;
          this.lineas = [...(existente.lineas || []), ...this.lineas];
          this.pagado = Number(existente.pagado) || 0;
          this.estadoLabel = VISITA_ESTADO_LABELS[existente.estado] || existente.estado;
        }
      }
    }

    if (this.visitaId) {
      await this.visitasService.actualizarVisita(this.visitaId, {
        cliente_id: raw.cliente_id,
        cliente: raw.cliente,
        paciente_id: raw.paciente_id || undefined,
        paciente: raw.paciente || '',
        fecha: raw.fecha,
        notas: raw.notas || '',
        atendidoPorUid: raw.atendidoPorUid || undefined,
        atendidoPorNombre: raw.atendidoPorNombre || undefined,
        lineas: this.lineas
      });
      return this.visitaId;
    }
    const id = await this.visitasService.crearVisita({
      cliente_id: raw.cliente_id,
      cliente: raw.cliente,
      paciente_id: raw.paciente_id || undefined,
      paciente: raw.paciente || '',
      fecha: raw.fecha,
      notas: raw.notas || '',
      atendidoPorUid: raw.atendidoPorUid || undefined,
      atendidoPorNombre: raw.atendidoPorNombre || undefined,
      lineas: this.lineas
    });
    this.visitaId = id;
    this.esEdicion = true;
    return id;
  }

  async guardar(): Promise<void> {
    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const id = await this.persistir();
      this.dialogRef.close({ visitaId: id, saved: true });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar visita'), 'error');
    } finally {
      this.loading = false;
      this.loadingService.hide();
    }
  }

  async cobrar(): Promise<void> {
    if (this.soloLectura) return;
    const t = this.totales;
    if (!this.lineas.length) {
      Swal.fire('Sin líneas', 'Agrega al menos un servicio o producto al ticket.', 'warning');
      return;
    }
    if (t.saldo <= 0) {
      Swal.fire('Sin saldo', 'No hay monto pendiente por cobrar.', 'info');
      return;
    }

    this.loading = true;
    this.loadingService.show(LOADING_MESSAGES.saving);
    let visitaId: string;
    try {
      visitaId = await this.persistir();
    } catch (error) {
      this.loading = false;
      this.loadingService.hide();
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar visita'), 'error');
      return;
    }
    this.loading = false;
    this.loadingService.hide();

    const cat = this.lineas.length === 1 ? this.lineas[0].categoria : 'otro';
    const raw = this.form.getRawValue();
    const saldoAntes = t.saldo;
    const ref = this.dialog.open(CajaMovimientoDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '640px',
      disableClose: true,
      data: {
        tipo: 'ingreso' as const,
        fechaDefault: raw.fecha,
        clienteId: raw.cliente_id,
        visitaId,
        concepto: `Visita ${raw.fecha} · ${raw.cliente || raw.cliente_id}`,
        monto: t.saldo,
        metodoPago: 'efectivo' as const,
        categoria: VISITA_LINEA_A_CAJA[cat] || 'otro'
      }
    });

    ref
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (result) => {
        const movId = result?.movimientoId as string | undefined;
        if (!movId) return;
        const montoPago = roundMoney(Number(result?.monto) || t.saldo);
        try {
          this.loadingService.show(LOADING_MESSAGES.saving);
          const visita = await this.visitasService.getVisita(visitaId);
          if (!visita) throw new Error('Visita no encontrada');
          if (montoPago > roundMoney(visita.saldo) + 0.001) {
            throw new Error('El monto no puede superar el saldo pendiente');
          }
          const ids = [...(visita.cajaMovimientoIds || [])];
          if (!ids.includes(movId)) ids.push(movId);
          await this.visitasService.actualizarVisita(visitaId, {
            pagado: roundMoney((visita.pagado || 0) + montoPago),
            cajaMovimientoIds: ids
          });
          const esParcial = montoPago < saldoAntes - 0.001;
          Swal.fire({
            icon: 'success',
            title: esParcial ? 'Pago parcial registrado' : 'Visita cobrada al 100%',
            text: esParcial
              ? `Queda saldo pendiente. Puedes cobrar el resto después.`
              : 'Ticket cerrado. Saldo en $0.',
            timer: 2200,
            showConfirmButton: false
          });
          this.dialogRef.close({ visitaId, cobrado: true, parcial: esParcial });
        } catch (error) {
          Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cobrar visita'), 'error');
        } finally {
          this.loadingService.hide();
        }
      });
  }
}
