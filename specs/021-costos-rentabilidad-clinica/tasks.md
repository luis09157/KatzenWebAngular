# Tasks: Costos y rentabilidad de clínica

**Spec:** `specs/021-costos-rentabilidad-clinica/spec.md`  
**Plan:** `specs/021-costos-rentabilidad-clinica/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada
- [x] Plan con Contratos + Mitigación

### Backend

- [x] Reglas RTDB `Katzen/Finanzas` + index `categoria`
- [x] Sin Cloud Functions

### Frontend

- [x] Modelos caja + plantilla costo
- [x] `PlantillaCostoService`
- [x] Diálogo plantilla + diálogo caja (categoría/margen)
- [x] Finanzas tabs: Caja / Costos / Rentabilidad
- [x] Baño→caja con categoría
- [x] Labels inventario costo/venta/IVA
- [x] Mocks

### Integración

- [x] Cypress finanzas
- [x] ROADMAP + domain-context + README specs

---

## Testing

> **Quién ejecuta:** el agente. Guía: `specs/templates/qa-validation-guide.md`

- [x] `npm run build` — exit 0 (warning budget bundle inicial, sin errores tipado)
- [x] Servidor local `:4200` + smoke (contenedor + tabs + KPIs)
- [x] Cypress `admin-crud-finanzas.cy.ts` — 1 passing (10s)
- [x] Flujo: cobro con categoría + borrar (Cypress)
- [x] Plantillas: error RTDB no bloquea caja (Swal removido en load)

**Resultado:** OK

---

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA aplicada (formularios, modales, loading, chips, build)
- [x] `npm run build` OK
- [x] Live preview :4200 vivo
- [x] Tabla resultados rellenada
- [x] UI chips / loading / Borrar verificadas

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | OK | Validadores + Swal incompleto en diálogos |
| Formularios — tipos erróneos | OK | min 0.01 monto; cantidad/costo numéricos |
| Formularios — límites texto | OK | concepto minLength 3 |
| UI — chips estado completos | OK | Ingreso/Egreso/IVA/categoría badges |
| Modales — apertura/cierre | OK | Cypress + diálogos shell |
| UI — diálogos --picker | N/A | CRUD no picker |
| UI — timepicker | N/A | sin campos hora |
| UI — retroalimentación | OK | Swal éxito/error |
| UI — loading contextual | OK | Guardando / Eliminando |
| UI — loading no trabado | OK | finally hide |
| UI — doble submit | OK | disabled mientras loading |
| Edge — red lenta/error | OK | plantillas fallan sin bloquear caja |
| Edge — datos nulos RTDB | OK | categoría/margen opcionales |
| Servidor local :4200 + smoke | OK | http://localhost:4200 |
| Build `npm run build` | OK | exit 0 · Hash ad67d780 · 2026-08-26 |

```
npm run build → exit 0
npx cypress run --spec admin-crud-finanzas.cy.ts → 1 passing
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 … SC-012 (MVP)

---

## Cierre

- [x] Validación pre-entrega completa
- [ ] `spec.md` → `done` (tras commit/deploy)
- [ ] Commit / push / deploy — solicitado por Luis
