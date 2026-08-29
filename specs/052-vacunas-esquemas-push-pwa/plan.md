# Plan técnico: Vacunas — esquemas, push anti-spam, PWA

**Spec:** `specs/052-vacunas-esquemas-push-pwa/spec.md`  
**Anexo clínico:** `specs/052-vacunas-esquemas-push-pwa/PROTOCOLOS.md`  
**Estado:** ola 1 implementada (2026-08-28); **ola 2 implementada** (push programado + PWA portal, 2026-08-28); ola 3 pendiente

---

## Resumen

Reutilizar el flujo actual (`vacuna-dialog` → `VacunasService` → **033** `asegurarRefuerzo` → `Recordatorios` → FCM **023**) y añadir:

1. Un **motor puro** de esquemas (especie + tipo + edad + etapa) que propone `intervalo` / `proximaAplicacion`.
2. Un **diálogo de confirmación** obligatorio antes de persistir.
3. Campos **opcionales** en RTDB (tipos, vacuna, config, push schedule).
4. En ola 2: **no** pushear al crear un refuerzo lejano; Function programada cerca de la fecha; **PWA** solo portal.

Cálculo en cliente (predecible, testeable, sin callable clínico). La Function ola 2 solo **elige cuándo** avisar, no redefine medicina.

Constitución: cambios **aditivos**; no tocar nodos que consume la app móvil; no producción.

---

## Código existente a respetar (ola 1)

| Pieza | Ruta | Qué hacer |
|-------|------|-----------|
| Diálogo vacuna | `src/app/vacunas/vacuna-dialog.component.ts` | Tras validar form, abrir confirmación esquema; no saltarse 033 |
| Fallback tipos | mismo archivo `tiposVacunasFallback` | Mapear a semántica 052; no eliminar values legacy |
| Cálculo fecha | `src/app/vacunas/vacuna-recordatorio.util.ts` | Extender o extraer `esquema-vacuna.util.ts` |
| Servicio | `src/app/vacunas/vacunas.service.ts` | Persistir campos nuevos opcionales |
| Especies | `paciente-admin-dialog.component.ts` `especies = ['CANINO', 'FELINO', 'AVE', 'REPTIL', 'OTRO']` | Añadir `CONEJO`; normalizar aliases (`conejo`, `lagomorfo`) |
| Stats | `entity-stats.util.ts` | Opcional: contar conejos (no bloqueante) |
| Recordatorios | spec 033 | Sigue siendo la fuente de `origen: vacuna_auto` |
| FCM | `functions-fcm/src/recordatorio-push.ts` | Ola 2: gate por fecha / `pushSchedule` |
| Portal FCM | `src/app/core/services/portal-fcm.service.ts` | Ola 2: no re-pedir permiso; PWA comparte SW |
| Fallecido | spec 017 | Cortocircuito en motor + scheduler |

**No modificar** `specs/051-login-auto-redirect/` ni routing de login.

---

## Archivos a crear / modificar (cuando se implemente)

