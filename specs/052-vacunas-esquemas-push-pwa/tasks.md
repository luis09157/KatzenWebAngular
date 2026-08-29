# Tasks: Vacunas — esquemas, push, PWA

**Spec:** `specs/052-vacunas-esquemas-push-pwa/spec.md`  
**Plan:** `specs/052-vacunas-esquemas-push-pwa/plan.md`  
**Anexo:** `specs/052-vacunas-esquemas-push-pwa/PROTOCOLOS.md`

> **Ola 1 (2026-08-28):** Luis autorizó implementar. Motor + diálogo de confirmación + especie CONEJO + KPIs clínicos. **No** ola 2 (push/PWA). **No** commit/deploy.

---

## Ola 0 — SDD e investigación (esta entrega)

### Setup

- [x] Carpeta spec creada desde plantillas + anexo `PROTOCOLOS.md`
- [x] Lectura `constitution.md` + `domain-context.md`
- [x] Investigación web citada (WSAVA, AAHA, AAFP, NOM-011, conejo EU/MX, hurón AFA)
- [x] Inventario de código: vacunas, TiposVacunas, 033, 023/FCM, especies paciente
- [x] `plan.md` con Contratos Datos/UI y Mitigación/Rollback
- [x] Índice `specs/README.md` + fila `ROADMAP.md`
- [x] Plan aprobado por Luis (defaults: rabia anual, FVRCP 1 año editable, conejo ola 3) — autorización ola 1 2026-08-28

### Implementación (no aplica ola 0)

- [x] Cubierto en ola 1

---

## Ola 1 — Motor + UI confirmación (perro/gato) + especie conejo

### Setup

- [x] Luis autoriza implementar ola 1
- [x] Releer `PROTOCOLOS.md` + etiqueta de los biológicos que usa la clínica

### Backend / datos

- [x] Reglas RTDB para `Katzen/Config/Vacunacion` si se crea el nodo — **no se creó el nodo** (defaults en `esquema-vacuna.defaults.ts`; aditivo cuando Luis pida config clínica)
- [x] Cloud Function nueva: **no** en ola 1
- [x] Seed documentado de flags en tipos (comentario en `esquema-vacuna.defaults.ts`; no script contra producción)
- [x] `npm run functions:build` — N/A ola 1 (no se tocó functions)

### Frontend

- [x] Modelos + `esquema-vacuna.util.ts` + unit tests (SC-001, 004, 005, 012)
- [x] Diálogo confirmación `admin-dialog-shell` (SC-002, SC-003)
- [x] Integrar `vacuna-dialog` + hints (SC-006–SC-011)
- [x] Mapear fallback `puppy` / `quintuple` / `triple_felina` / `antirrabica` / `giardia` / `otra`
- [x] Especie `CONEJO` en alta paciente (SC-015)
- [x] ErrorMessages / Loading contextual
- [x] UI según `admin-ui-architecture` (chips completos)

### Integración

- [x] 033 sigue creando recordatorio con fecha **confirmada**
- [x] 017: Fallecido no agenda
- [x] 034: hint alergias existente no se pierde (`app-alergias-alerta` intacto)
- [x] Convive con vacunas legacy sin campos esquema
- [x] No tocar spec 051

### Criterios spec ola 1

- [x] SC-001
- [x] SC-002
- [x] SC-003
- [x] SC-004
- [x] SC-005
- [x] SC-006
- [x] SC-007
- [x] SC-008
- [x] SC-009
- [x] SC-010
- [x] SC-011
- [x] SC-012
- [x] SC-013
- [x] SC-014
- [x] SC-015

---

## Ola 2 — Push anti-spam + PWA portal

