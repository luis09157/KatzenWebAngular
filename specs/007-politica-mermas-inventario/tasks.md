# Tasks: Política de mermas / stock negativo

**Spec:** `specs/007-politica-mermas-inventario/spec.md`  
**Plan:** `specs/007-politica-mermas-inventario/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada y revisada
- [x] Plan con Contratos + Mitigación

### Backend

- [x] N/A — sin Functions ni reglas RTDB en esta entrega

### Frontend

- [x] Util `inventario-stock.util.ts` + unit tests
- [x] `InventarioService`: bloqueo merma, `registrarMerma`, motivo, gate ajuste
- [x] `salida-dialog`: merma → `registrarMerma` + Loading «Guardando…»
- [x] `ajuste-dialog`: gate supervisor + Loading
- [x] `movimientos` / dashboard: filtro merma + botón ajuste condicional
- [x] `ErrorMessagesService` contextos
- [x] Mock producto en `mock-data.ts`

### Integración

- [x] Docs: domain-context #12, AUDIT #4, README/ROADMAP
- [x] Convive con datos legacy (movimientos antiguos sin tipo merma)

---

## Testing

> **Quién ejecuta:** el agente (autónomo / multitask). El usuario **no** es el QA por defecto.

- [x] `npm run build` — exit 0
- [x] `npm run functions:build` — N/A
- [x] Servidor local activo (`npm start` → http://localhost:4200) + smoke HTTP 200
- [x] Unit: `inventario-stock.util.spec.ts` — 12/12 SUCCESS
- [x] Lógica: flujo feliz merma (unit `calcularNuevoStock`)
- [x] Lógica: stock insuficiente / motivo vacío / ajuste gate (unit + código servicio)
- [x] `npm run cy:admin` — login OK (2026-08-25 opción A)
- [x] Smoke UI merma — Cypress autenticado (`admin-qa-features-smoke.cy.ts`) PASS

**Resultado:** OK

```
npm run build → exit 0 (Hash: 632b885f9a1711a3)
ng test inventario-stock.util → TOTAL: 12 SUCCESS
npm start → listening on localhost:4200, Compiled successfully
curl http://localhost:4200/ → 200
```

---

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA completa aplicada (§1–§4 aplicables)
- [x] `npm run build` OK y reportado
- [x] Live preview :4200 vivo + smoke HTTP
- [x] Tabla de resultados rellenada (abajo)
- [x] Loading contextual «Guardando…» en salida/merma/ajuste

### 1. Formularios y validaciones de entrada

- [x] **Campos vacíos:** motivo/cantidad con Validators.required + mat-error
- [x] **Tipos erróneos:** cantidad min(1); stock_fisico min(0)
- [x] **Límites:** textarea observaciones existente (sin regresión layout)
- [x] **Chips/badges:** N/A — sin cambios de chips; filtro tipo merma añadido

### 2. Interfaz, ventanas y modales

- [x] **Diálogos:** mismos shells admin; merma cambia título/CTA
- [x] **Pickers:** N/A
- [x] **Timepicker:** N/A
- [x] **Retroalimentación:** SweetAlert éxito/error + ErrorMessagesService
- [x] **Loading contextual:** `LOADING_MESSAGES.saving` («Guardando…»)
- [x] **Loading no trabado:** `hide` en `finally`
- [x] **Doble submit:** botón `[disabled]="loading || …"`

### 3. Casos límite y errores de red

- [x] **Stock insuficiente / merma:** util + UI + transacción
- [x] **Ajuste sin rol:** diálogo cierra + mensaje; servicio `assertPuedeRegistrarAjuste`
- [x] **Datos nulos:** stock null → 0 en util

### 4. Integridad final

- [x] **`npm run build`** exit 0
- [x] **Servidor local :4200** activo
- [x] **Resultados** registrados

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|----------|-------|
| Formularios — campos vacíos | OK | motivo required merma/salida/ajuste |
| Formularios — tipos erróneos | OK | min validators |
| Formularios — límites texto | OK | sin cambio destructivo |
| UI — chips estado completos | N/A | sin chips tocados |
| Modales — apertura/cierre | OK | código diálogos existentes |
| UI — diálogos --picker | N/A | |
| UI — timepicker en campos hora | N/A | |
| UI — retroalimentación | OK | Swal + ErrorMessages |
| UI — loading contextual | OK | Guardando… |
| UI — loading no trabado | OK | finally hide |
| UI — doble submit | OK | disabled loading |
| Edge — stock insuficiente merma | OK | unit + servicio |
| Edge — ajuste sin permiso | OK | gate UI + servicio |
| Edge — datos nulos RTDB | OK | stock null → 0 |
| Servidor local :4200 + smoke | OK | 200 + Compiled successfully |
| Build `npm run build` | OK | exit 0 |
| Unit inventario-stock.util | OK | 12/12 |
| Smoke browser — merma motivo obligatorio UI | OK | 2026-08-25 opción A: Salida → motivo Merma → título «Registrar merma»; CTA disabled sin producto |
| Smoke browser — merma cantidad > stock UI | OK | cantidad alta → mensaje stock insuficiente y/o CTA disabled |
| Servidor local :4200 (smoke) | OK | npm start vivo Compiled successfully (2026-08-25) |
| Cypress login admin | OK | login OK |

```
Build at: 2026-08-26T04:22:35.763Z - Hash: 632b885f9a1711a3 - Time: 5442ms
Chrome Headless: Executed 12 of 12 SUCCESS
Angular Live Development Server is listening on localhost:4200

Smoke autenticado 2026-08-25 (opción A — Cypress + cypress.env.json gitignored):
- login OK; MCP browser no operativo → fallback Cypress
- `admin-qa-features-smoke.cy.ts` merma UI: PASS
- Validación motivo/cantidad: unit 12/12 + smoke UI
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: Merma bloquea stock insuficiente
- [x] SC-002: Mensaje claro stock
- [x] SC-003: Ninguna op deja stock &lt; 0
- [x] SC-004: `registrarMerma` + motivo obligatorio
- [x] SC-005: UI merma → tipo `merma`
- [x] SC-006: Rechazo sin motivo
- [x] SC-007: Ajuste solo admin/doctor
- [x] SC-008: UI + servicio gate
- [x] SC-009: Autorización dual documentada como futuro

---

## Cierre

- [x] Validación pre-entrega completa (agente)
- [x] Validación exhaustiva registrada
- [x] `spec.md` estado → `done`
- [ ] Commit / deploy — solo si el usuario lo pidió
