# Plan técnico: Proveedores visibles en menú

**Spec:** `specs/026-proveedores-menu-visibilidad/spec.md`  
**Estado:** approved  

---

## Resumen

El CRUD de proveedores **ya existía** (`ProveedoresComponent`, diálogo, service, Cypress). Esta entrega lo **hace visible** en el sidenav, añade enlace desde el diálogo de producto (sin tocar costo/margen/IVA) y endurece null-safety / KPIs del listado.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/layouts/admin-main-layout.component.html` | modificar | ítem menú Proveedores |
| `src/app/layouts/admin-main-layout.component.css` | modificar | estilo sub-ítem |
| `src/app/inventario/productos/producto-dialog.component.*` | modificar | solo enlace “Administrar proveedores” |
| `src/app/inventario/proveedores/proveedores.component.*` | modificar | KPI + null-safe chips |
| `src/app/core/testing/mock-data.ts` | modificar | `MOCK_PROVEEDOR` |

### Firebase

Sin cambios (sin deploy database/functions).

### Cypress

| Archivo | Acción |
|---------|--------|
| `cypress/e2e/admin-crud-proveedores.cy.ts` | ya existe — revalidar |
| `cypress/e2e/admin-modules-authenticated.cy.ts` | ya incluye ruta |

---

## Modelo de datos

```text
Katzen/Inventario/Proveedores/{id}
  razon_social, nombre_comercial, rfc?, contacto_*, direccion?, ...
  productos_suministra?: string[]
  dias_entrega?, condiciones_pago?, calificacion?, activo, created_at, updated_at
```

Sin campos nuevos.

---

## Flujos

1. Staff abre menú → **Proveedores** → `/admin/inventario/proveedores`
2. Crea proveedor → aparece en select de producto / OC
3. Desde **Nuevo producto** → “Administrar proveedores” cierra diálogo y navega al CRUD
4. Borrar → `activo: false` (oculto del listado y de selects)

### Errores esperados

| Caso | Mensaje |
|------|---------|
| Formulario incompleto | Swal + `mat-error` |
| Falla RTDB | `ErrorMessagesService` contexto guardar/eliminar proveedor |

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto RTDB:** ninguno nuevo; solo UI/navegación.
- **Mocks:** `MOCK_PROVEEDOR`.
- **UI:** menú + shell admin existente; diálogo producto: un botón enlace, sin alterar sección costo/IVA.

---

## Plan de Mitigación y Rollback

| Riesgo | Mitigación | Rollback |
|--------|------------|----------|
| Menú confunde con Inventario | Sub-ítem con icono `local_shipping` + `routerLinkActive` exact en Inventario | Quitar el `<a>` del sidenav |
| Enlace en producto cierra diálogo sin guardar | Copy claro “Administrar proveedores”; no auto-navega | Revertir botón en HTML/TS |
| Conflicto con agente costo/margen | Solo tocar sección Proveedor del diálogo | `git checkout` de esas líneas |

---

## Gaps relacionados (inventario) — no bloqueantes

Anotar en entrega; no arreglar aquí salvo menú:

- Submódulos Productos / Movimientos / OC / Alertas / Reportes solo vía dashboard Inventario (mismo discovery gap)
- Layout legacy `admin-layout` con card `/admin/medicamentos` (ruta dudosa; layout no es el shell activo)
- KPI “Inactivos” no aplicaba: `getProveedores()` ya filtra `activo !== false`
