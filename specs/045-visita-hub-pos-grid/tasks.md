# Tasks: Visita hub + grid productos (045)

**Estado:** done  
**Spec:** `specs/045-visita-hub-pos-grid/spec.md`  
**UX:** principios en `specs/046-ux-intuitiva-guiada/`

---

## Hub ticket (cuenta del día)

- [x] T-001: Util pendientes baño + tests (`pendientes-visita.util`)
- [x] T-002: Panel «Pendientes de hoy» + Incluir (`banioId`)
- [x] T-003: Atajo Producto → picker + cantidad; stock insuficiente = no agregar
- [x] T-004: Al persistir: salida inventario con `visitaId` si hay `productoId`
- [x] T-005: Prompt post-alta baño «¿Agregar al ticket de hoy?»
- [x] T-006: Copy empty + hints (046: te falta dueño / agrega líneas)

## Grid productos

- [x] T-010: Toggle Lista / Cuadrícula
- [x] T-011: Tarjeta foto + nombre + precio + stock + acciones
- [x] T-012: Búsqueda aplica a ambas vistas

## Docs / índice

- [x] T-020: spec + plan 045
- [x] T-021: README + ROADMAP
- [x] T-022: domain-context (ticket = cuenta del día)

## Testing y validación exhaustiva

| Ítem | Resultado | Notas |
|------|-----------|-------|
| `npm run test:045` | **PASS** 4/4 | |
| `npm run build` | **PASS** | walk-in + hub |
| Pendientes baño en ticket | **PASS** | panel + incluir |
| Venta producto → picker / stock | **PASS** | |
| Grid productos | **PASS** | |
| Copy Cuenta del día + empty/hints | **PASS** | |
| Prompt post-baño | **PASS** | `ofertarTicketTrasAlta` |
| Preview `:4200` | **PASS** | |
| QA / UX 046 walk-in | **PASS** | ver 046 tasks |
| Cierre spec 045 | **PASS** | 2026-08-28 |
