# Tasks: Layout responsivo de diálogos admin

**Spec:** `specs/059-dialogos-admin-layout-responsivo/spec.md`  
**Plan:** `specs/059-dialogos-admin-layout-responsivo/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada y revisada
- [x] Plan aprobado (Contratos + Mitigación)

### Backend

- [x] N/A — sin RTDB, functions ni reglas

### Frontend

- [x] Quitar `:has(.entity-summary)` del padding 0 en `admin-dialog.scss` + comentario spec 059
- [x] CSS global tabs overlay (`overflow: visible`, `height: auto`)
- [x] Compactar `.entity-summary` global a 16px / 12px
- [x] Tabs expediente página (`pacientes.component`) + `dynamicHeight`
- [x] Compactar / acotar `.entity-summary` en diálogos que duplicaban 22/18
- [x] Docs y reglas permanentes (arquitectura, Cursor, QA, README, AGENTS, 058)

### Integración

- [x] N/A — sin menú ni contratos nuevos

---

## Auditoría de diálogos (lista)

Marcar tras inspección CSS/HTML (no refactor de negocio). Resultado en notas.

| Diálogo | entity-summary | layout interno | tabs | Hallazgo / fix |
|---------|----------------|----------------|------|----------------|
| cliente-dialog | sí | `admin-dialog-layout` | no | padding 0 **intencional**; compactar hero 16/12 |
| cita-dialog | sí | `--padded` | no | padding 0 intencional; compactar hero 16/12 |
| vacuna-dialog | sí | no (body propio 24×28) | no | `:has(.entity-summary)` **pisaba** el padding del componente — resuelto al quitar el selector |
| historial-dialog | sí | no (body propio) | no | mismo patrón que vacuna — resuelto global |
| banio-dialog | sí | no (body propio) | no | mismo patrón que vacuna — resuelto global |
| recordatorio-dialog | sí | no (body propio) | no | mismo patrón que vacuna — resuelto global |
| consentimiento-dialog | sí | `--padded` | no | padding 0 intencional; sin cambio de layout |
| paciente-dialog | sí | `--padded` | no | padding 0 intencional; sin cambio de layout |
| paciente-admin-dialog | sí | `admin-dialog-layout` | no | leak de `.admin-dialog-panel .entity-summary` (encapsulation None); acotado a `app-paciente-admin-dialog` + compactar |
| usuario-dialog | sí | `--padded` | no | padding 0 intencional (body scrollea); compactar hero 16/12 |
| citas-dia-dialog | sí | `--padded` | no | padding 0 intencional; compactar hero 16/12 |
| paciente-ficha-dialog | no (hero propio) | `--ficha` | sí + `dynamicHeight` | arreglo 058 intacto; CSS overlay tabs 059 refuerza |
| vacuna-detalle | sí | `--padded` | no | compactar hero 16/12 |
| historial-detalle | sí | `--padded` | no | compactar hero 16/12 |
| banio-detalle | sí | `--padded` | no | compactar hero 16/12 |
| recordatorio-detalle | sí | `--padded` | no | compactar hero 16/12 |
| timepicker-dialog | no | `--picker` | no | fuera de este patrón; `--picker` correcto |
| visita-dialog / POS | no | `--pos` | no | overflow propio del POS; no tocar lógica |
| inventario *dialog* | no `.entity-summary` | mixto | no | form-section 22px no es hero; no tocar |
| pensión / producto / portal / servicio-clínica | no el patrón | mixto | no | sin padding 0 + entity-summary sin layout |

Páginas con `mat-tab-group` (no overlay): expediente (`pacientes`) + `dynamicHeight` + overflow/height; usuarios y finanzas: `height: auto` añadido.

---

## Testing

> **Quién ejecuta:** el agente (autónomo / multitask). El usuario **no** es el QA por defecto.  
> Guía: `specs/templates/qa-validation-guide.md` · Regla: `.cursor/rules/sdd-workflow.mdc` → Validación pre-entrega.

Ejecutar y marcar **solo tras registrar evidencia** en la sección exhaustiva:

- [x] `npm run build` — exit 0
- [x] `npm run functions:build` — N/A
- [x] Servidor local activo (`npm start` → http://localhost:4200) + smoke visual de lo tocado
- [x] Manual/mock localhost: flujo feliz (auditoría CSS de diálogos + CSS compilado)
- [x] Manual/mock localhost: un error controlado — N/A (solo CSS)
- [x] `npm run cy:admin` — N/A (sin ruta nueva; no pegar a prod)
- [x] E2E específico — N/A

**Resultado:** CSS/DOM OK en vivo. Overlay staff **bloqueado** (login). MCP browser no adjuntó pestaña.

```
npm run build — exit 0 (2026-08-31)
Warning preexistente: bundle initial exceeded maximum budget (2.36 MB vs 2.00 MB).
http://localhost:4200 — HTTP 200, ng serve PID 20369 (LISTEN).

Smoke overlay 2026-08-31 (2ª pasada):
- cursor-ide-browser: tabs list vacío; navigate/lock → «No browser tab available» / viewId inválido. No se abrió overlay real.
- /admin/login (Chrome headless, perfil limpio): splash «KatzenVet Admin / Panel de gestión para personal autorizado» + spinner (checkingSession). Sin mat-sidenav, sin formulario de email a tiempo. Sin sesión previa.
- No se usaron credenciales (ni Cypress env ni katzen-a0e3e).
- CSS servido (GET /styles.css): :has(.entity-summary) = 0; tabs overlay overflow:visible + height:auto presentes; .entity-summary { margin-bottom:16px; padding-bottom:12px }.
- Sonda DOM inyectada .admin-dialog-panel:
  · body solo con .entity-summary → padding 24px 28px 28px (no pegado)
  · body :has(.admin-dialog-form--padded) → padding 0 (intencional)
