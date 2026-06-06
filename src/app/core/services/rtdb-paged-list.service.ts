import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

export interface RtdbPageResult<T> {
  items: (T & { id: string })[];
  hasMore: boolean;
  oldestKey: string | null;
}

@Injectable({ providedIn: 'root' })
export class RtdbPagedListService {
  constructor(private db: AngularFireDatabase) {}

  /**
   * Paginación por push-key (cronológica). Devuelve items más recientes primero.
   * @param endBeforeKey clave exclusiva: trae registros anteriores a esta key.
   */
  fetchPage<T extends object>(
    path: string,
    pageSize: number,
    endBeforeKey?: string | null,
    isActive: (item: T) => boolean = () => true
  ): Observable<RtdbPageResult<T>> {
    return new Observable(subscriber => {
      const extra = endBeforeKey ? 1 : 0;
      const list = this.db.list<T>(path, ref => {
        let query = ref.orderByKey();
        if (endBeforeKey) {
          query = query.endAt(endBeforeKey);
        }
        return query.limitToLast(pageSize + extra);
      });

      const sub = list.snapshotChanges().subscribe({
        next: actions => {
          let rows = actions.map(a => ({
            id: a.key as string,
            ...(a.payload.val() as T)
          }));

          if (endBeforeKey) {
            rows = rows.filter(r => r.id !== endBeforeKey);
          }

          rows = rows.filter(isActive);
          rows.reverse();

          const hasMore = actions.length >= pageSize + extra;
          const oldestKey = rows.length ? rows[rows.length - 1].id : null;

          subscriber.next({ items: rows, hasMore, oldestKey });
          subscriber.complete();
        },
        error: err => subscriber.error(err)
      });

      return () => sub.unsubscribe();
    });
  }
}
