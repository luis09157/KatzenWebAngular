# Plan técnico: Visibilidad módulos ocultos (Inventario)

**Spec:** `specs/027-menu-visibilidad-modulos/spec.md`  
**Estado:** approved  

---

## Resumen

Extender el patrón de spec 026: añadir sub-ítems de sidenav para todos los submódulos de inventario ya implementados. Limpieza legacy de enlaces rotos. Cypress smoke sidenav + reportes.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/layouts/admin-main-layout.component.html` | modificar | 6 sub-ítems bajo Inventario |
| `src/app/layouts/admin-main-layout.component.css` | — | sin cambio (estilo 026 reutilizado) |
| `src/app/dashboard/admin-layout.component.html` | modificar | card Medicamentos → productos |
| `src/app/dashboard/expediente-paciente/expediente-paciente.component.ts` | modificar | `/admin/paciente` |

### Firebase

Sin cambios.

### Cypress

| Archivo | Acción |
|---------|--------|
| `cypress/e2e/admin-inventario-sidenav.cy.ts` | crear |
| `cypress/e2e/admin-modules-authenticated.cy.ts` | modificar — reportes |
| `cypress/e2e/admin-crud-routes.cy.ts` | modificar — reportes |

### Specs / docs

| Archivo | Acción |
|---------|--------|
| `specs/027-menu-visibilidad-modulos/*` | crear |
| `specs/README.md` | índice 027 |
| `specs/ROADMAP.md` | anotar 027 done |

---

## Sub-ítems sidenav

| Label | Ruta | Icono |
|-------|------|-------|
| Productos | `/admin/inventario/productos` | `category` |
| Movimientos | `/admin/inventario/movimientos` | `swap_horiz` |
| Proveedores | `/admin/inventario/proveedores` | `local_shipping` |
| Órdenes de compra | `/admin/inventario/ordenes` | `receipt_long` |
| Alertas | `/admin/inventario/alertas` | `notification_important` |
| Reportes | `/admin/inventario/reportes` | `assessment` |

Todos: `*ngIf="canShow('inventario')"`, `class="admin-nav-subitem"`, `routerLinkActive="active"`.

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto RTDB:** ninguno.
- **Mocks:** N/A (solo navegación).
- **UI:** reutilizar CSS sub-ítem 026; Inventario padre mantiene `routerLinkActiveOptions exact: true`.

---

## Plan de Mitigación y Rollback

| Riesgo | Mitigación | Rollback |
|--------|------------|----------|
| Sidenav largo en móvil | Sub-ítems indentados; scroll nativo del nav-list | Quitar `<a>` añadidos |
| Duplicar acceso dashboard + menú | Coherente: dashboard sigue siendo hub KPI | N/A |
| Reportes sin `.admin-page` | Cypress usa `.reportes-container` | Revertir assert container |

---

## Deploy

Hosting only (autorizado Luis 2026-08-26). Sin database/functions.
