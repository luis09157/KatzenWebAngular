# KatzenVet Web — Guía para agentes (Cursor / IA)

Proyecto privado de clínica veterinaria: **landing**, **panel admin** (`/admin`) y **portal dueños** (`/portal`).

## Antes de implementar (obligatorio)

1. Leer `specs/memory/constitution.md`
2. Leer `specs/memory/agent-guardrails.md` (checklist + prohibiciones + decisiones + **anti-duplicación**)
3. Si toca entidades/flujos → `specs/memory/domain-context.md`
4. Buscar spec en `specs/INDEX.md` (+ `rg` / anti-duplicación); clasificar L1/L2/L3 (`.cursor/rules/sdd-workflow.mdc`)
5. Mapa de módulos: `specs/memory/module-map.md`

Sin esos pasos, no codear. Detalle del flujo: rule always-applied `sdd-workflow.mdc`.

## Al cerrar (obligatorio — specs vivas)

Actualizar `tasks.md` de la spec activa (QA + qué se extrajo/dónde vive), `module-map` si hubo utils, decisiones en guardrails/`domain-context`, e INDEX si cambió estado. Ver `agent-guardrails.md` → **DESPUÉS DE CODEAR / AL CERRAR** y plan **078**.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Angular 17, Angular Material MDC, RxJS, SCSS |
| Backend | Firebase Auth, Realtime Database (`Katzen/*`), Cloud Functions v2 (`us-central1`) |
| Hosting | Firebase Hosting → `dist/katzenvet` |
| E2E | Cypress 13 |
| Correo portal | Resend — **activado 2026-08-26** (`specs/038-resend-correo-portal/`); dominio propio pendiente (`notas-resend.md`) |

Proyecto Firebase: **katzen-a0e3e** · Producción: https://katzen-a0e3e.web.app

## Comandos esenciales

```bash
npm start                 # dev → http://localhost:4200 (mantener vivo tras cambios UI)
npm run build             # build producción (obligatorio antes de entregar)
npm run e2e               # Cypress headless · npm run cy:admin = smoke admin
npm run functions:build   # compilar functions
node scripts/specs-index.mjs   # regenerar specs/INDEX.md
firebase deploy --only hosting|functions:X|database   # SOLO con autorización de Luis
```

Hosting **no** es backup de UI (spec 063): tras deploy hosting autorizado, `retainedReleaseCount: 1` y borrar versiones anteriores a la live. Rollback = git + nuevo deploy.

## Arquitectura de datos (RTDB)

- **Staff:** `Katzen/Usuarios/{uid}`, claims vía `Katzen/AuthPerfiles/{uid}`
- **Clientes clínica:** `Katzen/Cliente/{id}` — no mezclar con usuarios staff
- **Portal clientes:** `AuthPerfiles` con `role: client`, `clienteId`, `portalActivo` en Cliente
- **Reglas:** `database.rules.json` — validar siempre lectura/escritura client vs staff
- Cambios RTDB **aditivos** (campos opcionales); compatibilidad con la app móvil es obligatoria.

## UI Admin

Layout `admin-page` + `app-admin-kpi-grid` + `app-admin-page-banner` + `app-admin-data-panel`; tablas `.table-scroll` + `mat-table` + `.row-actions`; diálogos `admin-dialog-shell` (**nunca** `mat-dialog-title`). Detalle: `docs/ADMIN-UI-ARCHITECTURE.md` · rule `.cursor/rules/admin-ui-architecture.mdc` (se activa al editar `src/app/**`) · referencia CRUD: `src/app/clientes/`.

Roles staff: matriz en `src/app/core/config/staff-role.config.ts`; módulo admin nuevo → `.cursor/rules/new-admin-module.mdc`.

## Proceso (SDD) y niveles de cambio

Detalle en `.cursor/rules/sdd-workflow.mdc`; checklist QA completa **solo** en `specs/templates/qa-validation-guide.md`.

- **L1 trivial** (CSS, copy, tooltip): `npm run build` + 1 screenshot local. Sin plan/tasks.
- **L2 feature UI/lógica**: unit tests del util + build + smoke 375/1280 + registro ≤10 líneas en `tasks.md`.
- **L3 datos/infra** (rules, functions, scripts a prod, modelos compartidos con móvil, imports): guía QA completa + `plan.md` (Contratos de Datos / Rollback) + emulador + autorización explícita de Luis.

Índice specs: `specs/INDEX.md` (autogenerado) · dominio: `specs/memory/domain-context.md` · principios: `specs/memory/constitution.md` · guardrails agentes: `specs/memory/agent-guardrails.md` · mapa módulos: `specs/memory/module-map.md` · plan maestro: `specs/ROADMAP.md`.

## Idioma

Respuestas, mensajes de UI y commits en **español latino**.

## No hacer sin autorización explícita de Luis Alfonso Niño Martínez

- `git commit` / `git push` / **`firebase deploy`** (hosting, functions, database, storage)
- Acceso, consulta o modificación de credenciales, RTDB o servicios de producción (`katzen-a0e3e`)
- Cambios destructivos en RTDB o borrado de datos legacy
- Refactors grandes fuera del alcance de la spec activa

Desarrollo y pruebas del agente: **localhost, emuladores Firebase o mocks** (`src/app/core/testing/mock-data.ts`) — ver `specs/memory/constitution.md` y `specs/memory/agent-guardrails.md`.
