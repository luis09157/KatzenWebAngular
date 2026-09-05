/**
 * Respaldo semanal RTDB → Cloud Storage (spec 067).
 *
 * - Lee `Katzen/` completo con Admin SDK (solo lectura; NUNCA escribe en RTDB).
 * - Sube `backups/rtdb/YYYY/MM/DD/Katzen.json.gz` + `manifest.json` al bucket por defecto.
 * - Retención: borra objetos bajo `backups/rtdb/` con más de 8 semanas.
 *
 * NO desplegada hasta autorización de Luis. Deploy exacto:
 *   cd functions && npm run build
 *   firebase deploy --only functions:backupRtdbSemanal
 */
import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { gzipSync } from 'zlib';
import {
  BACKUP_PREFIX,
  BACKUP_RETENTION_WEEKS,
  BACKUP_ROOT_NODE,
  BACKUP_TZ,
  backupPathsForDate,
  buildManifest,
  selectExpiredBackupPaths
} from './backup-rtdb.util';

export interface BackupRunResult {
  dataPath: string;
  manifestPath: string;
  bytesJson: number;
  bytesGzip: number;
  topLevelNodes: number;
  deleted: string[];
  deleteErrors: number;
}

/**
 * Corrida completa. Separada del trigger para poder invocarla desde el emulador
 * (`firebase functions:shell`) o tests de integración sin tocar producción.
 */
export async function runBackupRtdb(now: Date = new Date()): Promise<BackupRunResult> {
  const paths = backupPathsForDate(now, BACKUP_TZ);

  // 1) Lectura única del árbol (solo lectura).
  const snap = await admin.database().ref(BACKUP_ROOT_NODE).once('value');
  const root = snap.val();
  if (root == null) {
    // No inventamos un respaldo vacío silencioso: se registra y se aborta la subida.
    logger.error('backupRtdbSemanal: el nodo raíz está vacío o no se pudo leer; no se sube nada', {
      rootNode: BACKUP_ROOT_NODE
    });
    throw new Error(`Nodo ${BACKUP_ROOT_NODE} vacío: respaldo abortado`);
  }

  const json = JSON.stringify(root);
  const jsonBuf = Buffer.from(json, 'utf8');
  const gz = gzipSync(jsonBuf, { level: 6 });

  // 2) Subida a Storage (bucket por defecto del proyecto).
  const bucket = admin.storage().bucket();
  await bucket.file(paths.dataPath).save(gz, {
    resumable: false,
    contentType: 'application/gzip',
    metadata: {
      cacheControl: 'private, max-age=0',
      metadata: {
        rootNode: BACKUP_ROOT_NODE,
        ymd: paths.ymd,
        bytesJson: String(jsonBuf.byteLength)
      }
    }
  });

  const manifest = buildManifest({
    now,
    paths,
    bytesJson: jsonBuf.byteLength,
    bytesGzip: gz.byteLength,
    root
  });
  await bucket.file(paths.manifestPath).save(JSON.stringify(manifest, null, 2), {
    resumable: false,
    contentType: 'application/json',
    metadata: { cacheControl: 'private, max-age=0' }
  });

  logger.info('backupRtdbSemanal: respaldo subido', {
    dataPath: paths.dataPath,
    bytesJson: manifest.bytesJson,
    bytesGzip: manifest.bytesGzip,
    topLevelNodes: manifest.topLevelNodes
  });

  // 3) Retención: solo objetos bajo el prefijo y con fecha reconocible (> 8 semanas).
  const [files] = await bucket.getFiles({ prefix: BACKUP_PREFIX });
  const expired = selectExpiredBackupPaths(
    files.map((f) => f.name),
    now,
    BACKUP_RETENTION_WEEKS,
    BACKUP_TZ
  );
  const deleted: string[] = [];
  let deleteErrors = 0;
  for (const name of expired) {
    try {
      await bucket.file(name).delete({ ignoreNotFound: true });
      deleted.push(name);
    } catch (err) {
      deleteErrors += 1;
      logger.warn('backupRtdbSemanal: no se pudo borrar respaldo expirado', { name, err });
    }
  }
  if (deleted.length > 0 || deleteErrors > 0) {
    logger.info('backupRtdbSemanal: retención aplicada', {
      deleted: deleted.length,
      deleteErrors,
      retentionWeeks: BACKUP_RETENTION_WEEKS
    });
  }

  return {
    dataPath: paths.dataPath,
    manifestPath: paths.manifestPath,
    bytesJson: manifest.bytesJson,
    bytesGzip: manifest.bytesGzip,
    topLevelNodes: manifest.topLevelNodes,
    deleted,
    deleteErrors
  };
}

/** Domingo 03:00 America/Monterrey. */
export const backupRtdbSemanal = onSchedule(
  {
    schedule: '0 3 * * 0',
    timeZone: BACKUP_TZ,
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 540,
    retryCount: 1
  },
  async () => {
    await runBackupRtdb(new Date());
  }
);
