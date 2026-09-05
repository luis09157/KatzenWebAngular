# Plan técnico: Respaldo semanal RTDB → Storage

**Spec:** `specs/067-respaldo-rtdb/spec.md`  
**Estado:** approved-pending-deploy (código listo; **Luis debe autorizar el deploy**)  
**Nivel:** L3

---

## Resumen

Function programada v2 en el codebase `functions` (default) que, cada domingo 03:00 hora Monterrey, lee `Katzen/` con el Admin SDK, lo serializa a JSON, lo comprime con gzip (zlib nativo de Node, sin dependencias nuevas) y lo sube al bucket por defecto junto con un `manifest.json`. Después lista `backups/rtdb/` y borra lo que tenga más de 8 semanas. Toda la lógica de fechas/retención está en un helper puro con tests; la function solo orquesta I/O.

---

## Archivos a crear / modificar

### Firebase (codebase `functions`)

| Archivo | Acción | Notas |
|---------|--------|-------|
| `functions/src/backup-rtdb.util.ts` | crear | helpers puros: rutas por fecha (TZ), parseo de fecha desde ruta, retención, manifest |
| `functions/src/backup-rtdb.ts` | crear | `runBackupRtdb(now)` + `backupRtdbSemanal = onSchedule(...)` |
| `functions/src/index.ts` | modificar | `export { backupRtdbSemanal } from './backup-rtdb';` |
| `functions/test/backup-rtdb.util.test.js` | crear | `node:test` (runner ya usado en `functions/`) |

### Angular / Cypress / Reglas

Ninguno. `storage.rules` **no** se toca: `backups/**` ya está denegado por la regla por defecto.

### Docs

| Archivo | Acción |
|---------|--------|
| `docs/OPERACION.md` | crear — deploy, restauración, costo, estado |

---

## Modelo de datos (Storage)

```text
gs://katzen-a0e3e.appspot.com/
  backups/rtdb/
    2026/09/06/
      Katzen.json.gz      # JSON.stringify(snapshot de Katzen/) → gzip nivel 6
      manifest.json       # ver abajo
    2026/09/13/...
```

`manifest.json`:

```json
{
  "version": 1,
  "rootNode": "Katzen",
  "dataFile": "Katzen.json.gz",
  "createdAt": "2026-09-06T09:00:03.120Z",
  "ymd": "2026-09-06",
  "timeZone": "America/Monterrey",
  "bytesJson": 12345678,
  "bytesGzip": 1234567,
  "topLevelNodes": 27,
  "nodeCounts": { "Cliente": 812, "Mascota": 1190, "Recordatorios": 340, "...": 0 },
  "retentionWeeks": 8
}
```

Metadata del objeto `.gz`: `contentType: application/gzip`, `cacheControl: private, max-age=0`, custom `rootNode`, `ymd`, `bytesJson`.

---

## Flujos

### Flujo principal (cada domingo 03:00 Monterrey)

1. `backupPathsForDate(now)` → `backups/rtdb/YYYY/MM/DD/`.
2. `admin.database().ref('Katzen').once('value')` (única lectura RTDB).
3. Si `val() == null` → `logger.error` + `throw` (la ejecución aparece fallida en Cloud Scheduler / logs; no se sube nada).
4. `JSON.stringify` → `gzipSync` → `bucket.file(dataPath).save(gz, { resumable: false })`.
5. `buildManifest(...)` → `bucket.file(manifestPath).save(json)`.
6. `bucket.getFiles({ prefix: 'backups/rtdb/' })` → `selectExpiredBackupPaths(nombres, now, 8)` → `delete({ ignoreNotFound: true })` uno a uno; errores se cuentan y se registran, no abortan.
7. `logger.info` con bytes, nodos y borrados.

### Errores esperados

| Caso | Comportamiento |
|------|----------------|
| RTDB no responde / timeout | Excepción → corrida fallida; Cloud Scheduler reintenta 1 vez (`retryCount: 1`). Sin efectos secundarios (aún no se escribió nada). |
| `Katzen` vacío | Error explícito; no se sube respaldo vacío (evita «pisar» mentalmente un respaldo bueno con uno hueco). |
| Falla subida del `.gz` | Excepción → corrida fallida; retención **no** se ejecuta (nunca borramos sin haber subido primero). |
| Falla subida del manifest | Excepción; el `.gz` ya está arriba (sigue siendo restaurable). |
| Falla un `delete` | Se registra `warn`, se continúa. |
| Permisos Storage insuficientes | Error 403 en `save` → corrida fallida. Ver § Deploy (service account). |

