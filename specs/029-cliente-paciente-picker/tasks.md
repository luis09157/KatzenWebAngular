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

- [ ] `npm run build` — exit 0
- [ ] Servidor local :4200 + smoke pensión crear estancia
- [ ] Commit + push + deploy hosting (autorizado Luis)

---

## Testing y validación exhaustiva

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Picker — cliente autocomplete | pendiente | |
| Picker — paciente filtrado | pendiente | |
| Pensión — crear estancia | pendiente | |
| Formularios — IDs required | pendiente | |
| Build `npm run build` | pendiente | |
| Servidor local :4200 | pendiente | |

---

## Criterios spec (SC-xxx)

- [x] SC-001: Componente compartido
- [x] SC-002: Orden cliente→paciente
- [x] SC-003: Búsqueda clientes
- [x] SC-004: Pacientes filtrados
- [x] SC-005: IDs + selectionChange
- [x] SC-006: Sin texto libre pensión
- [x] SC-007: Pensión migrada
- [x] SC-008: Módulos listados en spec

---

## Cierre

- [ ] Validación pre-entrega completa
- [ ] `spec.md` estado → `done`
- [ ] Commit / push / deploy hosting