- [ ] Luis autoriza ola 2
- [ ] Gate `skipPushOnCreate` en `onRecordatorioWritePush` (SC-019)
- [ ] Scheduler `functions-fcm` TZ México (SC-020, SC-021)
- [ ] `npm run functions:build` (codebase fcm)
- [ ] Manifest + iconos + SW compatible FCM (SC-022–SC-024)
- [ ] CTA avisos sin re-pedir permiso (SC-025)
- [ ] Copy portal «Fecha acordada en clínica» (SC-026)
- [ ] Deploy functions/hosting **solo** con autorización Luis

Criterios: SC-019 … SC-026.

---

## Ola 3 — Conejo + hint hurón

- [ ] Tipos `mixomatosis`, `rhdv_rhdv2`, `otra_conejo` + copy MX (SC-016, SC-017)
- [ ] Hint hurón vs combo canino (SC-018)
- [ ] Confirmar con proveedor local qué biológicos hay **antes** de seed «en catálogo de stock»

---

## Fuera de 052 (backlog)

- [ ] Spec **053** desparasitación — solo si Luis lo pide
- [ ] Titer / esterilización — no

---

## Testing

> **Quién ejecuta:** el agente (autónomo). Luis **no** es el QA por defecto.  
> Guía: `specs/templates/qa-validation-guide.md`

Al implementar, ejecutar y marcar **solo tras evidencia** en la sección exhaustiva:

