import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { CitasService } from '../citas/citas.service';
import { ClienteDialogComponent } from '../clientes/cliente-dialog.component';
import { ClientesService } from '../clientes/clientes.service';
import { ADMIN_DIALOG_DETAIL, ADMIN_DIALOG_FORM } from '../core/config/admin-ui.config';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService } from '../core/loading.service';
import { Cliente, Paciente } from '../core/models';
import { getClienteDisplayLabel, getClienteNombreCompleto } from '../core/utils/cliente-search.util';
import { filtrarPacientesDelCliente, getPacienteDisplayLabel } from '../core/utils/paciente-search.util';
import { PacienteAdminDialogComponent } from '../pacientes-admin/paciente-admin-dialog.component';
import { PacientesService } from '../pacientes/pacientes.service';
import { filtrarClientesTelefonoPrimero } from '../shared/admin/cliente-picker-search.util';
import { AccionAltaRapida, AltaRapidaContexto, abrirAtencionAltaRapida } from './alta-rapida-atencion.helper';

export interface AccionChip {
  id: AccionAltaRapida;
  label: string;
  icon: string;
  hint: string;
}

@Component({
  selector: 'app-alta-rapida-dialog',
  templateUrl: './alta-rapida-dialog.component.html',
  styleUrls: ['./alta-rapida-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AltaRapidaDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  paso = 1;
  clienteSearch = new FormControl<string | Cliente>('');
  clientes: Cliente[] = [];
  pacientes: Paciente[] = [];
  filteredClientes!: Observable<Cliente[]>;
  cliente: Cliente | null = null;
  paciente: Paciente | null = null;
  avanzando = false;

  readonly acciones: AccionChip[] = [
    { id: 'consulta', label: 'Consulta', icon: 'medical_services', hint: 'Abrir historial clínico' },
    { id: 'vacuna', label: 'Vacuna', icon: 'vaccines', hint: 'Registrar vacuna' },
    { id: 'banio', label: 'Baño', icon: 'spa', hint: 'Peluquería / baño' },
    { id: 'pension', label: 'Pensión', icon: 'hotel', hint: 'Dejar en pensión' },
    { id: 'cita', label: 'Solo cita', icon: 'event', hint: 'Agendar para después' },
  ];

  constructor(
    private dialogRef: MatDialogRef<AltaRapidaDialogComponent>,
    private dialog: MatDialog,
    private router: Router,
    private clientesService: ClientesService,
    private pacientesService: PacientesService,
    private citasService: CitasService,
    private loadingService: LoadingService,
    private errorMessages: ErrorMessagesService
  ) {}

  ngOnInit(): void {
    this.filteredClientes = this.clienteSearch.valueChanges.pipe(
      startWith(''),
      map((value) => filtrarClientesTelefonoPrimero(this.clientes, this.textoBusqueda(value)))
    );
    this.clientesService
      .getClientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => (this.clientes = (rows || []).filter((c) => c && c.activo !== false)),
      });
    this.pacientesService
      .getPacientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => (this.pacientes = rows || []),
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get mascotasDelDueno(): Paciente[] {
    return filtrarPacientesDelCliente(this.pacientes, this.cliente?.id, '');
  }

  get puedePaso2(): boolean {
    return !!this.cliente?.id;
  }

  get puedePaso3(): boolean {
    return !!this.cliente?.id && !!this.paciente?.id;
  }

  displayCliente = (c: Cliente | string | null): string => {
    if (!c || typeof c === 'string') return typeof c === 'string' ? c : '';
    return getClienteDisplayLabel(c);
  };

  nombreCliente(c: Cliente | null): string {
    return getClienteNombreCompleto(c);
  }

  etiquetaMascota(p: Paciente): string {
    return getPacienteDisplayLabel(p);
  }

  elegirCliente(c: Cliente): void {
    if (!c?.id) return;
    this.cliente = c;
    this.paciente = null;
    this.clienteSearch.setValue(c, { emitEvent: false });
  }

  elegirMascota(p: Paciente): void {
    if (!p?.id) return;
    this.paciente = p;
  }

  irPaso(n: number): void {
    if (n === 2 && !this.puedePaso2) return;
    if (n === 3 && !this.puedePaso3) return;
    this.paso = n;
  }

  atras(): void {
    if (this.paso > 1) this.paso -= 1;
  }

  siguiente(): void {
    if (this.paso === 1 && this.puedePaso2) this.paso = 2;
    else if (this.paso === 2 && this.puedePaso3) this.paso = 3;
  }

  async crearDueno(): Promise<void> {
    const prefill = this.textoBusqueda(this.clienteSearch.value);
    const ref = this.dialog.open(ClienteDialogComponent, {
      ...ADMIN_DIALOG_DETAIL,
      autoFocus: '[cdkFocusInitial]',
      data: { modo: 'rapido', prefill },
    });
    const result = (await firstValueFrom(ref.afterClosed())) as (Cliente & { id?: string }) | undefined;
    if (!result) return;
    this.loadingService.show('Guardando dueño…');
    try {
      const id = await this.clientesService.guardarCliente({ ...result, id: '' });
      const creado = { ...result, id, activo: true };
      this.clientes = [...this.clientes, creado];
      this.elegirCliente(creado);
      this.paso = 2;
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar cliente'), 'error');
    } finally {
      this.loadingService.hide();
    }
  }

  async crearMascota(): Promise<void> {
    if (!this.cliente?.id) {
      Swal.fire('Falta el dueño', 'Primero elige o registra al dueño.', 'info');
      return;
    }
    const ref = this.dialog.open(PacienteAdminDialogComponent, {
      ...ADMIN_DIALOG_DETAIL,
      autoFocus: '[cdkFocusInitial]',
      data: { modo: 'rapido', cliente: this.cliente },
    });
    const result = (await firstValueFrom(ref.afterClosed())) as Paciente | undefined;
    if (!result) return;
    this.loadingService.show('Guardando mascota…');
    try {
      const id = await this.pacientesService.crearPaciente(result);
      const creado: Paciente = { ...result, id, activo: true };
      this.pacientes = [...this.pacientes, creado];
      this.elegirMascota(creado);
      this.paso = 3;
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar paciente'), 'error');
    } finally {
      this.loadingService.hide();
    }
  }

  async elegirAccion(accion: AccionAltaRapida): Promise<void> {
    if (!this.puedePaso3 || this.avanzando) return;
    const ctx: AltaRapidaContexto = {
      cliente_id: String(this.cliente!.id),
      cliente: this.nombreCliente(this.cliente),
      paciente_id: String(this.paciente!.id || ''),
      paciente: this.paciente!.nombre || '',
    };
    this.avanzando = true;
    this.dialogRef.close({ ok: true, ...ctx, accion });
    try {
      await abrirAtencionAltaRapida(
        {
          dialog: this.dialog,
          router: this.router,
          citasService: this.citasService,
          loadingService: this.loadingService,
          errorMessages: this.errorMessages,
        },
        accion,
        ctx
      );
    } finally {
      this.avanzando = false;
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  private textoBusqueda(value: string | Cliente | null): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return getClienteNombreCompleto(value);
  }
}

export function abrirAltaRapidaDialog(dialog: MatDialog) {
  return dialog.open(AltaRapidaDialogComponent, {
    ...ADMIN_DIALOG_FORM,
    width: '720px',
    disableClose: true,
  });
}