---

## Servicios / dependencias

- `firebase-admin` (ya presente): `database()`, `storage().bucket()` (trae `@google-cloud/storage`).
- `firebase-functions/v2/scheduler`: `onSchedule`.
- `zlib` (Node core). **Sin dependencias nuevas** en `package.json`.
- Service account de runtime: la compute default (`262209452533-compute@developer.gserviceaccount.com`, la misma que usan las demás functions) necesita `roles/storage.objectAdmin` (o Editor, que ya suele tener) sobre el bucket por defecto. Si el primer tick falla con 403, otorgar ese rol al SA desde IAM (lo hace Luis).

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ninguno en escritura.

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Katzen/` | **lectura** completa 1×/semana | no | `once('value')`; sin listeners persistentes |
  | Storage `backups/rtdb/**` | crear / borrar objetos | no | bucket privado; reglas cliente lo deniegan |

  - [x] Sin eliminar ni renombrar nodos existentes (no se escribe RTDB).
  - [x] Sin campos nuevos.
  - [x] Verificado por inspección: `functions/src/backup-rtdb.ts` no invoca `set/update/remove/push/transaction` sobre `admin.database()`.

- **Estrategia de Datos de Prueba:**
  - Unit: `functions/test/backup-rtdb.util.test.js` (7 casos).
  - Integración (opcional, antes del deploy): `firebase emulators:start --only functions,database,storage` con seed local (`scripts/emulator-seed.mjs`) y `firebase functions:shell` → `require('./lib/backup-rtdb').runBackupRtdb()`; verificar objetos en el emulador de Storage. **Nunca** contra `katzen-a0e3e`.

- **Patrones UI Reutilizados:** N/A.

---

## Plan de Mitigación y Rollback

- [x] Verificado que no hay cambios destructivos en contratos de datos (solo lectura RTDB).
- [x] Compilación local exitosa (`cd functions && npm run build` exit 0).
- [x] Plan de reversión documentado.

| Escenario | Acción de rollback / mitigación |
|-----------|-------------------|
| La function falla cada domingo (403, timeout) | No afecta datos. Revisar `firebase functions:log --only backupRtdbSemanal`. Si es 403 → IAM al SA. Si es timeout/memoria → subir a 1 GiB o pasar a exportación por nodo (ver Riesgos). |
| Lectura semanal completa impacta costo o rendimiento | 1 lectura/semana a las 03:00; RTDB cobra por GB descargado (~1 USD/GB). Si el árbol crece mucho, cambiar a exportación por nodo o reducir frecuencia. |
| Hay que quitar la function | `firebase functions:delete backupRtdbSemanal --region us-central1` (solo Luis). Los respaldos ya subidos permanecen en Storage. Revertir `index.ts` (quitar el export) para que no vuelva a desplegarse con `--only functions`. |
| La retención borra algo que no debía | Solo borra bajo `backups/rtdb/YYYY/MM/DD/` con > 56 días; rutas sin fecha se respetan. Para conservar uno indefinidamente: copiarlo a `backups/rtdb/manual/<nombre>/` (fuera del patrón de fecha) o activar *Object Versioning* en el bucket. |
| Restauración necesaria | Ver § Restauración. Es **destructiva**: exige autorización explícita de Luis y snapshot previo. |

---

## Restauración (solo con autorización explícita de Luis)

> **Advertencia:** `firebase database:set` **reemplaza** el nodo destino completo. Cualquier dato escrito después del respaldo se pierde. Antes de restaurar, **exportar el estado actual**.

```bash
# 0) Autenticado en el proyecto correcto
firebase use katzen-a0e3e

# 1) Snapshot del estado actual (por si la restauración empeora las cosas)
firebase database:get /Katzen > pre-restore-$(date +%Y%m%d-%H%M).json

# 2) Descargar el respaldo elegido
gsutil cp gs://katzen-a0e3e.appspot.com/backups/rtdb/2026/09/06/Katzen.json.gz .
gsutil cp gs://katzen-a0e3e.appspot.com/backups/rtdb/2026/09/06/manifest.json .
gunzip Katzen.json.gz          # → Katzen.json

# 3a) Restauración TOTAL (destructivo: pisa todo Katzen/)
firebase database:set /Katzen Katzen.json          # pide confirmación interactiva; NO usar -f

# 3b) Restauración PARCIAL por nodo (recomendado; menos daño colateral)
jq '.Cliente' Katzen.json > Cliente.json
firebase database:set /Katzen/Cliente Cliente.json
```

Efectos secundarios a tener en cuenta al restaurar:

- Escribir `Katzen/AuthPerfiles` dispara `onAuthPerfilWrite` (resincroniza claims por uid): esperado, pero genera N invocaciones.
- Escribir `Katzen/Recordatorios` dispara `onRecordatorioWritePush`; el guard de `pushFingerprint`/`pushAt` evita reenviar pushes ya enviados. Recordatorios sin esos campos podrían disparar push al restaurarse.
- Escribir `Katzen/Vacunas` dispara `onVacunaCreatedInbox` solo en **creación** (`onValueCreated`); una restauración sobre nodos existentes es update, no create, pero si el nodo fue borrado y se restaura, sí cuenta como creación.
- Mitigación: restaurar por nodo, empezando por los que no tienen triggers (`Cliente`, `Mascota`, `Historiales`, inventario, caja).

---

## Deploy (NO ejecutado — requiere autorización de Luis)

```bash
cd functions && npm ci && npm run build && node --test test/*.test.js
cd ..
firebase deploy --only functions:backupRtdbSemanal
firebase functions:list | grep backupRtdbSemanal      # scheduled · us-central1 · 512
# Primer tick: siguiente domingo 03:00 Monterrey (09:00Z). Forzar antes desde
# Cloud Scheduler (consola GCP → job firebase-schedule-backupRtdbSemanal-us-central1 → "Force run")
firebase functions:log --only backupRtdbSemanal -n 30
gsutil ls gs://katzen-a0e3e.appspot.com/backups/rtdb/
```

**Nunca** `firebase deploy --only functions` (desplegaría todo el codebase default).

---

## Costo estimado (Blaze, us-central1)

Supuestos: `Katzen/` ≈ 20 MB JSON (clínica pequeña/mediana); gzip ≈ 8–10× → ~2–3 MB por respaldo; 8 respaldos retenidos ≈ 25 MB.

| Rubro | Cantidad/mes | Costo aprox. |
|-------|--------------|--------------|
| Cloud Scheduler | 1 job (2.º del proyecto; 3 gratis) | $0 |
| Invocaciones Functions v2 | ~4–5 | $0 (free tier) |
| Cómputo 512 MiB × ~30 s × 5 | ~150 GB-s ≈ 0.08 GB-h | $0 (free tier 400k GB-s) |
| RTDB descarga | 20 MB × 5 ≈ 100 MB | ≈ $0.10 (1 USD/GB; free tier 10 GB/mes en muchos planes → $0) |
| Storage | ~25 MB | < $0.01 |
| Operaciones GCS (list/put/delete) | < 100 | $0 |

**Total: prácticamente $0 USD/mes** (< 0.20 USD en el peor caso). Si `Katzen/` fuese 200 MB: ~1 USD/mes por descarga RTDB y ~0.01 en Storage.

---

## Riesgos

- **Tamaño del árbol.** `once('value')` carga todo en memoria; 512 MiB soporta cómodamente hasta ~100–150 MB de JSON. Si el manifest muestra `bytesJson` > 100 MB: (1) subir `memory` a 1 GiB, o (2) migrar a exportación por nodo de primer nivel (`Katzen/Cliente.json.gz`, `Katzen/Mascota.json.gz`, …) leyendo cada hijo por separado. Para listar hijos sin bajar todo hace falta la REST API con `?shallow=true` (token del Admin SDK); queda como spec futura si llega el caso.
- **Mismo proyecto GCP.** Un borrado del proyecto o pérdida de la cuenta se lleva también los respaldos. Mejora futura: copia mensual a otro bucket/proyecto (transferencia GCS) o descarga manual trimestral a disco externo de Luis.
- **Datos sensibles en claro dentro del bucket.** Está cifrado en reposo por GCS y las reglas cliente lo deniegan, pero cualquier persona con rol `Storage Object Viewer` en el proyecto puede leerlo. Mantener IAM al mínimo (hoy solo Luis).
- **Export completo dispara lectura de nodos staff-only** (`Katzen/HistorialesNotasInternas`, etc.): el Admin SDK ignora reglas, es correcto para respaldo, pero refuerza el punto anterior.
- **Sin prueba real hasta el primer tick.** Forzar un run desde Cloud Scheduler tras el deploy y verificar `gsutil ls`.
