# Spec: Respaldo semanal de RTDB a Cloud Storage

**ID:** 067-respaldo-rtdb  
**Estado:** done  
**Fecha:** 2026-09-04  
**Autor:** Agent (origen: `specs/PLAN-UX-VETERINARIAS.md` § Extras #6 — «Hoy no hay respaldo fuera de Firebase»)  
**Nivel:** **L3** (Cloud Function programada que lee producción completa y escribe en Storage)

---

## Problema

Toda la operación clínica (clientes, mascotas, historiales, vacunas, caja, inventario) vive en un único nodo `Katzen/` de Realtime Database. Firebase **no** guarda copias históricas de RTDB en el plan actual: un borrado accidental desde el panel admin, un script mal apuntado o una regla mal desplegada no tiene marcha atrás. Hosting tampoco es respaldo (spec 063). Hoy la única «copia» es la que exista en el teléfono/PC de Luis si alguna vez exportó el JSON a mano.

Se necesita un respaldo **automático, periódico, fuera de RTDB y sin intervención humana**, que además no toque ni modifique los datos que respalda.

---

## User stories

### US-1 — Respaldo automático semanal

Como **dueño de la clínica (Luis)**  
Quiero que cada semana se guarde una copia completa de `Katzen/` en Cloud Storage  
Para poder recuperar datos si algo se borra o corrompe.

**Criterios de aceptación:**

- [x] SC-001: Function programada v2 `backupRtdbSemanal`, cron `0 3 * * 0` (domingo 03:00) TZ `America/Monterrey`, región `us-central1`, memoria 512 MiB, timeout 540 s.
- [x] SC-002: Lee `Katzen/` completo con `admin.database().ref('Katzen').once('value')`. **Solo lectura**: la función no contiene ningún `set`/`update`/`remove`/`push` sobre RTDB.
- [x] SC-003: Escribe en el bucket por defecto (`katzen-a0e3e.appspot.com`) `backups/rtdb/YYYY/MM/DD/Katzen.json.gz` (JSON gzip) y `backups/rtdb/YYYY/MM/DD/manifest.json` (timestamp, bytes JSON/gzip, conteo de nodos de primer nivel y de hijos por nodo).
- [x] SC-004: La fecha de la carpeta se calcula en TZ clínica (no UTC).
- [x] SC-005: Si el nodo raíz viene vacío/nulo, **no** sube un respaldo vacío: registra error y falla la ejecución (visible en logs).

### US-2 — Retención acotada

Como **dueño**  
Quiero que los respaldos viejos se borren solos  
Para no pagar almacenamiento indefinido ni acumular basura.

**Criterios:**

- [x] SC-006: Tras subir, lista el prefijo `backups/rtdb/` y borra objetos cuya carpeta `YYYY/MM/DD` tenga **más de 8 semanas** (> 56 días). Un respaldo de exactamente 56 días se conserva.
- [x] SC-007: Nunca borra la corrida del día, objetos fuera del prefijo, ni rutas bajo el prefijo sin fecha reconocible (p. ej. `backups/rtdb/manual/...`).
- [x] SC-008: Un error al borrar un objeto no aborta la corrida; se registra y se continúa.

### US-3 — Restauración documentada

Como **Luis**  
Quiero saber exactamente cómo restaurar (total o por nodo) y qué riesgos tiene  
Para no improvisar en una emergencia.

**Criterios:**

- [x] SC-009: `docs/OPERACION.md` y `plan.md` documentan: descarga del `.gz`, `firebase database:set /Katzen archivo.json` con advertencia de que es **destructivo**, restauración parcial por nodo con `jq`, y que requiere autorización explícita.
- [x] SC-010: Documentado que la function **no está desplegada** y el comando exacto de deploy.

---

## Fuera de alcance

- UI admin para ver/descargar respaldos (se usa la consola de Firebase/GCS).
- Restauración automática o botón «restaurar».
- Respaldo de Storage (fotos), Auth users o Functions config (solo RTDB `Katzen/`).
- Cifrado adicional al de GCS en reposo (el bucket ya es privado por `storage.rules`).
- Respaldo diario o incremental.
- Exportar a otro proyecto/cuenta (off-site real). Se anota como riesgo.

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** **cero escrituras**. Solo una lectura completa de `Katzen/` por semana. No se crean nodos ni campos. La app móvil no se ve afectada.

  | Nodo / recurso | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/` (RTDB) | Function (Admin SDK) | **no** | `once('value')` 1×/semana |
  | `gs://katzen-a0e3e.appspot.com/backups/rtdb/**` | Function | Function (crear + borrar por retención) | Clientes/staff **no** acceden: `storage.rules` deniega todo lo que no esté listado |

- **Estrategia de Datos de Prueba:** helpers puros con `node:test` (`functions/test/backup-rtdb.util.test.js`). Prueba de integración solo en **emulador** (`firebase emulators:start --only functions,database,storage` + `firebase functions:shell` → `runBackupRtdb()`), nunca contra `katzen-a0e3e`.

- **Patrones UI Reutilizados:** N/A (sin UI).

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador / doctor / recepcionista | No (sin UI; Storage `backups/` denegado por reglas) |
| Luis (owner del proyecto GCP) | Sí, vía consola Firebase/GCS o `gsutil` |

---

## UI (rutas y layout)

- N/A.

---

## Backend

- [x] Cloud Function: `backupRtdbSemanal` (`functions/src/backup-rtdb.ts`) — codebase **default**.
- [x] Helpers puros: `functions/src/backup-rtdb.util.ts`.
- [ ] Reglas RTDB: no.
- [ ] Reglas Storage: no se tocan (`backups/` ya cae en el `allow read, write: if false` por defecto).
- [ ] Email / integración externa: no.
- [ ] **Deploy: NO ejecutado.** Requiere autorización de Luis: `firebase deploy --only functions:backupRtdbSemanal`.

---

## Testing mínimo

Ver `tasks.md`. Unit del helper (rutas por fecha, parseo, retención 56/57 días, manifest) + `npm run build` en `functions/`.

---

## Notas / decisiones

- TZ `America/Monterrey` (equivalente a `America/Mexico_City` desde 2022; se usa la de la clínica por claridad).
- Domingo 03:00: fuera de horario de operación y del scheduler FCM (10:00).
- Lectura completa en una sola llamada: para el tamaño actual de una clínica (MBs) cabe de sobra en 512 MiB. Si el JSON supera ~150 MB, cambiar a exportación por nodo de primer nivel (ver `plan.md` § Riesgos) — no se implementa hasta que haga falta.
- Off-site real (otro proyecto/cuenta) queda como mejora futura: hoy el respaldo vive en el mismo proyecto GCP; protege contra errores humanos y de código, **no** contra pérdida total del proyecto.
