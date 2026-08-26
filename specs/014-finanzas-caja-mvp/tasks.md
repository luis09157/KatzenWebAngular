# Tasks: Finanzas / caja MVP

**Spec:** `specs/014-finanzas-caja-mvp/spec.md`  
**Plan:** `specs/014-finanzas-caja-mvp/plan.md`  

---

## Implementación

- [x] StaffModule `finanzas` + routing + menú
- [x] Servicio RTDB + rules `Katzen/Caja`
- [x] Lista + diálogo alta (método pago + IVA)
- [x] KPIs día + filtro fecha
- [x] Cypress smoke `admin-crud-finanzas.cy.ts`
- [x] Campo opcional `Banios.cajaMovimientoId` (modelo)
- [ ] SC-006 CSV (futuro)
- [ ] Link UI baño → caja (futuro)

---

## Testing y validación exhaustiva

| Check | Resultado | Notas |
|-------|-----------|-------|
| Formulario alta (concepto, monto, método, IVA, fecha) | PASS (código + E2E) | Diálogo `admin-dialog-shell` |
| Soft-delete «Borrar» | PASS E2E | `activo: false` |
| KPI día | PASS visual/código | Neto / ingresos / efectivo / IVA |
| `npm run build` | PASS | 2026-08-26 — budget warning 2.01 MB |
| Cypress `admin-crud-finanzas` | PASS | Create cobro + Borrar |
| Cypress `admin-crud-proveedores` | PASS | Create→Edit→Borrar |
| Live preview `:4200` | PASS | `/admin/finanzas` |
| Deploy database | PASS | rules `Katzen/Caja` |
| Deploy hosting | (sesión) | MVP finanzas + proveedores |
| QA guide formularios/modales | PASS checklist | Sin timepicker en este módulo |

### QA guide (extracto)

- [x] Diálogo sin `mat-dialog-title`
- [x] Loading contextual al guardar/borrar
- [x] Empty state + CTA
- [x] Chips estado IVA / tipo visibles
- [x] Roles vía `*` (011)