### Angular — ola 1

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/vacunas/esquema-vacuna.models.ts` | crear | Tipos: especie, categoria, flags |
| `src/app/vacunas/esquema-vacuna.defaults.ts` | crear | Constantes de `PROTOCOLOS.md` §8 |
| `src/app/vacunas/esquema-vacuna.util.ts` | crear | `sugerirEsquema(input): Sugerencia` puro |
| `src/app/vacunas/esquema-vacuna.util.spec.ts` | crear | Cachorro 16 sem, rabia 365, lepto 2 dosis, ave sin esquema, intervalo 7d warn |
| `src/app/vacunas/vacuna-esquema-confirm-dialog.component.ts` (+ html/scss) | crear | `admin-dialog-shell`; confirmar / editar / no agendar |
| `src/app/vacunas/vacuna-dialog.component.ts` | modificar | Invocar motor + confirmación; hints |
| `src/app/vacunas/vacunas.module.ts` | modificar | Declarar diálogo |
| `src/app/pacientes-admin/paciente-admin-dialog.component.ts` | modificar | Especie CONEJO |
| `src/app/core/testing/mock-data.ts` | modificar | Paciente conejo + vacuna con esquema |
| `src/app/core/error-messages.service.ts` | modificar | Contexto «esquema vacuna» si hace falta |

### Angular — ola 2

| Archivo | Acción |
|---------|--------|
| `src/manifest.webmanifest` (o `src/portal-manifest.webmanifest`) | crear |
| `angular.json` / `index.html` portal | modificar — link rel manifest **solo rutas portal** si es viable; si el index es único, manifest genérico KatzenVet portal |
| `src/firebase-messaging-sw.js` | modificar con cuidado — cache shell + FCM |
| Iconos PWA `src/assets/icons/` | crear |
| `portal-fcm.service.ts` / perfil portal | CTA install + avisos sin spam de permiso |

### Firebase — ola 1

| Archivo | Acción |
|---------|--------|
| `database.rules.json` | `Katzen/Config/Vacunacion` si se crea: read/write staff (`role != client`) |
| Nodos datos | **no** migración masiva; seed opcional documentado, no script contra prod |

### Firebase — ola 2

| Archivo | Acción |
|---------|--------|
| `functions-fcm/src/recordatorio-push.ts` | Gate: no send si fecha lejana y no hay `pushDue` |
| `functions-fcm/src/recordatorio-push-schedule.ts` (nombre TBD) | `onSchedule` diario TZ `America/Mexico_City` |
| `functions-fcm/src/index.ts` | export nueva function |
| `database.rules.json` | campos ya cubiertos en Recordatorios (opcionales) |

### Cypress

| Archivo | Acción |
|---------|--------|
| `cypress/e2e/admin-modules-authenticated.cy.ts` | smoke `/admin/vacunas` si no está |
| `cypress/e2e/` vacuna-esquema (mock) | ola 1: diálogo confirmación |

---

## Modelo de datos

Campos **nuevos opcionales**. Lectura: `undefined` → comportamiento actual (033 solo).

```text
Katzen/TiposVacunas/{id}
  value, label, activo          # legacy
  especies?: string[]           # ['CANINO'] | ['FELINO'] | ['CONEJO'] | ...
  categoria?: 'core' | 'non_core' | 'legal_mx' | 'no_recomendada' | 'otra'
  nuncaTrienal?: boolean        # rabia, lepto, Bordetella, CIV
  dosisInicio?: number          # 2 lepto/FeLV/CIV SQ
  intervaloSerieDias?: number   # default 21
  intervaloMinimoDias?: number  # default 14
  edadMinimaSemanas?: number
  edadCierreSerieSemanas?: number  # 16 perro, 16–20 gato
  intervaloAdultoDias?: number
  viaDefault?: 'sq' | 'im' | 'in' | 'oral'
  hintKey?: string              # i18n interno
  disponibilidadNota?: string   # «confirmar proveedor MX»

Katzen/Config/Vacunacion          # nodo nuevo opcional
  refuerzoFvrcpPostSerieDias: 365 | 183
  refuerzoCoreMlvAdultoDias: 365 | 1095
  rabiaDias: 365                  # no 1095 en seed
  pushAnticipacionDias: [7, 1]
  pushMaxPorRecordatorio: 2
  tz: 'America/Mexico_City'

Katzen/Vacunas/{id}
  # legacy intacto: vacuna, fechaAplicacion, intervalo, proximaAplicacion, ...
  esquemaCodigo?: string
  etapaEsquema?: 'serie_inicio' | 'serie' | 'cierre_16sem' | 'refuerzo_6m' | 'adulto'
  intervaloSugeridoDias?: number
  intervaloConfirmadoDias?: number
  proximaSugerida?: string
  esquemaConfirmado?: boolean
  confirmadoPorUid?: string
  hintsMostrados?: string[]

Katzen/Recordatorios/{id}
  # 033/023 intactos
  pushSchedule?: { dueAt: string, kind: 'd7' | 'd1' }[]
  pushCount?: number
  skipPushOnCreate?: boolean     # true si fecha lejana

Katzen/Mascota/{id}
  especie: 'CANINO' | 'FELINO' | 'CONEJO' | 'AVE' | 'REPTIL' | 'OTRO' | string legacy
