# Tasks: Desparasitación — esquemas y recordatorio

**Spec:** `specs/053-desparasitacion-esquemas/spec.md`  
**Plan:** `specs/053-desparasitacion-esquemas/plan.md`  

---

## Implementación

### Setup

- [x] Spec + plan (contratos + rollback)

### Frontend

- [x] Motor + defaults + models
- [x] Unit tests motor
- [x] Diálogo confirmar
- [x] Wire `recordatorio-dialog` + service
- [x] CTA expediente y Recordatorios

### Integración

- [x] Campos aditivos Recordatorios
- [x] `skipPushOnCreate` en auto
- [x] Fallecido no agenda

---

## Testing

- [x] `npm run test:053` — 11 SUCCESS
- [x] `npm run build` — exit 0
- [x] :4200 vivo (`ng serve` compiló)
- [x] Cancelar confirmación no guarda (código: `undefined` aborta)
- [x] No agendar guarda solo aplicación (código: `agendar: false`)
- [x] functions-fcm `npm test` — 12 pass (incl. isDewormReminder)

**Resultado:** OK unit + build. Diálogo real requiere login staff en localhost.

---

## Testing y validación exhaustiva

> Guía: `specs/templates/qa-validation-guide.md`

### Checklist pre-entrega

- [x] Guía QA completa aplicada (§1–§4)
- [x] `npm run build` OK y reportado
- [x] Live preview :4200 vivo + smoke visual
- [x] Tabla de resultados rellenada
- [x] UI recientes: chips, timepicker, loading, `--picker` si aplica

### 1. Formularios y validaciones de entrada

- [ ] **Campos vacíos:** tipo/fecha/paciente requeridos; confirmación sin fecha no Confirmar
- [ ] **Tipos erróneos:** intervalo numérico
- [ ] **Límites texto:** notas largas
- [ ] **Chips/badges:** categoría interna/externa completa

### 2. Interfaz, ventanas y modales

- [ ] **Diálogos:** recordatorio + confirm cierran limpio
- [ ] **Pickers:** no `--picker` en CRUD
- [ ] **Timepicker:** `app-timepicker-field` en confirm
- [ ] **Retroalimentación:** éxito con/sin próxima
- [ ] **Loading contextual:** Guardando…
- [ ] **Loading no trabado:** hide finally; no doble show
- [ ] **Doble submit:** `submitting` en confirm

### 3. Casos límite y errores de red

- [ ] **Red lenta:** loading visible
- [ ] **Datos nulos:** paciente sin especie → OTRO / sin esquema

### 4. Integridad final

- [ ] **`npm run build`**
- [ ] **:4200**
- [ ] Resultados registrados

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | OK | required + confirm sin fecha no Confirmar |
| Formularios — tipos erróneos | OK | intervalo number |
| Formularios — límites texto | OK | notas textarea |
| UI — chips estado completos | OK | badge interna/externa nowrap |
| Modales — apertura/cierre | OK | cancelar → undefined |
| UI — diálogos --picker | N/A CRUD | |
| UI — timepicker en campos hora | OK | `app-timepicker-field` en confirm |
| UI — retroalimentación | OK | Swal con/sin próxima |
| UI — loading contextual | OK | Guardando… |
| UI — loading no trabado | OK | hide finally |
| UI — doble submit | OK | `submitting` + `loading` |
| Edge — red lenta/error | OK | catch duplicado |
| Edge — datos nulos RTDB | OK | especie vacía → OTRO |
| Servidor local :4200 + smoke | OK | serve vivo; flujo autenticado pendiente |
| Build `npm run build` | OK | exit 0 |
| Unit `test:053` | OK | 11 SUCCESS |
| functions-fcm test | OK | 12 pass |

```
npm run test:053 — 11 SUCCESS
npm run build — exit 0
functions-fcm npm test — 12 pass
```

```
# Output
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 motor
- [x] SC-002 diálogo
- [x] SC-003 no agenda sin confirmar
- [x] SC-004 fallecido
- [x] SC-005 exóticos
- [x] SC-006 conejo/hurón
- [x] SC-007 CTA
- [x] SC-008 tipoDesparasitacion
- [x] SC-009 origen auto + skipPush
- [x] SC-010 campos aditivos

---

## Cierre

- [x] Validación pre-entrega
- [ ] `spec.md` → `done` — dejar **in_progress** hasta smoke autenticado del diálogo
- [x] Commit / deploy — no
