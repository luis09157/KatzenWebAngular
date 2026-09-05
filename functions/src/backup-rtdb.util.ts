/**
 * Helpers puros del respaldo semanal RTDB → Storage (spec 067).
 * Sin Firebase: testeable con node:test (`functions/test/backup-rtdb.util.test.js`).
 */

export const BACKUP_TZ = 'America/Monterrey';
export const BACKUP_PREFIX = 'backups/rtdb/';
export const BACKUP_DATA_FILE = 'Katzen.json.gz';
export const BACKUP_MANIFEST_FILE = 'manifest.json';
export const BACKUP_RETENTION_WEEKS = 8;
export const BACKUP_ROOT_NODE = 'Katzen';

const DAY_MS = 86400000;

export interface BackupPaths {
  /** `backups/rtdb/YYYY/MM/DD` (sin slash final). */
  dir: string;
  /** `backups/rtdb/YYYY/MM/DD/Katzen.json.gz` */
  dataPath: string;
  /** `backups/rtdb/YYYY/MM/DD/manifest.json` */
  manifestPath: string;
  /** `YYYY-MM-DD` en TZ clínica. */
  ymd: string;
}

export interface BackupManifest {
  version: 1;
  rootNode: string;
  dataFile: string;
  createdAt: string;
  ymd: string;
  timeZone: string;
  bytesJson: number;
  bytesGzip: number;
  topLevelNodes: number;
  nodeCounts: Record<string, number>;
  retentionWeeks: number;
}

/** YYYY-MM-DD en la TZ indicada. */
export function ymdInTimeZone(date: Date, timeZone: string = BACKUP_TZ): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return fmt.format(date);
}

/** Rutas en Storage para la corrida de una fecha dada (TZ clínica). */
export function backupPathsForDate(date: Date, timeZone: string = BACKUP_TZ): BackupPaths {
  const ymd = ymdInTimeZone(date, timeZone);
  const [y, m, d] = ymd.split('-');
  const dir = `${BACKUP_PREFIX}${y}/${m}/${d}`;
  return {
    dir,
    dataPath: `${dir}/${BACKUP_DATA_FILE}`,
    manifestPath: `${dir}/${BACKUP_MANIFEST_FILE}`,
    ymd
  };
}

/**
 * Extrae la fecha (UTC medianoche) de una ruta `backups/rtdb/YYYY/MM/DD/...`.
 * Devuelve null si la ruta no pertenece al prefijo o no tiene fecha válida.
 */
export function parseBackupDateFromPath(path: string): Date | null {
  if (!path.startsWith(BACKUP_PREFIX)) return null;
  const rest = path.slice(BACKUP_PREFIX.length);
  const m = rest.match(/^(\d{4})\/(\d{2})\/(\d{2})\//);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const ms = Date.UTC(y, mo - 1, d);
  const check = new Date(ms);
  if (check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
  return check;
}

function ymdToUtcMs(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Días de calendario (TZ clínica) entre la fecha del respaldo y hoy. */
export function backupAgeDays(path: string, now: Date, timeZone: string = BACKUP_TZ): number | null {
  const date = parseBackupDateFromPath(path);
  if (!date) return null;
  const todayMs = ymdToUtcMs(ymdInTimeZone(now, timeZone));
  return Math.round((todayMs - date.getTime()) / DAY_MS);
}

/** true si el respaldo tiene más de `retentionWeeks` semanas (estricto: > 7*semanas días). */
export function isExpiredBackup(
  path: string,
  now: Date,
  retentionWeeks: number = BACKUP_RETENTION_WEEKS,
  timeZone: string = BACKUP_TZ
): boolean {
  const age = backupAgeDays(path, now, timeZone);
  if (age == null) return false;
  return age > retentionWeeks * 7;
}

/**
 * Filtra rutas a borrar. Nunca incluye la corrida de hoy ni rutas fuera del prefijo
 * o sin fecha reconocible (se dejan intactas: no adivinamos).
 */
export function selectExpiredBackupPaths(
  paths: string[],
  now: Date,
  retentionWeeks: number = BACKUP_RETENTION_WEEKS,
  timeZone: string = BACKUP_TZ
): string[] {
  const today = ymdInTimeZone(now, timeZone).replace(/-/g, '/');
  return paths.filter((p) => {
    if (p.startsWith(`${BACKUP_PREFIX}${today}/`)) return false;
    return isExpiredBackup(p, now, retentionWeeks, timeZone);
  });
}

/** Conteo de hijos directos por nodo de primer nivel (`Katzen/Cliente` → N registros). */
export function countTopLevelNodes(root: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!root || typeof root !== 'object' || Array.isArray(root)) return out;
  for (const [key, value] of Object.entries(root as Record<string, unknown>)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = Object.keys(value as Record<string, unknown>).length;
    } else {
      out[key] = 1;
    }
  }
  return out;
}

export function buildManifest(input: {
  now: Date;
  paths: BackupPaths;
  bytesJson: number;
  bytesGzip: number;
  root: unknown;
  timeZone?: string;
  retentionWeeks?: number;
}): BackupManifest {
  const nodeCounts = countTopLevelNodes(input.root);
  return {
    version: 1,
    rootNode: BACKUP_ROOT_NODE,
    dataFile: BACKUP_DATA_FILE,
    createdAt: input.now.toISOString(),
    ymd: input.paths.ymd,
    timeZone: input.timeZone ?? BACKUP_TZ,
    bytesJson: input.bytesJson,
    bytesGzip: input.bytesGzip,
    topLevelNodes: Object.keys(nodeCounts).length,
    nodeCounts,
    retentionWeeks: input.retentionWeeks ?? BACKUP_RETENTION_WEEKS
  };
}
