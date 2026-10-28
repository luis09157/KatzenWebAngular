/**
 * Spec 111 — carga los datos y arma «Para avisar hoy». Se importa con `import()` para no
 * pesar en la carga inicial. Solo lee; no escribe nada.
 */
import { Injector } from '@angular/core';
import { firstValueFrom, take } from 'rxjs';
import { BaniosService } from '../banios/banios.service';
import { CitasService } from '../citas/citas.service';
import { ClientesService } from '../clientes/clientes.service';
import { hoyLocalIsoDate } from '../core/utils/periodo-filtro.util';
import { PacientesService } from '../pacientes/pacientes.service';
import { RecordatoriosService } from '../recordatorios/recordatorios.service';
import { AvisoPendiente, paraAvisarHoy } from './para-avisar.util';

export async function cargarParaAvisar(injector: Injector, hoyIso: string = hoyLocalIsoDate()): Promise<AvisoPendiente[]> {
  const uno = <T>(o: import('rxjs').Observable<T>) => firstValueFrom(o.pipe(take(1)));
  const [banios, citas, recordatorios, pacientes, clientes] = await Promise.all([
    uno(injector.get(BaniosService).getBanios()),
    uno(injector.get(CitasService).getCitas()),
    uno(injector.get(RecordatoriosService).getRecordatorios()),
    uno(injector.get(PacientesService).getPacientes()),
    uno(injector.get(ClientesService).getClientes()),
  ]);
  return paraAvisarHoy(
    {
      banios: banios as unknown as Record<string, any>[],
      citas: citas as Record<string, any>[],
      recordatorios: recordatorios as Record<string, any>[],
      pacientes: pacientes as unknown as Record<string, any>[],
      clientes: clientes as unknown as Record<string, any>[],
    },
    hoyIso
  );
}

/** Cuántos clientes hay para avisar hoy (para el número del menú y la franja de Hoy). */
export async function contarParaAvisar(injector: Injector): Promise<number> {
  try {
    return (await cargarParaAvisar(injector)).length;
  } catch {
    return 0;
  }
}
