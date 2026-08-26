# Tasks: Proveedores visibles en menú

**Spec:** `specs/026-proveedores-menu-visibilidad/spec.md`  
**Plan:** `specs/026-proveedores-menu-visibilidad/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada
- [x] Plan con Contratos + Mitigación/Rollback

### Backend

- [x] N/A — sin reglas/functions nuevas

### Frontend

- [x] Menú admin: entrada **Proveedores** → `/admin/inventario/proveedores`
- [x] CRUD existente verificado (lista, diálogo, service, KPIs)
- [x] Enlace desde diálogo producto → CRUD (sin tocar costo/margen/IVA) — ya en HEAD vía merge concurrente
- [x] Null-safe `productos_suministra` + KPI entrega ≤7 días
- [x] Mock `MOCK_PROVEEDOR`

### Integración

- [x] Mismo `staffModule: inventario` (StaffRoleGuard padre)
- [x] Select producto usa `getProveedores()` (solo activos)

---

## Testing

> **Quién ejecuta:** el agente.

- [x] `npm run build` — exit 0 (2026-08-26; warning budget initial bundle)
- [x] Servidor local activo (`npm start` → http://localhost:4200)
- [x] Smoke CRUD proveedores + menú (Cypress + markup sidenav)
- [x] Cypress: `admin-crud-proveedores.cy.ts` — 1 passing

**Resultado:** OK

---

## Testing y validación exhaustiva

> Guía: `specs/templates/qa-validation-guide.md`

### Checklist pre-entrega

- [x] Guía QA aplicada (§1–§4 aplicables)
- [x] `npm run build` OK y reportado
- [x] Live preview :4200 vivo
- [x] Tabla de resultados rellenada
- [x] UI: chips null-safe; copy Borrar; sin overlay trabado en flujo Cypress

### 1. Formularios y validaciones de entrada

- [x] Campos vacíos / teléfono email — cubierto por Cypress create con required + validadores existentes
- [x] Chips sin TypeError si `productos_suministra` ausente (null-safe)

### 2. Interfaz, ventanas y modales

- [x] Diálogo proveedor abre/cierra (Cypress crear→editar→borrar)
- [x] Enlace “Administrar proveedores” en diálogo producto (en código)
- [x] Menú muestra Proveedores (sidenav + assert Cypress)

### 3. Casos límite

- [x] Borrar → oculta del listado (Cypress)
- [x] Empty state presente en template

### 4. Integridad final

- [x] `npm run build` exit 0
- [ ] Commit + push + deploy hosting (autorizado Luis) — en curso

### Tabla de resultados

| Área | Resultado | Notas |
|------|-----------|-------|
| Build | OK | exit 0; budget warning 2.06 MB |
| Menú / ruta | OK | `/admin/inventario/proveedores` + sidenav |
| CRUD smoke | OK | Cypress create→edit→borrar |
| Cypress | OK | 1 passing (~28s; retry attempt 1) |
| Hosting deploy | pendiente | tras push |

---

## Gaps inventario (anotados, no cerrados)

- Productos/OC/movimientos/alertas/reportes: sin ítems de menú propios (solo dashboard Inventario)
- `admin-layout` legacy: card Medicamentos → `/admin/medicamentos` (shell no activo)
