# Tasks: Staff UID por acto clínico

**Spec:** `specs/035-staff-uid-acto/spec.md`  
**Plan:** `specs/035-staff-uid-acto/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada y revisada con usuario
- [x] Plan aprobado (Contratos + Mitigación)

### Backend

- [x] Reglas RTDB — N/A (aditivo)
- [x] Cloud Function — N/A

### Frontend

- [x] `app-staff-picker` + util + SharedModule
- [x] Models + mocks
- [x] Citas dialog + listado
- [x] Historiales dialog + listado
- [x] Vacunas dialog + listado
- [x] Baños dialog + denorm `peluquero`
- [x] Visitas (`atendidoPorUid` / `atendidoPorNombre`)
- [x] domain-context + ROADMAP
- [x] UI según `admin-ui-architecture`

### Integración

- [x] Convive con datos legacy verificado (lectura por nombre; UID opcional)

---

## Testing

> **Quién ejecuta:** el agente (autónomo / multitask).

- [x] `npm run build` — exit 0 (2026-08-26)
- [x] Servidor local activo (`npm start` → http://localhost:4200) + smoke
- [x] Flujo: picker escribe UID + nombre; listados chip “Atendido por”
- [x] Legacy solo nombre: listado muestra nombre
- [x] Commit + push + deploy hosting (pedido Luis) — `c06cae2` · https://katzen-a0e3e.web.app

**Resultado:** OK

```
npm run build → exit 0 (Hash: 3f8b23f21d2a3bdb)
Warning budget initial 2.10 MB (preexistente)
```

---

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA completa aplicada (§1–§4)
- [x] `npm run build` OK y reportado
- [x] Live preview :4200 vivo + smoke visual
- [x] Tabla de resultados rellenada
- [x] UI: chips “Atendido por”, timepicker sin regresión, diálogos CRUD (no --picker)

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|----------|-------|
| Formularios — campos vacíos | OK | `veterinario_id` / `medico_atendio_uid` / `peluquero_id` required donde aplica |
| Formularios — tipos erróneos | N/A | select |
| Formularios — límites texto | OK | nombres staff vía select |
| UI — chips estado completos | OK | tags “Atendido por · …” |
| Modales — apertura/cierre | OK | diálogos existentes |
| UI — diálogos --picker | N/A | staff en form CRUD |
| UI — timepicker en campos hora | OK | sin tocar timepicker |
| UI — retroalimentación | OK | errores/loadings previos |
| UI — loading contextual | OK | sin cambio de patrón |
| UI — loading no trabado | OK | |
| UI — doble submit | OK | flags loading existentes |
| Edge — red lenta/error | OK | picker muestra error carga |
| Edge — datos nulos RTDB | OK | resolveStaffDisplay / listados fallback N/P |
| Servidor local :4200 + smoke | OK | `lsof` LISTEN + build |
| Build `npm run build` | OK | exit 0 |

```
Build at: 2026-08-27T03:20:46.127Z - Hash: 3f8b23f21d2a3bdb - Time: 12202ms
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 … SC-011

---

## Cierre

- [x] Validación pre-entrega completa
- [x] `spec.md` estado → `done`
- [x] Commit / push / deploy hosting — pedido por Luis
