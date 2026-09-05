# Tasks: Respaldo semanal RTDB → Storage

**Spec:** `specs/067-respaldo-rtdb/spec.md`  
**Plan:** `specs/067-respaldo-rtdb/plan.md`  
**Nivel de cambio:** **L3** (Cloud Function programada; lee producción completa; escribe Storage)

---

## Implementación

### Setup

- [x] Carpeta spec creada desde plantillas; alcance = PLAN-UX § Extras #6
- [x] `constitution.md` + `sdd-workflow.mdc` leídos (aislamiento prod; deploy solo con Luis)
- [ ] Plan aprobado por Luis (pendiente de lectura)

### Backend

- [x] `functions/src/backup-rtdb.util.ts` — helpers puros (rutas por fecha TZ, parseo, retención 8 semanas, manifest)
- [x] `functions/src/backup-rtdb.ts` — `runBackupRtdb()` + `backupRtdbSemanal` (`onSchedule` `0 3 * * 0` `America/Monterrey`, `us-central1`, 512 MiB, 540 s, `retryCount: 1`)
- [x] `functions/src/index.ts` — export
- [x] Solo lectura RTDB (sin `set/update/remove/push`) — verificado por inspección
- [x] `storage.rules` — sin cambios (`backups/**` ya denegado por default)
- [x] `cd functions && npm run build` — exit 0
- [x] Tests `node --test test/*.test.js` — 21 pass (7 nuevos + 14 previos)
- [x] Deploy documentado (`plan.md` § Deploy, `docs/OPERACION.md`) — **NO ejecutado**
- [ ] **Deploy** `firebase deploy --only functions:backupRtdbSemanal` — solo con autorización de Luis
- [ ] Post-deploy: `functions:list`, forzar run en Cloud Scheduler, `gsutil ls gs://katzen-a0e3e.appspot.com/backups/rtdb/`, revisar `manifest.json` (`bytesJson`)

### Frontend

- N/A (sin UI)

---

## Validación (L3)

> Guía completa: `specs/templates/qa-validation-guide.md`. Sin UI: aplican §4 (integridad) + emulador + autorización. §1–§3 (formularios, modales, UI) = N/A.

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `cd functions && npm run build` (exit 0) | **OK** | `tsc` sin errores, 2026-09-04 |
| Unit tests del util | **OK** | `node --test test/*.test.js` → 21 pass / 0 fail (7 de `backup-rtdb.util.test.js`) |
| Smoke local 375 / 1280 | N/A | sin UI |
| RTDB aditiva / compatible app móvil | **OK** | cero escrituras RTDB; solo lectura semanal |
| Chips completos + loading contextual | N/A | sin UI |
| Emulador (functions + database + storage) → `runBackupRtdb()` | pendiente | opcional antes del deploy; ver `plan.md` § Estrategia de Datos de Prueba |
| Autorización explícita de Luis para deploy | **pendiente** | — |
| Post-deploy: objeto `.gz` + `manifest.json` en bucket | pendiente | tras primer tick / force run |

```
# cd functions && npm run build
> tsc
exit 0

# node --test test/*.test.js
✔ backup-rtdb.util (spec 067)
  ✔ backupPathsForDate: domingo 03:00 Monterrey → carpeta YYYY/MM/DD del mismo día
  ✔ backupPathsForDate: usa TZ clínica, no UTC (23:30 Monterrey sigue siendo el mismo día)
  ✔ parseBackupDateFromPath: acepta rutas del prefijo y rechaza el resto
  ✔ isExpiredBackup: 8 semanas = 56 días; 56 se conserva, 57 expira
  ✔ selectExpiredBackupPaths: borra solo viejos con fecha válida; nunca hoy ni rutas raras
  ✔ selectExpiredBackupPaths: retención configurable (1 semana)
  ✔ countTopLevelNodes + buildManifest: conteo por nodo de primer nivel
✔ portal-phone-match.util (047 ola 3)
ℹ tests 21  pass 21  fail 0
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 cron / TZ / región / memoria / timeout
- [x] SC-002 solo lectura RTDB
- [x] SC-003 `.json.gz` + `manifest.json` en `backups/rtdb/YYYY/MM/DD/`
- [x] SC-004 fecha en TZ clínica (unit)
- [x] SC-005 raíz vacía → error, no sube
- [x] SC-006 retención > 56 días (unit 56 vs 57)
- [x] SC-007 no borra hoy / fuera de prefijo / sin fecha (unit)
- [x] SC-008 error de borrado no aborta
- [x] SC-009 restauración documentada con advertencia destructiva
- [x] SC-010 «no desplegada» + comando exacto documentados

---

## Cierre

- [x] Validación L3 de **código** registrada arriba
- [ ] Deploy autorizado y verificado → entonces `spec.md` estado → `done` + `node scripts/specs-index.mjs`
- [ ] Commit — solo si Luis lo pide

**Estado:** código y docs listos, **sin deploy**. Sin commit.
