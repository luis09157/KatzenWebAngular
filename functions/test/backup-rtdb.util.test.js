const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const util = require('../lib/backup-rtdb.util');

describe('backup-rtdb.util (spec 067)', () => {
  it('backupPathsForDate: domingo 03:00 Monterrey → carpeta YYYY/MM/DD del mismo día', () => {
    // 2026-09-06 03:00 America/Monterrey (UTC-6) = 09:00Z
    const p = util.backupPathsForDate(new Date('2026-09-06T09:00:00Z'));
    assert.equal(p.ymd, '2026-09-06');
    assert.equal(p.dir, 'backups/rtdb/2026/09/06');
    assert.equal(p.dataPath, 'backups/rtdb/2026/09/06/Katzen.json.gz');
    assert.equal(p.manifestPath, 'backups/rtdb/2026/09/06/manifest.json');
  });

  it('backupPathsForDate: usa TZ clínica, no UTC (23:30 Monterrey sigue siendo el mismo día)', () => {
    // 2026-09-06 23:30 Monterrey = 2026-09-07 05:30Z
    const p = util.backupPathsForDate(new Date('2026-09-07T05:30:00Z'));
    assert.equal(p.ymd, '2026-09-06');
    assert.equal(p.dir, 'backups/rtdb/2026/09/06');
  });

  it('parseBackupDateFromPath: acepta rutas del prefijo y rechaza el resto', () => {
    const d = util.parseBackupDateFromPath('backups/rtdb/2026/07/12/Katzen.json.gz');
    assert.equal(d.toISOString(), '2026-07-12T00:00:00.000Z');
    assert.equal(util.parseBackupDateFromPath('backups/rtdb/2026/07/12/manifest.json').getUTCDate(), 12);
    assert.equal(util.parseBackupDateFromPath('Mascotas/foto.png'), null);
    assert.equal(util.parseBackupDateFromPath('backups/rtdb/manual/Katzen.json.gz'), null);
    assert.equal(util.parseBackupDateFromPath('backups/rtdb/2026/13/40/x.gz'), null);
    assert.equal(util.parseBackupDateFromPath('backups/rtdb/2026/02/30/x.gz'), null);
  });

  it('isExpiredBackup: 8 semanas = 56 días; 56 se conserva, 57 expira', () => {
    const now = new Date('2026-09-06T09:00:00Z'); // 2026-09-06 Monterrey
    assert.equal(util.isExpiredBackup('backups/rtdb/2026/07/12/Katzen.json.gz', now), false); // 56 días
    assert.equal(util.isExpiredBackup('backups/rtdb/2026/07/11/Katzen.json.gz', now), true); // 57 días
    assert.equal(util.isExpiredBackup('backups/rtdb/2026/09/06/Katzen.json.gz', now), false);
    assert.equal(util.isExpiredBackup('otro/prefijo/2020/01/01/x.gz', now), false);
  });

  it('selectExpiredBackupPaths: borra solo viejos con fecha válida; nunca hoy ni rutas raras', () => {
    const now = new Date('2026-09-06T09:00:00Z');
    const paths = [
      'backups/rtdb/2026/09/06/Katzen.json.gz',
      'backups/rtdb/2026/09/06/manifest.json',
      'backups/rtdb/2026/08/30/Katzen.json.gz',
      'backups/rtdb/2026/07/12/Katzen.json.gz', // 56 días → se queda
      'backups/rtdb/2026/07/05/Katzen.json.gz', // 63 días → expira
      'backups/rtdb/2026/07/05/manifest.json',
      'backups/rtdb/2026/01/04/Katzen.json.gz',
      'backups/rtdb/manual/Katzen.json.gz', // sin fecha → se respeta
      'Inventario/Productos/p1/foto.png'
    ];
    const expired = util.selectExpiredBackupPaths(paths, now);
    assert.deepEqual(expired, [
      'backups/rtdb/2026/07/05/Katzen.json.gz',
      'backups/rtdb/2026/07/05/manifest.json',
      'backups/rtdb/2026/01/04/Katzen.json.gz'
    ]);
  });

  it('selectExpiredBackupPaths: retención configurable (1 semana)', () => {
    const now = new Date('2026-09-06T09:00:00Z');
    const expired = util.selectExpiredBackupPaths(
      ['backups/rtdb/2026/08/30/Katzen.json.gz', 'backups/rtdb/2026/08/29/Katzen.json.gz'],
      now,
      1
    );
    assert.deepEqual(expired, ['backups/rtdb/2026/08/29/Katzen.json.gz']);
  });

  it('countTopLevelNodes + buildManifest: conteo por nodo de primer nivel', () => {
    const root = {
      Cliente: { c1: {}, c2: {} },
      Mascota: { m1: {}, m2: {}, m3: {} },
      Config: { Vacunacion: {} },
      Flag: true
    };
    assert.deepEqual(util.countTopLevelNodes(root), { Cliente: 2, Mascota: 3, Config: 1, Flag: 1 });
    assert.deepEqual(util.countTopLevelNodes(null), {});

    const now = new Date('2026-09-06T09:00:00Z');
    const manifest = util.buildManifest({
      now,
      paths: util.backupPathsForDate(now),
      bytesJson: 1000,
      bytesGzip: 120,
      root
    });
    assert.equal(manifest.version, 1);
    assert.equal(manifest.rootNode, 'Katzen');
    assert.equal(manifest.ymd, '2026-09-06');
    assert.equal(manifest.topLevelNodes, 4);
    assert.equal(manifest.bytesJson, 1000);
    assert.equal(manifest.bytesGzip, 120);
    assert.equal(manifest.retentionWeeks, 8);
    assert.equal(manifest.createdAt, now.toISOString());
  });
});
