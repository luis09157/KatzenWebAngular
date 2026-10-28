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
import {
  filtrarPacientesDelCliente,
  filtrarPacientesPickerDual,
  getPacienteBusquedaExpedienteLabel,
  getPacienteNombre,
  getPacientePickerRazaEdadLabel,
  ordenarPacientesPorNombre,
} from '../core/utils/paciente-search.util';
import { getPacienteClienteId } from '../core/utils/paciente-cliente.util';
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
  /** 2026-10-27 — se busca por mascota (también por dueño o teléfono), como en todo el sistema. */
  clienteSearch = new FormControl<string | Cliente | Paciente>('');
  clientes: Cliente[] = [];
  pacientes: Paciente[] = [];
  filteredClientes!: Observable<Cliente[]>;
  filteredMascotas!: Observable<Paciente[]>;
  cliente: Cliente | null = null;
  paciente: Paciente | null = null;
  avanzando = false;

  readonly acciones: AccionChip[] = [
    { id: 'consulta', label: 'Consulta', icon: 'medical_services', hint: 'Abrir historial clínico' },
    { id: 'vacuna', label: 'Vacuna', icon: 'vaccines', hint: 'Registrar vacuna' },
    { id: 'banio', label: 'Baño / corte', icon: 'spa', hint: 'Peluquería, baño o corte de pelo' },
    { id: 'pension', label: 'Pensión', icon: 'hotel', hint: 'Hospedaje por días (no es baño)' },
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
      map((value) => {
        const q = this.textoBusqueda(value).trim();
        return q ? filtrarClientesTelefonoPrimero(this.clientes, q).slice(0, 8) : [];
      })
    );
    this.filteredMascotas = this.clienteSearch.valueChanges.pipe(
      startWith(''),
      map((value) => {
        const q = this.textoBusqueda(value).trim();
        if (!q) return [];
        return ordenarPacientesPorNombre(
          filtrarPacientesPickerDual(this.pacientes, null, q, (p) => this.duenoParaBuscar(p)),
          q
        ).slice(0, 30);
      })
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

  displayCliente = (c: Cliente | Paciente | string | null): string => {
    if (!c || typeof c === 'string') return typeof c === 'string' ? c : '';
    if (this.esPaciente(c)) return getPacienteNombre(c as Paciente);
    return getClienteDisplayLabel(c as Cliente);
  };

  /** Opción de mascota: nombre en negritas + «especie · raza · edad · dueño». */
  nombreOpcionMascota(p: Paciente): string {
    return getPacienteNombre(p) || 'Sin nombre';
  }

  detalleOpcionMascota(p: Paciente): string {
    const full = getPacienteBusquedaExpedienteLabel(p, this.nombreDuenoDe(p));
    const nombre = this.nombreOpcionMascota(p);
    return full.startsWith(`${nombre} `) ? full.slice(nombre.length).trim() : full;
  }

  /** Elegir la mascota llena el dueño solo y pasa directo a «¿Qué viene a hacer?». */
  elegirOpcion(valor: Cliente | Paciente): void {
    if (!valor) return;
    if (!this.esPaciente(valor)) {
      this.elegirCliente(valor as Cliente);
      this.paso = 2;
      return;
    }
    const p = valor as Paciente;
    const dueno = this.clientes.find((c) => String(c.id) === getPacienteClienteId(p));
    if (!dueno) {
      Swal.fire('Mascota sin dueño', 'Esta mascota no tiene dueño registrado. Búscala por el dueño o regístralo.', 'info');
      this.clienteSearch.setValue('', { emitEvent: true });
      return;
    }
    this.cliente = dueno;
    this.paciente = p;
    this.clienteSearch.setValue(p, { emitEvent: false });
    this.paso = 3;
  }

  /** Las opciones de mascota salen de `pacientes`: se distinguen por referencia (no por campos). */
  private esPaciente(v: unknown): boolean {
    return !!v && typeof v === 'object' && this.pacientes.includes(v as Paciente);
  }

  private nombreDuenoDe(p: Paciente): string {
    const id = getPacienteClienteId(p);
    const c = id ? this.clientes.find((x) => String(x.id) === id) : undefined;
    return c ? getClienteNombreCompleto(c) : '';
  }

  /** Nombre y teléfono del dueño: también se encuentra la mascota escribiendo cualquiera de los dos. */
  private duenoParaBuscar(p: Paciente): string {
    const id = getPacienteClienteId(p);
    const c = id ? this.clientes.find((x) => String(x.id) === id) : undefined;
    return c ? `${getClienteNombreCompleto(c)} ${String(c.telefono || '')}`.trim() : '';
  }

  nombreCliente(c: Cliente | null): string {
    return getClienteNombreCompleto(c);
  }

  /** Igual que en los buscadores: «Jack — Canino · Criollo · 3 años». */
  etiquetaMascota(p: Paciente): string {
    return getPacientePickerRazaEdadLabel(p);
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

  private textoBusqueda(value: string | Cliente | Paciente | null): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (this.esPaciente(value)) return getPacienteNombre(value as Paciente);
    return getClienteNombreCompleto(value as Cliente);
  }
}

export function abrirAltaRapidaDialog(dialog: MatDialog) {
  return dialog.open(AltaRapidaDialogComponent, {
    ...ADMIN_DIALOG_FORM,
    width: '720px',
    disableClose: true,
  });
}
