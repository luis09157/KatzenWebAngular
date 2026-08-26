# Tasks: Visibilidad módulos ocultos (Inventario)

**Spec:** `specs/027-menu-visibilidad-modulos/spec.md`  
**Plan:** `specs/027-menu-visibilidad-modulos/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec 027 creada (spec, plan, tasks + tabla discovery)
- [x] Plan con Contratos + Mitigación/Rollback

### Backend

- [x] N/A — sin reglas/functions

### Frontend

- [x] Sidenav: 6 sub-ítems `admin-nav-subitem` bajo Inventario
- [x] Legacy: card Medicamentos → `/admin/inventario/productos`
- [x] Legacy: expediente `/admin/paciente` (no `/admin/pacientes`)

### Integración

- [x] Permiso `canShow('inventario')` en todos los sub-ítems
- [x] Dashboard inventario sigue como hub (sin regresión)

---

## Testing

> **Quién ejecuta:** el agente.

- [x] `npm run build` — exit 0 (2026-08-26; budget warning 2.06 MB)
- [x] Servidor local activo (`npm start` → http://localhost:4200)
- [x] Cypress `admin-inventario-sidenav.cy.ts` — 7 passing (~1m49s)
- [x] `admin-modules-authenticated` incluye reportes (código)
- [x] `admin-crud-routes` incluye reportes (código)

**Resultado:** OK

---

## Testing y validación exhaustiva

> Guía: `specs/templates/qa-validation-guide.md`

### Checklist pre-entrega

- [x] Guía QA aplicada (§1–§4 aplicables — solo navegación)
- [x] `npm run build` OK y reportado
- [x] Live preview :4200 vivo
- [x] Tabla de resultados rellenada
- [x] N/A: formularios/modales/loading (sin cambios CRUD)

### Tabla de resultados

| Área | Resultado | Notas |
|------|-----------|-------|
| Build | OK | exit 0; budget warning 63 KB |
| Sidenav 6 sub-ítems | OK | DOM + navegación Cypress |
| Rutas inventario | OK | productos, movimientos, proveedores, órdenes, alertas, reportes |
| Legacy medicamentos | OK | card → productos |
| Legacy expediente | OK | `/admin/paciente` |
| Cypress sidenav | OK | 7/7 passing |
| Servidor :4200 | OK | ng serve activo |

---

## Criterios spec (SC-xxx)

- [x] SC-001: 6 sub-ítems con `admin-nav-subitem` + `canShow('inventario')`
- [x] SC-002: Rutas canónicas (tabla discovery en spec.md)
- [x] SC-003: UI existente carga sin regresión (Cypress)
- [x] SC-004: Card legacy Medicamentos → productos
- [x] SC-005: Expediente → `/admin/paciente`
- [x] SC-006: `admin-inventario-sidenav.cy.ts`
- [x] SC-007: reportes en admin-modules-authenticated
- [x] SC-008: build + localhost OK

---

## Cierre

- [x] Validación pre-entrega completa
- [x] Validación exhaustiva registrada
- [x] `spec.md` estado → `done`
- [x] Commit + push + deploy hosting (autorizado Luis)
