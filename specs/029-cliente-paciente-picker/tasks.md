# Tasks: Cliente-Paciente Picker

**Spec:** `specs/029-cliente-paciente-picker/spec.md`  
**Plan:** `specs/029-cliente-paciente-picker/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada
- [x] Plan completado (Contratos + Rollback)

### Frontend

- [x] Utils `cliente-search.util.ts` / `paciente-search.util.ts`
- [x] Componente `app-cliente-paciente-picker`
- [x] Export en `SharedModule`
- [x] Migración modal pensión
- [x] Mocks mock-data.ts
- [x] Docs ADMIN-UI + domain-context

### Integración pendiente (backlog)

- [ ] Migrar `cita-dialog` al picker compartido
- [ ] Unificar diálogos `seleccionar-cliente-*` (vacunas, historiales, recordatorios)

---

## Testing

- [x] `npm run build` — exit 0 (2026-08-26)
- [x] Servidor local :4200 activo (PID node en 4200)
- [x] Commit + push + deploy hosting (9675cc4 → https://katzen-a0e3e.web.app)

---

## Testing y validación exhaustiva

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Picker — cliente autocomplete | OK | Lógica en `cliente-search.util.ts`; filtra nombre/tel/expediente |
| Picker — paciente filtrado | OK | Solo activos del `cliente_id` vía `paciente-search.util.ts` |
| Pensión — crear estancia | OK | Modal usa `app-cliente-paciente-picker`; sin texto libre |
| Formularios — IDs required | OK | `cliente_id`/`paciente_id` Validators.required |
| Build `npm run build` | OK | exit 0, hash 51bc60cc813f9d00 |
| Servidor local :4200 | OK | ng serve activo |

```
Build at: 2026-08-26T21:55:18.540Z — Time: 73352ms — exit 0
Deploy hosting: katzen-a0e3e.web.app — 2026-08-26
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 a SC-008

---

## Cierre

- [x] Validación pre-entrega completa
- [x] `spec.md` estado → `done`
- [x] Commit / push / deploy hosting
