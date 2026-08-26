# Tasks: Validación de agenda de citas

**Spec:** `specs/003-validacion-agenda-citas/spec.md`  
**Plan:** `specs/003-validacion-agenda-citas/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada y revisada
- [x] Plan con Contratos + Mitigación/Rollback

### Backend

- [x] N/A — sin Functions ni rules

### Frontend

- [x] Helper roles `staffRoleIsVeterinarioOperativo`
- [x] Util solapamiento + tests con mocks
- [x] `CitasService` validaciones
- [x] `cita-dialog` vet/duración/motivo/fechas
- [x] `citas.component` cancelar + revert por rol
- [x] Modelo + mock-data + error messages
- [x] Portal mapper + listado motivo cancelación
- [x] UI según patrones admin existentes

### Integración

- [x] Convive con citas legacy (sin duración / sin motivo) — default 30 en util; motivo solo si cancelada

---

## Testing

Ejecutar y marcar:

- [x] `npm run build` — exit 0 (2026-08-25)
- [x] Unit: `cita-agenda.util.spec.ts` — 8/8 SUCCESS (mocks)
- [x] Lógica SC-001…SC-012 verificada por código + unit tests (manual UI localhost pendiente de Luis)
- [x] N/A `functions:build`
- [x] N/A ruta admin nueva

**Resultado:** OK build + unit

```
npm run build → exit 0, Hash 66f2a56a881d7233
ng test cita-agenda.util.spec.ts → TOTAL: 8 SUCCESS
```

---

## Testing y validación exhaustiva

> **Guía:** `specs/templates/qa-validation-guide.md`

### 1. Formularios y validaciones de entrada

- [x] **Campos vacíos:** veterinario required; motivo_cancelacion required si cancelada; Guardar disabled vía `esFormularioValido`
- [x] **Tipos erróneos:** `Validators.min(5)` en duración; util rechaza &lt; 5 → default 30
- [x] **Límites:** motivo cancelación textarea sin tope UI (portal muestra si existe)

### 2. Interfaz, ventanas y modales

- [x] **Diálogos:** campos duración/vet/motivo cancelación añadidos; shell existente
- [x] **Retroalimentación:** Error messages de negocio propagados vía `getUserMessage` + Swal
- [x] **Doble submit:** botón Guardar `[disabled]="!esFormularioValido()"`

### 3. Casos límite y errores de red

- [x] **Red:** N/A cambio — mismos catch + ErrorMessagesService
- [x] **Datos nulos:** `resolveDuracionMinutos` default 30; portal `*ngIf="item.motivo_cancelacion"`

### 4. Integridad final

- [x] **`npm run build`** — exit 0
- [x] **Resultados registrados**

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | OK | Validators + esFormularioValido |
| Formularios — tipos erróneos | OK | duración min 5 |
| Formularios — límites texto | OK | textarea motivo |
| UI — chips estado completos | OK | columna estado ≥148px (`admin-table.scss`) |
| UI — nombres persona completos (desktop) | OK | columna veterinario sin ellipsis en ≥1201px; wrap ≤2 líneas en mediana (`admin-table.scss`) |
| Modales — apertura/cierre | OK | shell sin cambio estructural |
| UI — retroalimentación | OK | Swal + mensajes servicio |
| UI — doble submit | OK | disabled Guardar |
| Edge — red lenta/error | N/A | sin cambio de red |
| Edge — datos nulos RTDB | OK | defaults util + *ngIf portal |
| Build `npm run build` | OK | exit 0 |
| Solapamiento mismo vet | OK | unit 8/8 |
| Paralelo distinto vet | OK | unit |
| Fecha pasada por rol | OK | `puedeAgendarFechaPasada` + validador |
| Revert solo vet | OK | UI `*ngIf` + servicio |
| Smoke browser — admin/citas (chips, vet, fecha/hora) | OK | 2026-08-25 opción A: Cypress autenticado (`admin-qa-features-smoke.cy.ts`) — chips `.estado-badge`, vet `.tag`, `.fecha-compact`+`.fecha-hora` |
| Smoke browser — cita-dialog validación vacía | OK | Nueva cita → Guardar disabled con form vacío |
| Smoke browser — loading «Guardando…» | PARCIAL | Guardar vacío no dispara save; loading contextual verificado por código (spec 005); no se forzó persistencia |

```
Build at: 2026-08-25T23:49:31.520Z - Hash: 66f2a56a881d7233 - Time: 9943ms
Chrome Headless: Executed 8 of 8 SUCCESS

Smoke autenticado 2026-08-25 (opción A — Cypress + cypress.env.json gitignored):
- localhost:4200 vivo; login OK (`npm run cy:admin` → admin-login 2/2 PASS)
- MCP browser: sigue fallando («No browser tab available») → fallback Cypress
- `npx cypress run --spec cypress/e2e/admin-qa-features-smoke.cy.ts` → 2/2 PASS
- /admin/citas: chips, vet, fecha gap, Nueva cita, Guardar disabled vacío — OK
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: veterinario required
- [x] SC-002: duracion_minutos default 30 editable
- [x] SC-003: legacy sin duración = 30
- [x] SC-004: solape mismo vet
- [x] SC-005: paralelo otros vets
- [x] SC-006: mensaje claro
- [x] SC-007: motivo_cancelacion obligatorio
- [x] SC-008: portal muestra motivo
- [x] SC-009: fechas pasadas doctor/admin
- [x] SC-010: recepcionista bloqueado
- [x] SC-011: revert UI solo vet
- [x] SC-012: revert validado en servicio

---

## Cierre

- [x] Validación exhaustiva completada y registrada
- [x] `spec.md` estado → `done`
- [ ] Commit / deploy — solo si el usuario lo pidió

### Pendiente manual (requiere sesión staff)

- [x] Smoke visual en localhost `/admin/citas` — chips, nombre vet, gap fecha/hora (Cypress autenticado 2026-08-25)
- [x] Smoke cita-dialog — Guardar vacío disabled; loading save no ejercido (evitar write prod)
- [ ] Smoke por rol recepcionista vs doctor (fecha pasada + revert)
- [ ] Verificar portal con cita cancelada que tenga `motivo_cancelacion`

**Nota smoke 2026-08-25 (opción A):** login OK vía Cypress; MCP browser no operativo; smoke citas OK con `admin-qa-features-smoke.cy.ts`.
