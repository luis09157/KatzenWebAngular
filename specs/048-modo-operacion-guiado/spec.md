# Spec: Modo operación guiado (hints + POS inventario)

**ID:** 048-modo-operacion-guiado  
**Estado:** in_progress  
**Fecha:** 2026-08-28  
**Autor:** Luis Alfonso Niño Martínez + agente  
**Relaciona:** 046 (UX guiada), 045 (cuenta del día / POS), 044 (producto picker)

---

## Problema

Tras la ola 046, solo **visita-dialog** y **banio-dialog** tenían guías contextuales. El staff sigue sin orientación al registrar **clientes, pacientes, citas** y otros flujos clínicos. En **Cuenta del día (POS)** no queda claro que vender un producto **descuenta inventario** al guardar o cobrar.

---

## User stories

### US-1 — Guías paso a paso en CRUD clínico

Como **recepcionista o doctor**  
Quiero **ver qué hacer antes en cada diálogo** (dueño → mascota → datos)  
Para **no adivinar el orden ni dejar campos críticos vacíos**

**Criterios de aceptación:**

- [ ] SC-001: Componente reutilizable `app-flow-hint` con variantes info/warn/success
- [ ] SC-002: Hints contextuales en `cliente-dialog`, `paciente-dialog`, `cita-dialog`
- [ ] SC-003: Hints en `vacuna-dialog`, `historial-dialog`, `recordatorio-dialog` (dueño/mascota primero)
- [ ] SC-004: `banio-dialog` y `visita-dialog` migrados al componente (sin CSS duplicado)

### US-2 — POS intuitivo con impacto en inventario

Como **cajero / recepción**  
Quiero **saber que los productos del ticket descontarán stock**  
Para **evitar sorpresas en inventario y explicarlo al equipo**

**Criterios de aceptación:**

- [ ] SC-005: Hint visible al agregar productos al ticket (guardar/cobrar → salida inventario)
- [ ] SC-006: Badge «Descuenta inventario» en líneas `venta_producto`
- [ ] SC-007: Copy reforzado en walk-in / venta de mostrador

### US-3 — Quick wins empty states

Como **staff**  
Quiero **empty states útiles en pensión y consentimientos**  
Para **saber qué hacer cuando no hay registros**

**Criterios de aceptación:**

- [ ] SC-008: `app-admin-empty-state` en pensión y consentimientos cuando la lista está vacía

---

## Fuera de alcance

- Rediseño completo del hub operativo / dashboard (movido a spec 049)
- Toolbar admin con nombre de módulo (spec 049)
- Cambios RTDB o Cloud Functions

### Ola 2 (listas admin)

- [ ] SC-009: Hints en citas, baños, finanzas, movimientos (listas)
- [ ] SC-010: KPIs baños — hints humanizados por tamaño
- [ ] SC-011: Trazabilidad inventario↔ticket (visita-dialog origen, movimientos link)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ninguno. Solo UI/copy. Sin lectura/escritura adicional.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | — | — | — | Sin cambios |

- **Estrategia de Datos de Prueba:** mocks locales (`src/app/core/testing/mock-data.ts`) y localhost. Prohibido RTDB producción.

- **Patrones UI Reutilizados:** `app-flow-hint`, `admin-dialog-shell`, `app-cliente-paciente-picker`, `app-admin-empty-state`, `.estado-badge` — ver `docs/ADMIN-UI-ARCHITECTURE.md` y spec 046.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí |
| doctor | sí |
| recepcionista | sí |

---

## UI (rutas y layout)

- Diálogos admin existentes (clientes, pacientes, citas, vacunas, historiales, recordatorios, visitas, baños)
- Lista POS: `/admin/visitas` (Cuenta del día)
- Empty states: `/admin/pension`, `/admin/consentimientos`

---

## Backend

- Cloud Function: no
- Reglas RTDB: no

---

## Testing mínimo

Ver `tasks.md` — build, lints, smoke :4200, registro QA.

---

## Notas / decisiones

- Salida de inventario en POS: `InventarioService.registrarSalida` al persistir ticket (`visita-dialog` → `asegurarSalidasProducto`), categoría `venta_producto`.
- Copy alineado a flujo real del código, no inventado.
