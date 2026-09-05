import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { BanioDialogComponent } from '../banios/banio-dialog.component';
import { CitaDialogComponent } from '../citas/cita-dialog.component';
import { CitasService } from '../citas/citas.service';
import { ADMIN_DIALOG_CONFIG, ADMIN_DIALOG_FORM } from '../core/config/admin-ui.config';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LOADING_MESSAGES, LoadingService } from '../core/loading.service';
import { HistorialDialogComponent } from '../historiales/historial-dialog.component';
import { PensionDialogComponent } from '../pension/pension-dialog.component';
import { VacunaDialogComponent } from '../vacunas/vacuna-dialog.component';

export type AccionAltaRapida = 'consulta' | 'vacuna' | 'banio' | 'pension' | 'cita';

export interface AltaRapidaContexto {
  cliente_id: string;
  cliente: string;
  paciente_id: string;
  paciente: string;
}

export interface AltaRapidaAtencionDeps {
  dialog: MatDialog;
  router: Router;
  citasService: CitasService;
  loadingService: LoadingService;
  errorMessages: ErrorMessagesService;
}

/** Prefill igual que expediente (`pacientes.component.ts` → `agregarVacuna()`). */
export function dataAtencionDesdeContexto(ctx: AltaRapidaContexto): Record<string, string> {
  return {
    cliente_id: ctx.cliente_id,
    idCliente: ctx.cliente_id,
    cliente: ctx.cliente,
    paciente_id: ctx.paciente_id,
    idPaciente: ctx.paciente_id,
    paciente: ctx.paciente,
  };
}

export function rutaExpedientePaciente(pacienteId: string): {
  commands: string[];
  extras: { queryParams: { id: string } };
} {
  return {
    commands: ['/admin/paciente'],
    extras: { queryParams: { id: pacienteId } },
  };
}

export async function abrirAtencionAltaRapida(
  deps: AltaRapidaAtencionDeps,
  accion: AccionAltaRapida,
  ctx: AltaRapidaContexto
): Promise<void> {
  const ids = dataAtencionDesdeContexto(ctx);
  if (accion === 'consulta') {
    await firstValueFrom(
      deps.dialog
        .open(HistorialDialogComponent, {
          ...ADMIN_DIALOG_FORM,
          data: { historial: null, modoVer: false, ...ids },
        })
        .afterClosed()
    );
  } else if (accion === 'vacuna') {
    await firstValueFrom(
      deps.dialog
        .open(VacunaDialogComponent, {
          ...ADMIN_DIALOG_FORM,
          data: ids,
        })
        .afterClosed()
    );
  } else if (accion === 'banio') {
    await firstValueFrom(
      deps.dialog
        .open(BanioDialogComponent, {
          ...ADMIN_DIALOG_FORM,
          data: ids,
        })
        .afterClosed()
    );
  } else if (accion === 'pension') {
    await firstValueFrom(
      deps.dialog
        .open(PensionDialogComponent, {
          ...ADMIN_DIALOG_CONFIG,
          width: '720px',
          disableClose: true,
          data: ids,
        })
        .afterClosed()
    );
  } else {
    const result = await firstValueFrom(
      deps.dialog
        .open(CitaDialogComponent, {
          ...ADMIN_DIALOG_CONFIG,
          data: {
            modoVer: false,
            cita: {
              cliente_id: ctx.cliente_id,
              paciente_id: ctx.paciente_id,
              paciente: ctx.paciente,
              nombreCliente: ctx.cliente,
            },
          },
        })
        .afterClosed()
    );
    if (result) {
      deps.loadingService.show(LOADING_MESSAGES.saving);
      try {
        await deps.citasService.guardarCita(result);
        await Swal.fire({ icon: 'success', title: 'Cita guardada', timer: 1600, showConfirmButton: false });
      } catch (error) {
        await Swal.fire('Error', deps.errorMessages.getUserMessage(error, 'guardar cita'), 'error');
      } finally {
        deps.loadingService.hide();
      }
    }
  }
  const nav = rutaExpedientePaciente(ctx.paciente_id);
  await deps.router.navigate(nav.commands, nav.extras);
}
