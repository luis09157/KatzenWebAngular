import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { ClienteDialogComponent } from '../../clientes/cliente-dialog.component';
import { ClientesService } from '../../clientes/clientes.service';
import { ADMIN_DIALOG_DETAIL } from '../../core/config/admin-ui.config';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { LoadingService } from '../../core/loading.service';
import { Cliente, Paciente } from '../../core/models';
import { getClienteNombreCompleto } from '../../core/utils/cliente-search.util';
import { PacienteAdminDialogComponent } from '../../pacientes-admin/paciente-admin-dialog.component';
import { PacientesService } from '../../pacientes/pacientes.service';
import { ClientePacientePickerComponent } from './cliente-paciente-picker.component';

/** Dependencias para abrir alta rápida desde cualquier diálogo con picker. */
export interface AltaRapidaPickerDeps {
  dialog: MatDialog;
  clientesService: ClientesService;
  pacientesService: PacientesService;
  loadingService: LoadingService;
  errorMessages: ErrorMessagesService;
  picker?: ClientePacientePickerComponent;
}

/** «Cliente nuevo»: diálogo modo rápido, guarda y pregunta si trae mascota. */
export async function crearClienteRapidoDesdePicker(deps: AltaRapidaPickerDeps, prefill = ''): Promise<void> {
  const ref = deps.dialog.open(ClienteDialogComponent, {
    ...ADMIN_DIALOG_DETAIL,
    autoFocus: '[cdkFocusInitial]',
    data: { modo: 'rapido', prefill },
  });
  const result = (await firstValueFrom(ref.afterClosed())) as (Cliente & { id?: string }) | undefined;
  if (!result) return;

  let cliente: Cliente;
  deps.loadingService.show('Guardando cliente…');
  try {
    const id = await deps.clientesService.guardarCliente({ ...result, id: '' });
    cliente = { ...result, id, activo: true };
  } catch (error) {
    Swal.fire('Error', deps.errorMessages.getUserMessage(error, 'guardar cliente'), 'error');
    return;
  } finally {
    deps.loadingService.hide();
  }

  deps.picker?.seleccionarClienteExterno(cliente);
  const nombre = getClienteNombreCompleto(cliente) || 'el cliente';
  const ask = await Swal.fire({
    icon: 'question',
    title: '¿Trae mascota?',
    text: `Puedes registrar la mascota de ${nombre} ahora o después.`,
    showCancelButton: true,
    confirmButtonText: 'Sí, registrar mascota',
    cancelButtonText: 'Ahora no',
  });
  if (ask.isConfirmed) {
    await crearMascotaRapidaDesdePicker(deps, cliente);
  }
}

/** «Agregar mascota»: diálogo modo rápido para el dueño actual. */
export async function crearMascotaRapidaDesdePicker(
  deps: AltaRapidaPickerDeps,
  cliente?: Cliente | null
): Promise<void> {
  const dueno = cliente?.id ? cliente : null;
  if (!dueno?.id) {
    Swal.fire('Falta el dueño', 'Primero elige o crea al dueño de la mascota.', 'info');
    return;
  }
  const ref = deps.dialog.open(PacienteAdminDialogComponent, {
    ...ADMIN_DIALOG_DETAIL,
    autoFocus: '[cdkFocusInitial]',
    data: { modo: 'rapido', cliente: dueno },
  });
  const result = (await firstValueFrom(ref.afterClosed())) as Paciente | undefined;
  if (!result) return;

  deps.loadingService.show('Guardando mascota…');
  try {
    const id = await deps.pacientesService.crearPaciente(result);
    const paciente: Paciente = { ...result, id, activo: true };
    deps.picker?.seleccionarPacienteExterno(paciente, dueno);
  } catch (error) {
    Swal.fire('Error', deps.errorMessages.getUserMessage(error, 'guardar paciente'), 'error');
  } finally {
    deps.loadingService.hide();
  }
}
