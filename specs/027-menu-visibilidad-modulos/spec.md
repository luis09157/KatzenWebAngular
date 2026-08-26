# Spec: Visibilidad de módulos ocultos en menú admin

**ID:** 027-menu-visibilidad-modulos  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** Cursor agent (Luis)

---

## Problema

Tras la auditoría [Auditar módulos ocultos](3d6200ad-15a1-4a47-8d2e-528df1d6b875), varios submódulos de **Inventario** existían y funcionaban por ruta directa o dashboard, pero **no aparecían en el sidenav**. Eso obligaba al staff a recordar URLs o pasar siempre por `/admin/inventario` → tarjetas. La spec 026 resolvió **Proveedores**; esta entrega despliega el resto bajo el mismo patrón `admin-nav-subitem`.

---

## User stories

### US-1 — Descubrir submódulos de Inventario

Como **staff con permiso inventario**  
Quiero **ver Productos, Movimientos, Proveedores, Órdenes, Alertas y Reportes en el menú lateral**  
Para **acceder al CRUD sin depender del dashboard**

**Criterios de aceptación:**

- [x] SC-001: Bajo **Inventario** aparecen 6 sub-ítems con clase `admin-nav-subitem` y permiso `canShow('inventario')`
- [x] SC-002: Cada sub-ítem navega a su ruta canónica (tabla discovery abajo)
- [x] SC-003: Rutas cargan shell/UI existente sin regresión

### US-2 — Limpieza legacy mínima

Como **equipo**  
Quiero **corregir enlaces rotos legacy**  
Para **no confundir con rutas inexistentes**

**Criterios de aceptación:**

- [x] SC-004: Card legacy Medicamentos (shell `admin-layout`) apunta a productos, no `/admin/medicamentos`
- [x] SC-005: Expediente legacy navega a `/admin/paciente`, no `/admin/pacientes`

### US-3 — Humo E2E

Como **equipo**  
Quiero **Cypress del sidenav + reportes**  
Para **no regresar a módulos ocultos**

**Criterios de aceptación:**

- [x] SC-006: `admin-inventario-sidenav.cy.ts` valida visibilidad y navegación de los 6 sub-ítems
- [x] SC-007: `admin-modules-authenticated` incluye `/admin/inventario/reportes`
- [x] SC-008: `npm run build` OK; live preview localhost:4200

---

## Tabla discovery (antes → después)

| Módulo | Ruta | Menú sidenav (antes) | Menú sidenav (después) |
|--------|------|----------------------|------------------------|
| Inventario (hub) | `/admin/inventario` | Sí (ítem principal) | Sí |
| Productos | `/admin/inventario/productos` | No (solo dashboard) | Sí (sub-ítem) |
| Movimientos | `/admin/inventario/movimientos` | No | Sí (sub-ítem) |
| Proveedores | `/admin/inventario/proveedores` | Sí (026) | Sí (sub-ítem) |
| Órdenes de compra | `/admin/inventario/ordenes` | No | Sí (sub-ítem) |
| Alertas | `/admin/inventario/alertas` | No | Sí (sub-ítem) |
| Reportes | `/admin/inventario/reportes` | No | Sí (sub-ítem) |

---

## Fuera de alcance

- Nuevos `StaffModule` separados (todo bajo `inventario`)
- Cambios RTDB / Functions
- Refactor de componentes inventario (solo navegación)
- Menú para módulos fuera de inventario (finanzas, etc. ya visibles)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ninguno. Solo HTML/CSS de sidenav y enlaces legacy.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | — | — | — | Sin cambios |

- **Estrategia de Datos de Prueba:** mocks existentes en `mock-data.ts`; Cypress con credenciales admin locales. Prohibido producción para desarrollo.

- **Patrones UI Reutilizados:** `admin-nav-subitem` (026), `AdminMainLayoutComponent`, iconos Material en sidenav.

---

## Roles

| Rol staff | ¿Accede sub-ítems inventario? |
|-----------|------------------------------|
| Todo staff operativo (política 011) | Sí (`staffModule: inventario`) |
| Portal client | No |

---

## Success criteria (resumen)

SC-001…SC-008 arriba.
