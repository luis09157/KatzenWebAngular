# KatzenVet Web — Guía para agentes (Cursor / IA)

Proyecto privado de clínica veterinaria: **landing**, **panel admin** (`/admin`) y **portal dueños** (`/portal`).

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Angular 17, Angular Material MDC, RxJS, SCSS |
| Backend | Firebase Auth, Realtime Database (`Katzen/*`), Cloud Functions v2 (`us-central1`) |
| Hosting | Firebase Hosting → `dist/katzenvet` |
| E2E | Cypress 13 |
| Correo portal | Resend (`RESEND_API_KEY`, `PORTAL_FROM_EMAIL`) |

Proyecto Firebase: **katzen-a0e3e** · Producción: https://katzen-a0e3e.web.app

## Comandos esenciales

```bash
npm start                    # dev → http://localhost:4200
npm run build                # build producción
npm run e2e                  # Cypress headless
npm run cy:admin             # smoke admin autenticado
npm run functions:build      # compilar functions
firebase deploy --only hosting
firebase deploy --only functions:nombreFunction
firebase deploy --only database
```

## Arquitectura de datos (RTDB)

- **Staff:** `Katzen/Usuarios/{uid}`, claims vía `Katzen/AuthPerfiles/{uid}`
- **Clientes clínica:** `Katzen/Cliente/{id}` — no mezclar con usuarios staff
- **Portal clientes:** `AuthPerfiles` con `role: client`, `clienteId`, `portalActivo` en Cliente
- **Reglas:** `database.rules.json` — validar siempre lectura/escritura client vs staff

Campos nuevos deben ser **opcionales** para convivir con datos legacy.

## UI Admin (obligatorio en módulos CRUD)

- Layout: `admin-page` + `app-admin-kpi-grid` + `app-admin-page-banner` + `app-admin-data-panel`
- Tablas: `.table-scroll` + `mat-table` + `.row-actions` en columna acciones
- Diálogos: `admin-dialog-shell`, **nunca** `mat-dialog-title`
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
5. Al terminar: aplicar `specs/templates/qa-validation-guide.md`, registrar resultados en `tasks.md`, marcar tasks con evidencia, ejecutar `npm run build`, actualizar estado en `spec.md`

Índice: `specs/README.md` · Dominio: `specs/memory/domain-context.md` · Plan maestro: `specs/ROADMAP.md` · QA: `specs/templates/qa-validation-guide.md`

## Idioma

Respuestas, mensajes de UI y commits en **español latino**.

## No hacer sin autorización explícita de Luis Alfonso Niño Martínez

- `git commit` / `git push` / **`firebase deploy`** (producción)
- Acceso, consulta o modificación de credenciales, RTDB o servicios de producción (`katzen-a0e3e`)
- Cambios destructivos en RTDB o borrado de datos legacy
- Refactors grandes fuera del alcance de la spec activa

Desarrollo y pruebas del agente: **localhost, emuladores Firebase o mocks** — ver `specs/memory/constitution.md`.
