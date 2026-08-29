# Tasks: Modo operación guiado

**Spec:** `specs/048-modo-operacion-guiado/spec.md`  
**Plan:** `specs/048-modo-operacion-guiado/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec 048 creada desde templates
- [x] Plan con Contratos de Datos/UI y Mitigación/Rollback

### Backend

- [x] N/A — sin cambios RTDB/functions

### Frontend

- [x] Componente `app-flow-hint` + util `mensajeHintClientePaciente`
- [x] SharedModule declara/exporta FlowHint
- [x] Hints: cliente, paciente, cita, vacuna, historial, recordatorio
- [x] Migración banio + visita a app-flow-hint
- [x] POS: inventario hint + badge «Descuenta inventario»
- [x] Empty states pensión + consentimientos

### Integración

- [x] Sin cambios de routing ni menú (ola 1)
- [x] Ola 2: hints listas citas/baños/finanzas/movimientos
- [x] Trazabilidad inventario↔ticket (visita-dialog + movimientos)

---

## Testing

- [x] `npm run build` — exit 0 (2026-08-28)
- [x] `npm run test:039` — 13 SUCCESS
- [x] `npm run test:040` — 12 SUCCESS
- [x] `npm run test:046` — 3 SUCCESS
- [x] Servidor local activo (`npm start` → http://localhost:4200)
- [x] ReadLints archivos editados — sin errores

**Resultado:** OK

---

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA aplicada (diálogos, hints, empty states, build)
- [x] `npm run build` OK — exit 0
- [x] Live preview :4200 vivo (ng serve activo)
- [x] Tabla de resultados completada

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | OK | Hints contextuales antes de submit |
| Formularios — tipos erróneos | N/A | Sin cambios validación |
| Formularios — límites texto | N/A | Sin cambios |
| UI — chips estado completos | OK | Badge inventario en línea producto |
| Modales — apertura/cierre | OK | Solo hints aditivos |
| UI — diálogos --picker | N/A | No aplica |
| UI — timepicker en campos hora | OK | cita-dialog sin cambios timepicker |
| UI — retroalimentación | OK | Copy inventario alineado a `registrarSalida` |
| UI — loading contextual | N/A | Sin cambios async |
| UI — loading no trabado | N/A | Sin cambios |
| UI — doble submit | N/A | Sin cambios |
| Edge — red lenta/error | N/A | Solo UI |
| Edge — datos nulos RTDB | N/A | Solo UI |
| Servidor local :4200 + smoke | OK | ng serve activo en :4200 |
| Build `npm run build` | OK | exit 0, ~10.3s |

```
Build at: 2026-08-29T00:57:52.297Z — exit 0
Warning: bundle initial exceeded budget (2.11 MB, preexistente)
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: app-flow-hint con variantes
- [x] SC-002: cliente, paciente, cita
- [x] SC-003: vacuna, historial, recordatorio
- [x] SC-004: banio + visita migrados
- [x] SC-005: hint inventario al agregar productos
- [x] SC-006: badge Descuenta inventario
- [x] SC-007: copy mostrador reforzado
- [x] SC-008: empty states pensión + consentimientos
- [x] SC-009: hints listas citas, baños, finanzas, movimientos
- [x] SC-010: KPIs baños humanizados
- [x] SC-011: trazabilidad inventario↔ticket

---

## Cierre

- [x] Validación pre-entrega completa
- [ ] `spec.md` estado → `done` (permanece in_progress hasta revisión Luis)
