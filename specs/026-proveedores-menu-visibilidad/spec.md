# Spec: Proveedores visibles en menú admin

**ID:** 026-proveedores-menu-visibilidad  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** Cursor agent (Luis)

---

## Problema

Al crear un producto, el formulario exige **Proveedor principal** (dropdown), pero el staff no ve una entrada clara de **Proveedores** en el menú lateral: solo llega al CRUD vía el dashboard de Inventario (`/admin/inventario` → tarjeta). Eso genera la percepción de que “no hay CRUD de proveedores” aunque el módulo ya exista.

---

## User stories

### US-1 — Descubrir y gestionar proveedores

Como **staff admin**  
Quiero **ver “Proveedores” en el menú** (junto a Inventario) y abrir el CRUD  
Para **alta/edición/borrado de proveedores sin depender del dashboard**

**Criterios de aceptación:**

- [x] SC-001: En el sidenav admin aparece **Proveedores** (mismo permiso `inventario`) y navega a `/admin/inventario/proveedores`
- [x] SC-002: La página lista, busca, crea, edita y borra (baja lógica) proveedores con shell admin (KPI + banner + tabla)
- [x] SC-003: El select de **Nuevo/Editar producto** muestra proveedores activos creados en ese CRUD
- [x] SC-004: Desde el diálogo de producto hay enlace **Administrar proveedores** hacia el CRUD

### US-2 — Humo E2E

Como **equipo**  
Quiero **Cypress smoke/CRUD** del módulo  
Para **no regresar a “módulo oculto”**

**Criterios de aceptación:**

- [x] SC-005: `admin-modules-authenticated` y/o `admin-crud-proveedores` cubren la ruta
- [x] SC-006: `npm run build` OK; live preview en localhost

---

## Fuera de alcance

- Nuevo `StaffModule` separado (sigue bajo `inventario`)
- Deploy de Functions / Resend
- Refactor de Órdenes de compra / movimientos (solo anotar gaps)
- Cambios de costo/margen/IVA del diálogo de producto (otro agente)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** sin cambios de esquema. Lectura/escritura existente en `Katzen/Inventario/Proveedores/{id}` (campos opcionales legacy). App móvil no afectada (nodo inventario admin).

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Inventario/Proveedores/{id}` | staff | staff | baja lógica `activo: false` |

- **Estrategia de Datos de Prueba:** mock `MOCK_PROVEEDOR` en `src/app/core/testing/mock-data.ts`. No conectar a producción para desarrollo de UI.

- **Patrones UI Reutilizados:** `admin-page`, `app-admin-kpi-grid`, `app-admin-page-banner`, `app-admin-data-panel`, `admin-dialog-shell`, copy **Borrar**.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador / doctor / recepcionista / peluquero / etc. | sí (módulo `inventario`, política 011) |
| portal client | no |

---

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/admin/inventario/proveedores` | CRUD Proveedores |

---

## Success criteria (resumen)

SC-001…SC-006 arriba.