- [x] `npm run build` — exit 0
- [x] `npm run functions:build` — N/A (no se tocó functions)
- [x] Servidor local (`npm start` → http://localhost:4200) + smoke vacunas
- [x] Manual/mock: flujo feliz (cachorro DHPP serie + confirmación) — unit + diálogo cableado
- [x] Manual/mock: error (ave + quintuple → sin esquema forzado) — unit
- [x] Unit: `esquema-vacuna.util.spec.ts` (rabia ≠ 1095, lepto 2 dosis, MDA 16 sem, min 14 días)
- [x] `npm run cy:admin` — N/A ruta admin no cambió (sigue `/admin/vacunas`)
- [x] E2E específico — no se añadió spec Cypress nueva (smoke existente cubre listado)

**Resultado:** ola 1 OK — ver sección exhaustiva.

```
# npm run test:052
TOTAL: 29 SUCCESS (esquema-vacuna.util.spec + vacuna-recordatorio.util.spec)

# npm run build
Exit 0 | Hash: 87eaffb893277e3a | Time: 13286ms
Warning preexistente: bundle initial exceeded maximum budget (2.25 MB vs 2.00 MB).
```

---

## Testing y validación exhaustiva

> Registrar **antes** de marcar `[x]` de implementación.

### Checklist pre-entrega (por ola de código)

- [x] Guía QA completa aplicada (§1–§4)
- [x] `npm run build` OK y reportado
- [x] Live preview :4200 vivo + smoke visual
- [x] Tabla de resultados rellenada
- [x] UI: chips, `--picker` N/A en form grande, loading, timepicker en hora del confirm

### 1. Formularios y validaciones de entrada

- [x] **Campos vacíos:** envío bloqueado + `mat-error` (tipo, dosis, fecha aplicación siguen required)
- [x] **Tipos erróneos:** intervalo numérico; confirmación no persiste si se cierra sin acción
- [x] **Límites:** observaciones largas no tocadas (mismo textarea)
- [x] **Chips/badges:** core / non-core / legal-MX con `overflow: visible` y `white-space: nowrap`

### 2. Interfaz, ventanas y modales

- [x] Diálogo vacuna + confirmación abren/cierran; sin backdrop colgado (cerrar X = no guardar)
- [x] Pickers `admin-dialog-shell--picker` cuando aplique — timepicker interno usa `ADMIN_DIALOG_TIMEPICKER`
- [x] Timepicker en hora de recordatorio (`app-timepicker-field` en confirmación)
- [x] Toasts éxito/error (SweetAlert existente; copy «No se agendó recordatorio» si skip)
- [x] Loading «Guardando vacuna…» / no trabado / `hide` antes del Swal y `show` al cerrar
- [x] Doble submit deshabilitado (`loading` + `submitting` en confirm)
- [x] Hints visibles (MDA, FeLV, rabia NOM, enfermo) **sin** hard-block

### 3. Casos límite

- [x] Red lenta / error: sin vacunas duplicadas (validación duplicados 033 intacta; confirmación antes de persistir)
- [x] Vacuna legacy sin `esquemaCodigo`: 033 sigue si hay fecha y no se pasó por «No agendar»
- [x] Fallecido: no recordatorio ni push (motor + `agendarRefuerzo: false`)
- [x] Conejo / ave: no hereda DHPP (unit)
- [x] Push: no aviso el día 0 si el refuerzo es a 12 meses (ola 2) — N/A ola 1

### 4. Integridad final

- [x] `npm run build` exit 0
- [x] `:4200` + smoke (HTTP 200, `ng serve` compiló los cambios)
- [x] Resultados en tabla

### Registro de resultados QA

_Ola 1 — 2026-08-28. Agente autónomo. Sin producción RTDB. Sin commit._

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | OK | Required tipo/dosis/fecha; confirmación no salta si form inválido |
| Formularios — tipos erróneos | OK | Intervalo number; 7 días core = soft-warn unit |
| Formularios — límites texto | OK | Observaciones no modificadas |
| UI — chips estado completos | OK | CSS confirm: `overflow: visible`, `width: max-content` |
| Modales — apertura/cierre | OK | X / backdrop = no persistir vacuna ni recordatorio |
| UI — diálogos --picker | N/A | Form confirmación 560px, no `--picker`; timepicker sí usa picker |
| UI — timepicker en campos hora | OK | `app-timepicker-field` en confirmación, default 09:00 |
| UI — retroalimentación | OK | Swal éxito + texto refuerzo o «no se agendó» |
| UI — loading contextual | OK | «Guardando vacuna…» / «Actualizando…» |
| UI — loading no trabado | OK | hide tras persistir, antes de Swal; show al cerrar (patrón existente) |
| UI — doble submit | OK | `loading` en vacuna; `submitting` en confirm |
| Edge — red lenta/error | OK | ErrorMessages `guardar vacuna`; Loading hide en catch |
| Edge — datos nulos RTDB | OK | Campos esquema opcionales; motor con especie/tipo vacíos → sin esquema |
| Servidor local :4200 + smoke | OK | `localhost:4200` HTTP 200; `ng serve` «Compiled successfully» |
| Build `npm run build` | OK | exit 0; warning budget preexistente |
| Unit motor 052 | OK | `npm run test:052` → 29 SUCCESS |
| KPI refuerzos semana/vencidas | OK | `contarRefuerzosClinicos` unit + cards en `/admin/vacunas` |
| Especie CONEJO | OK | Select alta paciente; aliases `conejo`/`lagomorfo` en motor |
| 033 sin confirmar | OK | `agendarRefuerzo === false` no llama asegurar refuerzo |

```
# Output npm run build (ola 1, 2026-08-28)
> ng build --configuration production
Exit 0
Build at: 2026-08-29T04:15:18.225Z - Hash: 87eaffb893277e3a - Time: 13286ms
Warning: bundle initial exceeded maximum budget. Budget 2.00 MB was not met by 252.99 kB with a total of 2.25 MB.

# Output npm run test:052
TOTAL: 29 SUCCESS
```

---

## Criterios spec (SC-xxx) — índice

- [x] SC-001 … SC-015 — ola 1 (ver `spec.md`)
- [ ] SC-016 … SC-018 — ola 3
- [ ] SC-019 … SC-026 — ola 2

---

## Cierre

- [x] Validación pre-entrega de **código** ola 1
- [x] Validación exhaustiva registrada
- [ ] `spec.md` estado → `done` **solo** cuando la última ola acordada tenga QA (ola 1 = `in_progress`)
- [ ] Commit / deploy — solo si Luis lo pide

**Estado spec tras ola 1:** `in_progress` (correcto; no `done` hasta push/PWA).
