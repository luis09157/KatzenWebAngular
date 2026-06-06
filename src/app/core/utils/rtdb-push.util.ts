import { AngularFireDatabase } from '@angular/fire/compat/database';

/** Persiste el push-key como propiedad `id` en el nodo RTDB (paridad con clientes/citas). */
export async function stampRtdbIdAfterPush(
  db: AngularFireDatabase,
  objectPath: string,
  key: string | null | undefined,
  extraFields: Record<string, unknown> = {}
): Promise<string | null> {
  if (!key) {
    return null;
  }
  await db.object(`${objectPath}/${key}`).update({ id: key, ...extraFields });
  return key;
}
