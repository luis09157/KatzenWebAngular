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
- [x] Migrar `cita-dialog` al picker compartido
- [x] Migrar `banio-dialog` (eliminar seleccionar-cliente-banio-dialog)
- [x] Migrar `vacuna-dialog` (eliminar seleccionar-cliente-vacuna-dialog)
- [x] Migrar `historial-dialog` (eliminar seleccionar-cliente-dialog)
- [x] Migrar `recordatorio-dialog` (eliminar seleccionar-cliente-recordatorio-dialog)

---

## Testing

- [x] `npm run build` — exit 0 (2026-08-26 unificación completa)
- [x] Servidor local :4200 activo
- [x] Cypress smoke actualizado (historiales → app-cliente-paciente-picker)
- [x] Commit + push + deploy hosting (autorizado Luis)

---

## Testing y validación exhaustiva

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Picker — cliente autocomplete | OK | `cliente-search.util.ts`; filtra nombre/tel/expediente |
| Picker — paciente filtrado | OK | Solo activos del `cliente_id` |
| Pensión — crear estancia | OK | Referencia previa (9675cc4) |
| Citas — nueva cita | OK | `cita-dialog` usa picker; sin autocomplete inline |
| Baños — nuevo baño | OK | Modal único con picker; autorrelleno `tamano_perro` |
| Vacunas — nueva vacuna | OK | Picker embebido; flujo expediente sin picker |
| Historiales — nuevo historial | OK | Picker en modal; expediente mantiene paciente fijo |
| Recordatorios — nuevo | OK | Picker embebido; edición sin picker |
| Formularios — IDs required | OK | Validators en FormGroup padre |
| Build `npm run build` | OK | exit 0, hash 3354443b907577da |
| Diálogos duplicados eliminados | OK | 4 componentes `seleccionar-cliente-*` borrados |

```
Build at: 2026-08-26T22:07:52.890Z — Time: 69117ms — exit 0
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 a SC-008

---

## Cierre

- [x] Validación pre-entrega completa
- [x] `spec.md` estado → `done`
- [x] Commit / push / deploy hosting
