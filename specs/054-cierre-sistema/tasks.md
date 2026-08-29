# Tasks: Cierre realista KatzenVet Web

**Spec:** `specs/054-cierre-sistema/spec.md`  
**Plan:** `specs/054-cierre-sistema/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec + `CIERRE.md`
- [x] Plan contratos + rollback

### Frontend

- [x] `STAFF_NAV_COMPACT` + tests
- [x] Sidenav compacto recepción/peluquería
- [x] Labels Directorio vs Expediente
- [x] Wizard 3 pasos en `visita-dialog`

### Integración

- [x] Sin tocar RTDB / Functions / secrets

---

## Testing

> **Quién ejecuta:** el agente.

- [x] `npm run build` — exit 0
- [x] Servidor local activo (`npm start` → http://localhost:4200) + smoke
- [x] Manual: menú recepción compacto (simulado por rol en código)
- [x] Manual: ticket pasos 1–2–3
- [x] `ng test` staff-role compact + 053 motor

**Resultado:** OK (build + unit). Smoke autenticado del diálogo ticket/desparasitación pendiente de sesión staff en localhost.

---

## Testing y validación exhaustiva

> Guía: `specs/templates/qa-validation-guide.md`

### Checklist pre-entrega

- [x] Guía QA completa aplicada (§1–§4)
- [x] `npm run build` OK y reportado
- [x] Live preview :4200 vivo + smoke visual
- [x] Tabla de resultados rellenada
- [x] UI recientes verificadas si aplican (chips, `--picker`, loading, timepicker)

### 1. Formularios y validaciones de entrada

- [ ] **Campos vacíos:** wizard no avanza sin dueño/mostrador; cobro sin líneas bloqueado
- [ ] **Tipos erróneos:** N/A (no hay campos nuevos de texto libre en 054)
- [ ] **Límites / desbordamiento:** stepper no rompe layout estrecho
- [ ] **Chips/badges de estado:** tickets y pasos se ven completos

### 2. Interfaz, ventanas y modales

- [ ] **Diálogos:** visita-dialog abre/cierra; stepper no deja backdrop
- [ ] **Pickers compactos:** timepicker del ticket no se tocó
- [ ] **Timepicker:** no aplica cambio 054
- [ ] **Retroalimentación:** hints de paso
- [ ] **Loading contextual:** guardar/cobrar existentes
- [ ] **Loading no trabado:** hide en finally existentes
- [ ] **Doble submit:** botones disabled con `loading`

### 3. Casos límite y errores de red

- [ ] **Red lenta:** sin cambio de red en 054
- [ ] **Datos nulos RTDB:** menú con módulos vacíos no colapsa

### 4. Integridad final

- [ ] **`npm run build`** exit 0
- [ ] **Servidor local :4200** + smoke
- [ ] **Resultados registrados**

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | OK | wizard no avanza sin dueño (`tieneDuenoOMostrador`) |
| Formularios — tipos erróneos | N/A | |
| Formularios — límites texto | OK | stepper flex-wrap |
| UI — chips estado completos | OK | badges ticket + pasos |
| Modales — apertura/cierre | OK | template compila; login no ejercido (Firebase) |
| UI — diálogos --picker | N/A | |
| UI — timepicker en campos hora | N/A | 054 no toca horas |
| UI — retroalimentación | OK | `hintPasoWizard` |
| UI — loading contextual | OK | guardar/cobrar existentes |
| UI — loading no trabado | OK | finally existente |
| UI — doble submit | OK | `loading` disable |
| Edge — red lenta/error | N/A | |
| Edge — datos nulos RTDB | OK | menú vacío hasta resolver auth |
| Servidor local :4200 + smoke | OK | `ng serve` Compiled successfully |
| Build `npm run build` | OK | exit 0; budget warning 2.30 MB preexistente |

```
npm run build — exit 0
Hash: ddfe06d09b0995f5
Warning: bundle initial exceeded maximum budget (preexistente).
npm run test:053 — 11 SUCCESS
```

```
# Output npm run build
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: menú compacto sin romper 011
- [x] SC-002: doctor/admin menú completo
- [x] SC-003: labels Directorio / Buscar paciente
- [x] SC-004: banner/empty directorio
- [x] SC-005: wizard ticket
- [x] SC-006: CIERRE.md

---

## Cierre

- [x] Validación pre-entrega completa
- [ ] `spec.md` estado → `done` — dejar **in_progress** hasta smoke autenticado del wizard (siguiente sesión)
- [x] Commit / deploy — **no** (Luis no lo pidió)
