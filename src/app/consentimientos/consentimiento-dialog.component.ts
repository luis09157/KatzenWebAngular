import { Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject, firstValueFrom } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ADMIN_DIALOG_FORM } from '../core/config/admin-ui.config';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { ClinicConfigService } from '../core/services/clinic-config.service';
import {
  AltaRapidaPickerDeps,
  crearClienteRapidoDesdePicker,
  crearMascotaRapidaDesdePicker,
} from '../shared/admin/alta-rapida-picker.helper';
import { ClientePacientePickerComponent } from '../shared/admin/cliente-paciente-picker.component';
import { ClientePacienteSelection } from '../shared/admin/cliente-paciente-picker.models';
import { StaffPickerFields } from '../shared/admin/staff-picker.models';
import { Cliente } from '../core/models';
import { ClientesService } from '../clientes/clientes.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { normalizeAlergias } from '../shared/alergias/alergias.util';
import {
  Consentimiento,
  ConsentimientoTipo,
  CONSENTIMIENTO_ESTADO_LABELS,
  CONSENTIMIENTO_TIPO_LABELS,
  CONSENTIMIENTO_TIPOS,
} from './consentimientos.models';
import { ConsentimientosService } from './consentimientos.service';
import { hoyLocalIsoDate } from './consentimientos.util';
import {
  buildConsentimientoDocumentoView,
  ConsentimientoDocumentoDatos,
  cssConsentimientoDocumento,
  htmlCuerpoConsentimientoDocumento,
} from './consentimiento-documento.util';
import {
  ConsentimientoPreviewDialogComponent,
  ConsentimientoPreviewDialogData,
} from './consentimiento-preview-dialog.component';

