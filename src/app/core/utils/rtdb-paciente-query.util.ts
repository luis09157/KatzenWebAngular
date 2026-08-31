import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import {
  dedupeRowsById,
  mapRtdbRow,
  registroPerteneceAPaciente
} from './rtdb-row.util';

/**
 * Lee filas clínicas por paciente_id e idPaciente (shape web + móvil).
 * Staff: ambas queries; si un índice falta, catchError evita tumbar el expediente.
 */
export function queryRowsPorPaciente<T extends object>(
  db: AngularFireDatabase,
  path: string,
  pacienteIds: string | string[],
  fields: string[] = ['paciente_id', 'idPaciente']
): Observable<(T & { id: string })[]> {
  const ids = [
    ...new Set(
      (Array.isArray(pacienteIds) ? pacienteIds : [pacienteIds])
        .map(s => String(s || '').trim())
        .filter(Boolean)
    )
  ];
  if (!ids.length) {
    return of([]);
  }

  const queries = ids.flatMap(id =>
    fields.map(field =>
      db
        .list(path, ref => ref.orderByChild(field).equalTo(id))
        .snapshotChanges()
        .pipe(
          take(1),
          catchError(() => of([]))
        )
    )
  );

  return forkJoin(queries).pipe(
    map(sets =>
      dedupeRowsById(
        sets.flatMap(changes =>
          (
            changes as Array<{ payload: { key: string | null; val: () => unknown } }>
          ).map(c => mapRtdbRow<T>(c.payload.key, c.payload.val()))
        )
      ).filter(row => registroPerteneceAPaciente(row as Record<string, unknown>, ids))
    )
  );
}
