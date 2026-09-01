# KatzenVet Web — Guía para agentes (Cursor / IA)

Proyecto privado de clínica veterinaria: **landing**, **panel admin** (`/admin`) y **portal dueños** (`/portal`).

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Angular 17, Angular Material MDC, RxJS, SCSS |
| Backend | Firebase Auth, Realtime Database (`Katzen/*`), Cloud Functions v2 (`us-central1`) |
| Hosting | Firebase Hosting → `dist/katzenvet` |
| E2E | Cypress 13 |
| Correo portal | Resend (`RESEND_API_KEY`; FROM default `KatzenVet <onboarding@resend.dev>`) |

Proyecto Firebase: **katzen-a0e3e** · Producción: https://katzen-a0e3e.web.app

### Correo Resend (sin dominio propio)

- **Diferido por decisión Luis (2026-08-26):** configurar `RESEND_API_KEY` + dominio + deploy functions portal **al final** del backlog (no bloquear features). Ver `specs/ROADMAP.md`.
- Hosting `*.web.app` **no** sirve como dominio de envío.
- Sin dominio: modo prueba → solo llega al **email de la cuenta Resend**.
- Cuando toque: crear API key → `firebase functions:secrets:set RESEND_API_KEY` → redeploy callables portal en codebase `default` (`provisionPortalClient`, `resendPortalClientAccess`, `registerPortalOwner`).
- FCM push: codebase separado `functions-fcm` → `firebase deploy --only functions:fcm:onRecordatorioWritePush` (no requiere Resend).
- Con dominio verificado: DNS + opcional `PORTAL_FROM_EMAIL` + redeploy. Pasos: `specs/QA-CRUD-MATRIX.md`.
- **No inventar** API key ni marcar PASS de correo a clientes sin dominio.
## Comandos esenciales

```bash
npm start                    # dev → http://localhost:4200 (asegurar vivo tras cambios UI)
npm run build                # build producción
npm run e2e                  # Cypress headless
npm run cy:admin             # smoke admin autenticado
npm run functions:build      # compilar functions
firebase deploy --only hosting   # SOLO con autorización de Luis
# Tras hosting: no dejar historial (spec 063). retainedReleaseCount=1 en canal live;
# borrar versiones Hosting anteriores a la live (REST; no borrar la servida).
# NUNCA firebase deploy de functions / database / storage sin autorización explícita de Luis.
firebase deploy --only functions:nombreFunction
firebase deploy --only database
```

Hosting **no** es backup de UI: el código vive en git; rollback = nuevo deploy del commit local. Ver `specs/063-hosting-una-version/`. `firebase.json` no tiene campo oficial de retención (no inventar keys). CLI 15.x no lista `hosting:releases:list` / `sites:update`; usar API REST del canal `live`.

## Arquitectura de datos (RTDB)

- **Staff:** `Katzen/Usuarios/{uid}`, claims vía `Katzen/AuthPerfiles/{uid}`
- **Clientes clínica:** `Katzen/Cliente/{id}` — no mezclar con usuarios staff
- **Portal clientes:** `AuthPerfiles` con `role: client`, `clienteId`, `portalActivo` en Cliente
- **Reglas:** `database.rules.json` — validar siempre lectura/escritura client vs staff

Campos nuevos deben ser **opcionales** para convivir con datos legacy.

## UI Admin (obligatorio en módulos CRUD)

- Layout: `admin-page` + `app-admin-kpi-grid` + `app-admin-page-banner` + `app-admin-data-panel`
- Tablas: `.table-scroll` + `mat-table` + `.row-actions` en columna acciones
- Diálogos: `admin-dialog-shell`, **nunca** `mat-dialog-title`; layout según spec 059 (padding, tabs, `.entity-summary` compacto, ficha `ADMIN_DIALOG_FICHA`)
- Páginas: grid/toolbar/search/padding según spec 061 (container `admin-page`; no forzar 3 columnas con sidenav)
- Config: `src/app/core/config/admin-ui.config.ts`
- Config: `src/app/core/config/admin-ui.config.ts`
- Spec diseño: `docs/ADMIN-UI-ARCHITECTURE.md`
- Rule Cursor: `.cursor/rules/admin-ui-architecture.mdc`

Referencia CRUD: `src/app/clientes/`

## Roles staff

Matriz en `src/app/core/config/staff-role.config.ts`. Al crear módulo admin nuevo:

1. Añadir a `StaffModule` y `ALL_STAFF_MODULES`
2. Asignar roles en `STAFF_MODULE_ACCESS`
3. Ruta en `app-routing.module.ts` con `StaffRoleGuard` + `data.staffModule`
4. Entrada en menú admin si aplica

## Spec-Driven Development (SDD)

**Antes de implementar una feature o módulo nuevo:**

1. Leer `specs/memory/constitution.md` y `specs/memory/domain-context.md`
2. Crear carpeta `specs/NNN-nombre-feature/` desde `specs/templates/`
3. Completar `spec.md` → `plan.md` → `tasks.md`
4. En Cursor: `@specs/NNN-nombre-feature/spec.md` al pedir implementación
5. **Al terminar (validación pre-entrega obligatoria — el agente es el QA; Luis no):**
   - Aplicar `specs/templates/qa-validation-guide.md` **completo** (autónomo / multitask)
   - Ejecutar y reportar `npm run build`
   - Asegurar `npm start` vivo en http://localhost:4200 + smoke visual de lo tocado
   - Registrar resultados en `tasks.md` **antes** de marcar `[x]`
   - Verificar UI acordadas si aplican: chips completos, `--picker`, loading contextual/no trabado, timepicker en horas, diálogos spec 059, **páginas spec 061** (grid wrap, toolbar, search, padding, timeline)
   - Solo entonces actualizar `spec.md` → `done`

Índice: `specs/README.md` · Dominio: `specs/memory/domain-context.md` · Plan maestro: `specs/ROADMAP.md` · QA: `specs/templates/qa-validation-guide.md`

## Idioma

Respuestas, mensajes de UI y commits en **español latino**.

## No hacer sin autorización explícita de Luis Alfonso Niño Martínez

- `git commit` / `git push` / **`firebase deploy`** (producción)
- Acceso, consulta o modificación de credenciales, RTDB o servicios de producción (`katzen-a0e3e`)
- Cambios destructivos en RTDB o borrado de datos legacy
- Refactors grandes fuera del alcance de la spec activa

Desarrollo y pruebas del agente: **localhost, emuladores Firebase o mocks** — ver `specs/memory/constitution.md`.
