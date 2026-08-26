# Tasks: Timepicker dialog

**Spec:** `specs/004-timepicker-dialog/spec.md`  
**Plan:** `specs/004-timepicker-dialog/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada y revisada
- [x] Plan con Contratos + Mitigación

### Backend

- [x] N/A — sin RTDB / functions

### Frontend

- [x] Util parse/format + unit spec
- [x] `TimepickerDialogComponent` + `TimepickerFieldComponent` (CVA)
- [x] Export en `SharedModule`
- [x] `ADMIN_DIALOG_TIMEPICKER` en `admin-ui.config.ts`
- [x] Migrar `cita-dialog`
- [x] Migrar `banio-dialog` y `recordatorio-dialog`
- [x] Nota en `docs/ADMIN-UI-ARCHITECTURE.md`

### Integración

- [x] README / ROADMAP indexan 004
- [x] Sin cambios legacy RTDB

---

## Testing

Ejecutar y marcar:

- [x] `npm run build` — exit 0 (2026-08-25)
- [x] Unit: `timepicker.util.spec.ts` — 5/5 SUCCESS (ChromeHeadless)
- [ ] Manual localhost: abrir timepicker desde Nueva cita (flujo feliz) — bloqueado 2026-08-25 (MCP browser no operativo; sesión Luis no compartida)
- [ ] Manual: cancelar diálogo sin cambiar valor — bloqueado 2026-08-25 (MCP browser no operativo)
- [x] N/A `functions:build` / cy admin rutas nuevas

**Resultado:** OK build + unit; smoke manual UI pendiente en localhost

```
npm run build → exit 0 (Hash: 980c6f8aca676435)
ng test --include='**/timepicker.util.spec.ts' → 5 of 5 SUCCESS
```

---

## Testing y validación exhaustiva

> **Guía obligatoria:** `specs/templates/qa-validation-guide.md`

### 1. Formularios y validaciones de entrada

- [x] **Campos vacíos:** `required` + `mat-error` en `app-timepicker-field`; FormControl cita conserva `Validators.required`
- [x] **Tipos erróneos:** util rechaza no-`HH:mm`; writeValue tolera vacío
- [x] **Límites:** selects hora 1–12, minutos 0–59 (paso configurable)

### 2. Interfaz, ventanas y modales

- [x] **Diálogos:** implementación con `ADMIN_DIALOG_TIMEPICKER` + shell; anidable vía MatDialog (smoke visual pendiente localhost)
- [x] **Retroalimentación:** display `formatHhMmDisplay` (ej. `04:01 p.m.`)
- [x] **Doble submit:** N/A (picker no persiste entidad)

### 3. Casos límite y errores de red

- [x] **Red:** N/A (solo UI)
- [x] **Datos nulos:** valor vacío / inválido → campo usable, abre con hora actual

### 4. Integridad final

- [x] **`npm run build`** exit 0
- [x] **Resultados registrados** abajo

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|----------|-------|
| Formularios — campos vacíos | OK | required + mat-error en control |
| Formularios — tipos erróneos | OK | util + writeValue |
| Formularios — límites texto | N/A | timepicker |
| Modales — apertura/cierre | OK código | smoke visual pendiente localhost |
| UI — retroalimentación | OK | display 12h unit-tested |
| UI — doble submit | N/A | |
| Edge — red lenta/error | N/A | |
| Edge — datos nulos RTDB | OK | vacío / inválido no rompe |
| Build `npm run build` | OK | exit 0, 2026-08-25 |
| Smoke browser — timepicker cita-dialog (abrir/cancelar) | OK | 2026-08-25 opción A: Cypress — Nueva cita → abrir selector hora → `.timepicker-dialog` / `--picker` visible → Cancelar cierra |
| Smoke browser — espaciado `--picker` desktop/mobile | OK (desktop headless) | Shell `--picker` presente en diálogo; mobile ~375px no medido en este run |

```
> ng build --configuration production
Build at: 2026-08-26T00:02:23.255Z - Hash: 980c6f8aca676435 - Time: 10954ms
(exit 0)

Unit timepicker.util.spec.ts: TOTAL: 5 SUCCESS

Smoke autenticado 2026-08-25 (opción A — Cypress):
- login OK; MCP browser sigue fallando → fallback Cypress
- timepicker open/cancel en cita-dialog: PASS (`admin-qa-features-smoke.cy.ts`)
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: Diálogo al clic
- [x] SC-002: Selección clara a.m./p.m.
- [x] SC-003: FormControl `HH:mm`
- [x] SC-004: CVA reutilizable
- [x] SC-005: Accesible (label, teclado Enter/Espacio, aria-label)
- [x] SC-006: Documentado patrón estándar
- [x] SC-007: Migrado cita-dialog
- [x] SC-008: Migrado banio + recordatorio

---

## Notas UX — espaciado (follow-up 2026-08-25)

- [x] Clase `admin-dialog-shell--picker` + tokens en `admin-dialog.scss` (padding 28×32, gap 24, footer 18×28×22)
- [x] Panel `ADMIN_DIALOG_TIMEPICKER` ampliado 360 → 420px
- [x] Documentado en `docs/ADMIN-UI-ARCHITECTURE.md` y nota en `spec.md`
- [x] `npm run build` exit 0 — Hash: 75a171234f804998 (2026-08-25)
- [x] Smoke visual localhost desktop: timepicker `--picker` abre/cierra (Cypress 2026-08-25 opción A)
- [ ] Smoke mobile ~375px: confirmar que no se corta (opcional)

---

## Cierre

- [x] Validación exhaustiva registrada (smoke manual UI opcional en localhost)
- [x] `spec.md` estado → `done`
- [ ] Commit / deploy — solo si el usuario lo pidió