```

**Móvil:** ignora desconocidos. No eliminar `vacuna` string ni `intervalo` numérico.

---

## Flujos

### Flujo principal ola 1 (admin aplica vacuna)

1. Staff abre diálogo vacuna (picker cliente→paciente 029).
2. Motor lee `especie`, edad si hay (`edad` o fecha nac. si existiera — hoy `edad` es texto; parseo best-effort + hint «confirma edad»).
3. Al elegir tipo, se rellena intervalo/próxima **en el form** como propuesta (usuario ve el número).
4. Submit → diálogo confirmación: resumen, chips core/non-core, hints (MDA, FeLV test, enfermo, NOM rabia).
5. Vet confirma / edita fecha / «no agendar refuerzo».
6. Persistencia vacuna (campos aditivos) + **033** si hay próxima.
7. Si Fallecido: no recordatorio.

### Errores esperados

| Caso | Mensaje usuario |
|------|-----------------|
| Sin paciente/tipo | Validación form existente |
| Especie ave + tipo quintuple | Hint + no sugerir fechas; no bloqueo si vet insiste |
| Intervalo 7 días core | Soft-warn en confirmación |
| RTDB permission | `ErrorMessagesService` |
| Confirmar sin red | Loading «Guardando…» + error; sin duplicar vacuna (033 anti-dup) |

### Flujo ola 2 push

1. Al crear recordatorio lejano: `skipPushOnCreate: true`; **023** no envía FCM (sí puede escribir inbox **si** se decide — recomendación: **tampoco** inbox el día 0 si faltan meses; inbox el día D-7).
2. Scheduler diario: recordatorios pendientes con `dueAt` en ventana, `pushCount < max`, mascota no Fallecido.
3. Reutiliza envío FCM + fingerprint 023.

### Flujo PWA

1. Dueño en `/portal/*` ve «Instalar» si `beforeinstallprompt`.
2. SW: push FCM + cache estático portal.
3. Permiso notificaciones: una vez (031).

---

## Servicios

- `esquema-vacuna.util.ts` — puro, sin Firebase.
- `VacunasService` — igual + campos extra.
- `RecordatoriosService.asegurarRefuerzo` — sin cambiar contrato; input ya trae fecha confirmada.
- Ola 2: Function `onSchedule` en `functions-fcm`.

---

## UI (admin)

- Contenedor existente `.vacunas-contenedor` / `admin-page`.
- Confirmación: `ADMIN_DIALOG_FORM` compacto, no `mat-dialog-title`.
- Chips `.estado-badge` categoría **sin clip**.
- Loading: «Guardando vacuna…» en el padre; confirmación no duplica overlay.
- Timepicker si el recordatorio tiene hora.
- Copy destructivo: no aplica (no se borra esquema).
- Portal: shells centrados; PWA no rompe layout.

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** aditivo. Móvil no requiere los campos nuevos.

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Katzen/Vacunas` campos esquema* | añadir opcionales | no | defaults seguros = ausente |
  | `Katzen/TiposVacunas` semántica | añadir opcionales | no | values legacy iguales |
  | `Katzen/Config/Vacunacion` | nodo nuevo | no | staff only |
  | `Katzen/Recordatorios` pushSchedule, skipPushOnCreate, pushCount, pushKindsSent, pushDueStatus | añadir opcionales | no | 023 ignora si no los lee; scheduler 052 sí |
  | `Katzen/NotificacionesClinica/{id}` | **nodo nuevo** inbox staff | no | read staff; write Functions; **cliente no lee** |
  | `Katzen/FcmTokens/{uid}` | reutilizado | no | portal_web + admin_web |
  | `Katzen/Mascota.especie` valor `CONEJO` | valor string nuevo | no | ya es string libre |
  | Nodos Vacunas/Tipos/Recordatorios nombres | **no** renombrar | — | constitución |

  - [x] Sin eliminar ni renombrar nodos existentes (diseño)
  - [x] Campos nuevos opcionales con defaults seguros en lectura (diseño)

- **Estrategia de Datos de Prueba:** mocks `mock-data.ts` + unit del motor. Emuladores si se prueba Function ola 2. **Prohibido** RTDB producción `katzen-a0e3e`.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Página CRUD | `src/app/vacunas/`, `src/app/clientes/` |
  | Diálogo | `admin-dialog-shell`, `ADMIN_DIALOG_*` |
  | Alertas | `ErrorMessagesService`, SweetAlert2 |
  | Loading | `LoadingService` + `finally` hide |
  | Tabla acciones | `.row-actions` |
  | Badges | `.estado-badge` + `admin-table.scss` |
  | Picker | `app-cliente-paciente-picker` |
  | Hints flujo | spec 048 `flow-hint` |
  | Push portal | `PortalFcmService` |

  - [x] Sin librerías UI externas (diseño)
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` a consultar en ola 1
  - [x] Chips/badges enteros (criterio SC)

---

## Plan de Mitigación y Rollback

- [x] Verificado en diseño: no hay cambios destructivos de contratos (solo opcionales / nodo config nuevo).
- [x] Compilación local (`npm run build`) — **ola 1 2026-08-28 exit 0** (warning preexistente de budget 2 MB).
- [x] Plan de reversión documentado:

| Escenario | Acción de rollback |
|-----------|-------------------|
| Motor sugiere fecha absurda | Vet edita en confirmación; hotfix flags en `esquema-vacuna.defaults.ts`; Config RTDB |
| Rabia quedó en 3 años por bug | Seed/config `rabiaDias: 365`; script **no** masivo en prod; corrección puntual |
| Function scheduler spamea push | Undeploy/inhabilitar solo la function nueva; 023 write-path se puede dejar con `skipPushOnCreate` |
| 023 deja de avisar urgentes (cita mañana) | Feature flag `useScheduledPush`; si false, comportamiento 023 actual |
| Rules `Config/Vacunacion` mal | Revertir `database.rules.json`; redeploy database **solo con autorización Luis** |
| PWA/SW rompe FCM o pantalla en blanco | Quitar registro SW extra; volver a `firebase-messaging-sw.js` previo; hard refresh |
| UI rompe build | Revertir archivos de la ola; no revertir 033/023 |
| App móvil | No lee campos nuevos → no rollback móvil |
| Falla Auth/user | N/A (no se crean usuarios) |

**Feature flags sugeridos (ola 1–2):** `esquemasVacunaEnabled`, `pushProgramadoEnabled` en `environment` (no en prod Firebase) para rollback inmediato sin deploy de rules.

---

## Deploy (solo cuando Luis autorice, **no** en ola 0)

```bash
npm run build
# ola 2:
npm --prefix functions-fcm run build
# firebase deploy --only hosting                    # si Luis pide (PWA + SW)
# firebase deploy --only functions:fcm:onRecordatorioWritePush
# firebase deploy --only functions:fcm:onVacunaPushSchedule
# firebase deploy --only functions:fcm:onVacunaCreatedInbox
# firebase deploy --only database                   # NotificacionesClinica + Config/Vacunacion
```

No ejecutar deploy desde el agente sin autorización explícita.

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Edad del paciente es texto libre (`"3 meses"`) | Parser heurístico + hint «confirma edad»; si no parsea, pedir cierre de serie manual |
| Séxtuple mezcla core+lepto | Dos sugerencias o la más corta (lepto anual) + hint «el combo no hace trienal la lepto» |
| Staff ignora confirmación (click rápido) | Checkbox «Confirmé el criterio clínico» + fecha visible |
| Disponibilidad MX inventada | Copy fijo «confirmar proveedor»; CIV/PLUS/Purevax no en seed como «en stock» |
| Scheduler TZ | Fijar `America/Mexico_City` |
| Doble push 023 + scheduler | `skipPushOnCreate` + fingerprint |
| Conejo sin biológico | Tipos existen; intervalo manual; no auto-serie EU |

---

## Constitución / dominio

- Aislamiento producción: sí.
- RTDB aditivo: sí.
- UI admin architecture: diálogo + chips.
- Dominio vacunas 4.5 / 033 / 023 / 017: extensión, no reemplazo.