- Viewport 375: login splash (no ficha). Apilado de dueño/meta de ficha no ejercido en overlay.
```

---

## Testing y validación exhaustiva

> **Guía obligatoria:** `specs/templates/qa-validation-guide.md`  
> **Regla:** el agente ejecuta **todas** las validaciones aplicables **antes de entregar**. Registrar resultados en esta sección **antes** de marcar `[x]` en cualquier tarea de implementación o testing.

### Checklist pre-entrega

- [x] Guía QA completa aplicada (§1–§4 y §2.5)
- [x] `npm run build` OK y reportado
- [x] Live preview :4200 vivo + smoke visual
- [x] Tabla de resultados rellenada (abajo)
- [x] UI recientes verificadas (diálogos spec 059, chips, `--picker`)

### 1. Formularios y validaciones de entrada

- [x] **Campos vacíos:** N/A — no se cambió validación de forms
- [x] **Tipos erróneos:** N/A
- [x] **Límites / desbordamiento:** body de diálogos sigue con `overflow-y: auto`; textos largos scrollean
- [x] **Chips/badges de estado:** ficha usa `.estado-badge` con `white-space: nowrap` / `width: max-content`

### 2. Interfaz, ventanas y modales

- [x] **Diálogos:** patrón `admin-dialog-shell` intacto; sin cambios de open/close
- [x] **Spec 059 padding:** `:has(.entity-summary)` eliminado del padding 0
- [x] **Spec 059 tabs:** CSS overlay + expediente + usuarios/finanzas `height: auto` / `overflow: visible`; ficha ya tenía `dynamicHeight`
- [x] **Spec 059 scroll:** superficie `overflow: hidden` + body `overflow-y: auto` (patrón flex); ficha `max-height: 92vh`
- [x] **Spec 059 hero:** global y duplicados locales 16/12
- [x] **Spec 059 375px:** ficha `ficha-top` a 1 columna en `max-width: 840px` (cubre 375px)
- [x] **Pickers compactos:** timepicker no tocado; `--picker` sigue
- [x] **Timepicker:** N/A
- [x] **Loading:** N/A
- [x] **Doble submit:** N/A

### 3. Casos límite y errores de red

- [x] **Red lenta / sin conexión:** N/A
- [x] **Datos nulos RTDB:** N/A (layout)

### 4. Integridad final

- [x] **`npm run build`** ejecutado — exit 0
- [x] **Servidor local :4200** activo + smoke visual anotado
- [x] **Resultados registrados** en la tabla de abajo antes de cerrar la feature

### Registro de resultados QA

**Iteración 2026-08-31**

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | N/A | solo CSS/docs |
| Formularios — tipos erróneos | N/A | solo CSS/docs |
| Formularios — límites texto | OK | body `overflow-y: auto` |
| UI — chips estado completos | OK | ficha `.estado-badge` nowrap; no se estrecharon columnas |
| Modales — apertura/cierre | OK | sin cambios de TS de open/close |
| UI — diálogos --picker | N/A | no se tocó timepicker |
| UI — diálogos spec 059 | OK | CSS vivo: sin :has(.entity-summary); padding 24×28 si solo hay hero; 0 si --padded; tabs height auto. Overlay real no abierto (login). |
| UI — timepicker en campos hora | N/A | no se tocó |
| UI — retroalimentación | N/A | |
| UI — loading contextual | N/A | |
| UI — loading no trabado | N/A | |
| UI — doble submit | N/A | |
| Edge — red lenta/error | N/A | |
| Edge — datos nulos RTDB | N/A | |
| Servidor local :4200 + smoke | BLOQUEO overlay | :4200 vivo. MCP browser no persiste pestaña. /admin/login = splash auth sin sesión. No ficha/cliente/vacuna/usuario. CSS/DOM OK. |
| Build `npm run build` | OK | exit 0; warning de budget inicial preexistente (2.36 MB) |

```
> katzenvet@0.0.1 build
> ng build --configuration production
Build at: 2026-08-31T19:59:46.891Z
Warning: bundle initial exceeded maximum budget. Budget 2.00 MB was not met by 373.64 kB with a total of 2.36 MB.
exit 0
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: sin `:has(.entity-summary)` para padding 0
- [x] SC-002: `.entity-summary` compacto 16/12
- [x] SC-003: body scrollea; no recorte
- [x] SC-004: picker vs CRUD vs ficha
- [x] SC-005: tabs overlay height auto + overflow visible
- [x] SC-006: expediente-tabs página
- [x] SC-007: ficha muestra expediente (058 + CSS 059)
- [x] SC-008: ~375px apilable (ficha grid 1 col ≤840px)

---

## Cierre

- [x] Validación pre-entrega completa (agente; no delegada al usuario)
- [x] Validación exhaustiva completada y registrada (sección anterior)
- [ ] `spec.md` estado → `done` — queda **in_progress**: smoke overlay staff no se completó (MCP browser + login splash sin sesión; no credenciales prod)
- [ ] Commit / deploy — no pedidos