@Component({
  selector: 'app-consentimiento-dialog',
  templateUrl: './consentimiento-dialog.component.html',
  styleUrls: ['./consentimiento-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ConsentimientoDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild(ClientePacientePickerComponent) picker?: ClientePacientePickerComponent;
  form: FormGroup;
  loading = false;
  esEdicion = false;
  consentimientoId: string | null = null;
  alergiasPaciente: string[] = [];

  readonly tipos = CONSENTIMIENTO_TIPOS;
  readonly tipoLabels = CONSENTIMIENTO_TIPO_LABELS;
  readonly estadoLabels = CONSENTIMIENTO_ESTADO_LABELS;
  readonly staffPickerFields: StaffPickerFields = {
    uidField: 'staff_uid',
    nombreField: 'staff_nombre',
  };

  nombreClinica = 'KatzenVet';
  previewCompactHtml: SafeHtml = '';
  telefonoCliente = '';

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ConsentimientoDialogComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: { consentimiento?: Consentimiento },
    private service: ConsentimientosService,
    private clientesService: ClientesService,
    private pacientesService: PacientesService,
    private clinicConfig: ClinicConfigService,
    private sanitizer: DomSanitizer,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService
  ) {
    this.form = this.fb.group({
      cliente_id: ['', Validators.required],
      cliente: [''],
      paciente_id: ['', Validators.required],
      paciente: [''],
      tipo: ['cirugia' as ConsentimientoTipo, Validators.required],
      fecha: [hoyLocalIsoDate(), Validators.required],
      firmado_por: ['', [Validators.required, Validators.maxLength(120)]],
      parentesco: [''],
      staff_uid: [''],
      staff_nombre: [''],
      notas: [''],
      estado: ['vigente'],
    });
  }

  ngOnInit(): void {
    this.clinicConfig
      .nombreClinica$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((n) => {
        this.nombreClinica = n || 'KatzenVet';
        this.refreshPreview();
      });

    const c = this.data?.consentimiento;
    if (c?.id) {
      this.esEdicion = true;
      this.consentimientoId = c.id;
      this.form.patchValue({
        cliente_id: c.cliente_id,
        cliente: c.cliente || '',
        paciente_id: c.paciente_id,
        paciente: c.paciente || '',
        tipo: c.tipo,
        fecha: c.fecha || hoyLocalIsoDate(),
        firmado_por: c.firmado_por || '',
        parentesco: c.parentesco || '',
        staff_uid: c.staff_uid || '',
        staff_nombre: c.staff_nombre || '',
        notas: c.notas || '',
        estado: c.estado || 'vigente',
      });
      if (c.paciente_id) {
        void this.loadAlergias(c.paciente_id);
      }
      if (c.cliente_id) {
        void this.loadTelefonoCliente(c.cliente_id);
      }
    }

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshPreview());
    this.form
      .get('cliente_id')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        if (id) void this.loadTelefonoCliente(String(id));
        else this.telefonoCliente = '';
      });
    this.refreshPreview();
  }

  private documentoDatosDesdeForm(): ConsentimientoDocumentoDatos {
    const v = this.form.getRawValue();
    return {
      tipo: (v.tipo || 'otro') as ConsentimientoTipo,
      clinica: this.nombreClinica,
      paciente: v.paciente,
      dueno: v.cliente,
      fecha: v.fecha,
      veterinario: v.staff_nombre,
      procedimiento: v.notas,
      firmado_por: v.firmado_por,
      parentesco: v.parentesco,
    };
  }

  private refreshPreview(): void {
    const view = buildConsentimientoDocumentoView(this.documentoDatosDesdeForm());
    const html = `<style>${cssConsentimientoDocumento()}</style>${htmlCuerpoConsentimientoDocumento(view)}`;
    this.previewCompactHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  verMachoteCompleto(): void {
    const data: ConsentimientoPreviewDialogData = {
      datos: this.documentoDatosDesdeForm(),
      telefono: this.telefonoCliente,
    };
    this.dialog.open(ConsentimientoPreviewDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data,
    });
  }

  private async loadTelefonoCliente(clienteId: string): Promise<void> {
    try {
      const cli = await firstValueFrom(this.clientesService.getCliente(clienteId).pipe(take(1)));
      this.telefonoCliente = String(cli?.telefono || '').trim();
    } catch {
      this.telefonoCliente = '';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    const fromSel = normalizeAlergias(sel?.pacienteData);
    if (fromSel.length) {
      this.alergiasPaciente = fromSel;
      return;
    }
    if (sel?.paciente_id) {
      void this.loadAlergias(sel.paciente_id);
    } else {
      this.alergiasPaciente = [];
    }
  }

  private async loadAlergias(pacienteId: string): Promise<void> {
    try {
      const p = await firstValueFrom(this.pacientesService.getPaciente(pacienteId).pipe(take(1)));
      this.alergiasPaciente = normalizeAlergias(p);
    } catch {
      this.alergiasPaciente = [];
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.loading = true;
    this.loadingService.show(this.esEdicion ? LOADING_MESSAGES.updating : LOADING_MESSAGES.saving);
    try {
      if (this.esEdicion && this.consentimientoId) {
        await this.service.actualizar(this.consentimientoId, {
          cliente_id: v.cliente_id,
          cliente: v.cliente,
          paciente_id: v.paciente_id,
          paciente: v.paciente,
          tipo: v.tipo,
          fecha: v.fecha,
          firmado_por: String(v.firmado_por || '').trim(),
          parentesco: v.parentesco || '',
          staff_uid: v.staff_uid || undefined,
          staff_nombre: v.staff_nombre || undefined,
          notas: v.notas || '',
          estado: v.estado,
        });
      } else {
        await this.service.crear({
          cliente_id: v.cliente_id,
          cliente: v.cliente,
          paciente_id: v.paciente_id,
          paciente: v.paciente,
          tipo: v.tipo,
          fecha: v.fecha,
          firmado_por: String(v.firmado_por || '').trim(),
          parentesco: v.parentesco || '',
          staff_uid: v.staff_uid || undefined,
          staff_nombre: v.staff_nombre || undefined,
          notas: v.notas || '',
          estado: v.estado,
        });
      }
      Swal.fire({
        icon: 'success',
        title: this.esEdicion ? 'Consentimiento actualizado' : 'Consentimiento registrado',
        timer: 1400,
        showConfirmButton: false,
      });
      this.dialogRef.close(true);
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar consentimiento'), 'error');
    } finally {
      this.loading = false;
      this.loadingService.hide();
    }
  }
}
