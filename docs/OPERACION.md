# Operación — KatzenVet (Firebase `katzen-a0e3e`)

Runbook corto para lo que corre solo en producción y cómo intervenir. Todo deploy, restauración o borrado requiere **autorización explícita de Luis Alfonso Niño Martínez** (`specs/memory/constitution.md`).

---

## 1. Functions programadas

| Function | Codebase | Cron (TZ) | Qué hace | Estado |
|----------|----------|-----------|----------|--------|
| `onVacunaPushSchedule` | `fcm` (`functions-fcm/`) | `0 10 * * *` `America/Mexico_City` (16:00Z) | Push FCM + inbox a dueños con refuerzo de vacuna/desparasitación en D-7 y D-0; resumen a staff. Solo escribe campos `push*` en `Katzen/Recordatorios` e inbox `Notificaciones`/`NotificacionesClinica`. | **Desplegada** (2026-08-29; update 2026-09-04). Spec 052. |
| `backupRtdbSemanal` | `default` (`functions/`) | `0 3 * * 0` `America/Monterrey` (domingo 09:00Z) | Exporta `Katzen/` completo a `gs://katzen-a0e3e.appspot.com/backups/rtdb/YYYY/MM/DD/Katzen.json.gz` + `manifest.json`; borra respaldos > 8 semanas. **Solo lectura** RTDB. | **NO desplegada.** Código listo. Spec 067. |

Comandos de observación (solo lectura, seguros):

```bash
firebase functions:list
firebase functions:log --only onVacunaPushSchedule -n 30
firebase functions:log --only backupRtdbSemanal -n 30     # tras deploy
```

---

## 2. Respaldo semanal RTDB (`backupRtdbSemanal`) — spec 067

### Estado

**No está desplegada.** Existe en `functions/src/backup-rtdb.ts` y se exporta desde `functions/src/index.ts`, pero no corre en producción hasta que Luis autorice el deploy. Hoy **no hay respaldo automático** de RTDB fuera de Firebase.

### Deploy (solo Luis o con su autorización explícita)

```bash
cd functions && npm ci && npm run build && node --test test/*.test.js && cd ..
firebase deploy --only functions:backupRtdbSemanal
firebase functions:list | grep backupRtdbSemanal
```

Nunca `firebase deploy --only functions` a secas (desplegaría todo el codebase default).

Primer tick: el siguiente domingo 03:00 Monterrey. Para no esperar: consola GCP → Cloud Scheduler → job `firebase-schedule-backupRtdbSemanal-us-central1` → **Force run**; luego:

```bash
firebase functions:log --only backupRtdbSemanal -n 30
gsutil ls -l gs://katzen-a0e3e.appspot.com/backups/rtdb/
gsutil cat gs://katzen-a0e3e.appspot.com/backups/rtdb/$(date +%Y/%m/%d)/manifest.json
```

Si el log muestra `403` al subir: dar `Storage Object Admin` al service account `262209452533-compute@developer.gserviceaccount.com` sobre el bucket (IAM) y forzar de nuevo.

### Qué genera

```text
backups/rtdb/2026/09/06/Katzen.json.gz    # snapshot completo de Katzen/ (JSON gzip)
backups/rtdb/2026/09/06/manifest.json     # createdAt, bytesJson, bytesGzip, nodeCounts por nodo
```

Retención: 8 semanas (se borran carpetas con > 56 días). Para conservar uno para siempre, copiarlo fuera del patrón de fecha: `gsutil cp -r gs://.../backups/rtdb/2026/09/06 gs://.../backups/rtdb/manual/2026-09-06-pre-migracion/`.

### Restaurar (DESTRUCTIVO — requiere autorización explícita de Luis)

> `firebase database:set` **reemplaza por completo** el nodo destino. Todo lo capturado después del respaldo en ese nodo se pierde. Siempre sacar snapshot previo y preferir restauración **por nodo**.

```bash
firebase use katzen-a0e3e

# 1) Snapshot de seguridad del estado actual
firebase database:get /Katzen > pre-restore-$(date +%Y%m%d-%H%M).json

# 2) Descargar respaldo
gsutil cp gs://katzen-a0e3e.appspot.com/backups/rtdb/2026/09/06/Katzen.json.gz .
gunzip Katzen.json.gz     # → Katzen.json

# 3a) PARCIAL por nodo (recomendado)
jq '.Cliente' Katzen.json > Cliente.json
firebase database:set /Katzen/Cliente Cliente.json      # confirma interactivamente

# 3b) TOTAL (último recurso)
firebase database:set /Katzen Katzen.json               # confirma interactivamente; NO usar -f
```

Efectos secundarios al restaurar: escribir `AuthPerfiles` dispara `onAuthPerfilWrite` (resync de claims por uid); escribir `Recordatorios` dispara `onRecordatorioWritePush` (el guard `pushFingerprint`/`pushAt` evita reenvíos ya hechos); `Vacunas` dispara `onVacunaCreatedInbox` solo si el nodo no existía. Restaurar primero nodos sin triggers (`Cliente`, `Mascota`, `Historiales`, inventario, caja).

### Costo estimado

Prácticamente **$0 USD/mes** con el tamaño actual (Scheduler dentro de los 3 jobs gratis; ~5 invocaciones/mes; < 50 MB en Storage; descarga RTDB ~100 MB/mes). Peor caso con `Katzen/` de 200 MB: ~1 USD/mes. Detalle en `specs/067-respaldo-rtdb/plan.md`.

### Quitar la function

```bash
firebase functions:delete backupRtdbSemanal --region us-central1
```

Los respaldos ya subidos permanecen en Storage. Quitar también el `export` de `functions/src/index.ts` para que no reaparezca en un deploy del codebase.

---

## 3. Scheduler FCM vacunas (`onVacunaPushSchedule`) — spec 052

- Ventanas: D-7 y D-0 (días de calendario, TZ clínica). Vencidos y futuros lejanos se ignoran → no hay «avalancha» al desplegar.
- Idempotente: `pushKindsSent[d7|d0]` + tope `pushCount < 2` por recordatorio.
- Quiet hours 23:00–08:00 (no aplica a las 10:00, pero si se cambia el cron, se respeta: inbox sí, FCM no).
- Redeploy: `firebase deploy --only functions:fcm:onVacunaPushSchedule` (solo con Luis). El gate anti-spam al write vive en `onRecordatorioWritePush` (mismo codebase; desplegado 2026-08-29).

---

## 4. Hosting

Sin historial (spec 063): `retainedReleaseCount: 1`; rollback = git + nuevo deploy. Ver `AGENTS.md`.

---

## 5. Pendientes de infraestructura (Luis)

| Ítem | Dónde |
|------|-------|
| Deploy `backupRtdbSemanal` | § 2 |
| Rotar keystore Android (contraseñas en historial público) | `docs/ROTACION-KEYSTORE.md` |
| Dominio Resend + `PORTAL_FROM_EMAIL` | `specs/038-resend-correo-portal/FASE-B-DOMINIO.md` |
| Copia off-site de respaldos (otro proyecto/bucket) | `specs/067-respaldo-rtdb/plan.md` § Riesgos |
