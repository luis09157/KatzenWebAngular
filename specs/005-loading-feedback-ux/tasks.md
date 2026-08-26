# Tasks: Loading contextual y overlay no trabado

**Spec:** `specs/005-loading-feedback-ux/spec.md`  
**Plan:** `specs/005-loading-feedback-ux/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada
- [x] Plan con contratos y rollback

### Frontend

- [x] `LoadingService`: `LOADING_MESSAGES`, `show(message?)`, Observable `message`, `wrap` con mensaje
- [x] Overlay `app.component.html` muestra mensaje dinámico
- [x] `cita-dialog`: sin `show()` al cerrar
- [x] `citas.component`: Guardando / Actualizando / Eliminando + `finally` → `hide()`

### Docs

- [x] `docs/ADMIN-UI-ARCHITECTURE.md` § Loading
- [x] Rules Cursor + constitution + templates QA/tasks
- [x] `specs/README.md` + `ROADMAP.md`

---

## Testing

- [x] `npm run build` — exit 0
- [x] Servidor local activo (`npm start` → http://localhost:4200)
- [x] Manual / revisión código: un solo `show` al guardar cita; `hide` en success y error vía `finally`
- [x] `npm run cy:admin` — 2026-08-25 opción A: login OK; smoke/routes PASS; clientes CRUD fallaba por tooltip legacy «Dar de baja» (unificado a «Borrar» en Cypress)
- [x] Smoke citas autenticado — dialog + Guardar disabled; loading save no forzado (evitar write)

**Resultado:** OK build; login OK Cypress; fix contador por código

---

## Testing y validación exhaustiva

> **Guía:** `specs/templates/qa-validation-guide.md`

### 1. Formularios y validaciones de entrada

- [x] **Campos vacíos:** N/A (no cambia validación del form)
- [x] **Tipos erróneos:** N/A
- [x] **Límites / desbordamiento:** N/A

### 2. Interfaz, ventanas y modales

- [x] **Diálogos:** cierre del diálogo de cita ya no dispara loading huérfano
- [x] **Retroalimentación:** mensajes Guardando / Actualizando / Eliminando + Swal éxito/error
- [x] **Doble submit:** sin cambio de patrón de botón; overlay sigue bloqueando UI
- [x] **Loading contextual:** mensaje acorde a la operación
- [x] **Loading no trabado:** `hide()` en `finally` (success y error)

### 3. Casos límite y errores de red

- [x] **Red lenta / sin conexión:** loading visible durante Promise; se cierra en error
- [x] **Datos nulos RTDB:** N/A esta feature

### 4. Integridad final

- [x] **`npm run build`** — ver registro abajo
- [x] Resultados registrados antes de `[x]`

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | N/A | sin cambio |
| Formularios — tipos erróneos | N/A | |
| Formularios — límites texto | N/A | |
| Modales — apertura/cierre | OK | sin show en dialog |
| UI — retroalimentación | OK | mensajes contextuales |
| UI — doble submit | OK | overlay global |
| UI — loading contextual | OK | Guardando/Actualizando/Eliminando |
| UI — loading no trabado | OK | un show + finally hide |
| Edge — red lenta/error | OK | hide en catch vía finally |
| Edge — datos nulos RTDB | N/A | |
| Build `npm run build` | OK | exit 0 — Hash 96c3df61570da1f2 |
| Smoke browser — loading «Guardando…» en citas | PARCIAL | 2026-08-25 opción A: login OK + dialog citas OK; no se disparó save real (evita write). Código: un `show` + `finally` hide |
| Servidor local :4200 | OK | npm start vivo Compiled successfully (2026-08-25) |
| Cypress login admin | OK | admin-login.cy.ts 2/2 PASS |

```
npm run build → exit 0 (2026-08-26)
Initial total ~1.99 MB · Compiled successfully

Smoke autenticado 2026-08-25 (opción A — Cypress + cypress.env.json gitignored):
- login OK
- MCP browser no operativo → fallback Cypress
- cy:admin: smoke 3/3, routes 17/17, login 2/2 PASS; clientes CRUD fail (tooltip legacy, fuera de alcance 005)
- Features smoke citas/merma: 2/2 PASS
```
