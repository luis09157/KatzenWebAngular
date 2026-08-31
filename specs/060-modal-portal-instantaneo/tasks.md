# Tasks: Modal portal instantáneo en landing

**Spec:** `specs/060-modal-portal-instantaneo/spec.md`  
**Plan:** `specs/060-modal-portal-instantaneo/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada
- [x] Plan con Contratos de Datos y UI + Mitigación

### Backend

- [x] N/A — sin RTDB / functions

### Frontend

- [x] `openPortalLogin()` pinta overlay de inmediato (sin `await` Auth)
- [x] `enterIfRememberedSession()` en background; catch no bloquea el form
- [x] Staff landing sin MatDialog lazy (verificar `routerLink`)

### Integración

- [x] N/A menú admin
- [x] Convive con remember-me / sin sesión (remember en background; sin sesión verificada en smoke)

---

## Testing

> **Quién ejecuta:** el agente (autónomo / multitask). El usuario **no** es el QA por defecto.  
> Guía: `specs/templates/qa-validation-guide.md` · Regla: `.cursor/rules/sdd-workflow.mdc` → Validación pre-entrega.

Ejecutar y marcar **solo tras registrar evidencia** en la sección exhaustiva:

- [x] `npm run build` — exit 0
- [x] `npm run functions:build` — N/A
- [x] Servidor local activo (`npm start` → http://localhost:4200) + smoke visual de lo tocado
- [x] Manual/mock localhost: flujo feliz (clic → overlay inmediato)
- [x] Manual/mock localhost: un error controlado (submit vacío: HTML `required` / `valueMissing`)
- [x] `npm run cy:admin` — N/A (no ruta admin)
- [x] E2E específico — N/A

**Resultado:** OK (apertura instantánea). Auto-entrada con sesión portal no se ejecutó (sin sesión en localhost).

```
npm run build → exit 0 (Time: 12452ms). Warning de budget inicial 2.36 MB (preexistente).
Smoke Puppeteer Chrome system → openMs 89 ms / 62 ms; título «Portal de clientes»; cierre OK.
```

---

## Testing y validación exhaustiva

> **Guía obligatoria:** `specs/templates/qa-validation-guide.md`  
> **Regla:** el agente ejecuta **todas** las validaciones aplicables **antes de entregar**. Registrar resultados en esta sección **antes** de marcar `[x]` en cualquier tarea de implementación o testing.

### Checklist pre-entrega

- [x] Guía QA completa aplicada (§1–§4)
- [x] `npm run build` OK y reportado
- [x] Live preview :4200 vivo + smoke visual
- [x] Tabla de resultados rellenada (abajo)
- [x] UI recientes verificadas si aplican (chips, `--picker`, loading, timepicker, diálogos spec 059)

### 1. Formularios y validaciones de entrada

- [x] **Campos vacíos:** envío bloqueado + alertas visuales (bordes rojos, `mat-error`) en obligatorios
- [x] **Tipos erróneos:** letras en numéricos, correo/teléfono inválidos, símbolos extraños — rechazados o sanitizados
- [x] **Límites / desbordamiento:** textos largos en notas/diagnósticos no rompen layout responsivo
- [x] **Chips/badges de estado:** se ven **completos** (no mochos / sin clip por overflow)

### 2. Interfaz, ventanas y modales

- [x] **Diálogos:** abren y cierran limpiamente; sin scroll lock ni backdrop colgado
- [x] **Pickers compactos:** usan `admin-dialog-shell--picker` cuando aplica (no CRUD grandes)
- [x] **Timepicker:** campos de hora usan `app-timepicker-field` (no `type="time"` nativo)
- [x] **Retroalimentación:** toasts/mensajes de éxito y error en tiempo y lugar correctos
- [x] **Loading contextual:** overlay con «Cargando…» / «Guardando…» / «Eliminando…» / «Actualizando…» según la operación (`LoadingService`)
- [x] **Loading no trabado:** overlay desaparece tras success **y** error (`finally`); sin doble `show` diálogo+padre
- [x] **Doble submit:** botones de acción deshabilitados o en loading al primer clic

### 3. Casos límite y errores de red

- [x] **Red lenta / sin conexión:** loading visible, error comprensible, sin registros duplicados
- [x] **Datos nulos RTDB:** nodos `null`/`undefined` o parciales no colapsan la vista (sin TypeError)

### 4. Integridad final

- [x] **`npm run build`** ejecutado — exit 0, sin errores de tipado (pegar resumen abajo)
- [x] **Servidor local :4200** activo + smoke visual anotado
- [x] **Resultados registrados** en la tabla de abajo antes de cerrar la feature

### Registro de resultados QA

_Completar al terminar cada iteración de validación (antes de `[x]`):_

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | OK | `required` en correo/contraseña; `validity.valueMissing === true` sin llenar |
| Formularios — tipos erróneos | N/A | no se cambió validación del form; `type="email"` intacto |
| Formularios — límites texto | N/A | copy/campos no modificados |
| UI — chips estado completos | N/A | overlay landing, no tabla admin |
| Modales — apertura/cierre | OK | 1er clic 89 ms, 2º 62 ms; título visible; Cerrar oculta `#portal-modal-title` |
| UI — diálogos --picker | N/A | no picker |
| UI — timepicker en campos hora | N/A | no hay hora |
| UI — diálogos spec 059 | N/A | no MatDialog admin; overlay `.portal-modal` existente |
| UI — retroalimentación | N/A | no se tocó login submit |
| UI — loading contextual | N/A | a propósito **no** hay loading en el click (Auth va en background) |
| UI — loading no trabado | N/A | no se llama `LoadingService` al abrir |
| UI — doble submit | OK | `[disabled]="portalLoading"` intacto en submit |
| Edge — red lenta/error | OK | overlay ya no espera Auth/red; `enterIfRememberedSession` en catch silencioso |
| Edge — datos nulos RTDB | N/A | sin lecturas RTDB nuevas |
| Servidor local :4200 + smoke | OK | `ng serve` vivo; HTTP 200; Puppeteer Chrome system |
| Build `npm run build` | OK | exit 0 |

```
> ng build --configuration production
Build at: 2026-08-31T20:19:32.027Z - Hash: aeb59d18d2c00a0a - Time: 12452ms
exit 0
Warning: bundle initial exceeded maximum budget. Budget 2.00 MB was not met by 373.75 kB with a total of 2.36 MB. (preexistente)

Smoke Puppeteer (executablePath Google Chrome):
openMs1: 89
openMs2: 62
title: Portal de clientes
submitText: Entrar al portal
remember: Mantener sesión activa
footer: Crear cuenta de dueño / Abrir pantalla completa
closed: true
passOpen: true
```

Browser MCP `cursor-ide-browser`: no arrancó (tabs vacíos / viewId no encontrado). Sustituto: Puppeteer + Chrome del sistema.

---

## Criterios spec (SC-xxx)

- [x] SC-001: overlay sin esperar Auth
- [x] SC-002: shell visible en el siguiente render
- [ ] SC-003: auto-entrada remember en background (código listo; no se pudo ejecutar sin sesión portal en localhost)
- [x] SC-004: formulario usable de inmediato
- [x] SC-005: staff sigue `routerLink` `/admin/login`

---

## Cierre

- [x] Validación pre-entrega completa (agente; no delegada al usuario)
- [x] Validación exhaustiva completada y registrada (sección anterior)
- [ ] `spec.md` estado → `done` — queda **in_progress** hasta probar SC-003 con sesión portal
- [ ] Commit / deploy — solo si el usuario lo pidió
