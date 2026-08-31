# Spec: Servicios de clínica

**ID:** 056-servicios-clinica  
**Estado:** in_progress  
**Fecha:** 2026-08-30  
**Autor:** Luis Alfonso Niño Martínez + agente  
**Relaciona:** 022 tarifas baño, 032 ticket, 055 POS (riel Consulta)

---

## Problema

El POS cobra consulta, ultrasonido, domicilio y honorarios, pero esos **no son stock de anaquel**. Hoy o se piden a mano o se disfrazan como producto de inventario. Recepción necesita un **catálogo de servicios con precio** (Administración), distinto de Inventario y distinto de las tarifas de baño (Finanzas 022).

---

## Olas

| Ola | Entrega | Qué |
|-----|---------|-----|
| **1** | Esta spec | CRUD admin + nodo RTDB aditivo + POS riel Consulta lista servicios + vacuna/medicamento de inventario. Baño **no** migra. Sin PAC, sin WhatsApp, **sin deploy** en esta frase. |
| **2** | Después | Bundles, domicilio en agenda, honorarios por veterinario, PAC. |

---

## User stories

### US-1 — Alta de servicios con precio

Como **administrador**  
Quiero **dar de alta servicios de clínica con nombre, tipo y precio**  
Para **que la caja no pida monto si el servicio ya tiene tarifa**

**Criterios de aceptación:**

- [x] SC-001: Ruta `/admin/servicios-clinica` con `admin-page` + KPI + banner + `admin-data-panel`.
- [x] SC-002: Alta/edición en `admin-dialog-shell` (sin `mat-dialog-title`): nombre, tipo (`consulta` \| `diagnostico` \| `domicilio` \| `otro`), `precio_venta`, notas, activo.
- [x] SC-003: Baja lógica (`activo: false`) con copy **«Borrar»**. No se borra el nodo.
- [x] SC-004: Hint: estos ítems **no** son stock; baño sigue en Finanzas 022 + enlace «Tarifas de baño en Finanzas».

### US-2 — Caja usa el catálogo

Como **recepcionista en el POS**  
Quiero **ver los servicios de clínica en el riel Consulta**  
Para **agregarlos al ticket sin escribir el precio si ya existe**

**Criterios de aceptación:**

- [x] SC-005: Riel Consulta lista servicios activos del catálogo **más** productos inventario vacuna/medicamento.
- [x] SC-006: Si `precio_venta > 0`, tap agrega línea **sin** prompt de monto. Si no hay precio, pide monto (fallback).
- [x] SC-007: Tipo `domicilio` se lista como servicio de clínica (no como producto).
- [x] SC-008: Baño **no** se migra a `ServiciosClinica`. Riel Peluquería sigue 022 + editable; copy/link a Finanzas.

---

## Fuera de alcance

- PAC / CFDI / WhatsApp
- Migrar baño / `ProductosPeluqueria` / plantillas 022 a este nodo
- Mutar `Katzen/Inventario/Productos`, `Katzen/Cliente`, `Katzen/Mascota`
- Cloud Functions (staff escribe el catálogo como Finanzas)
- Deploy hosting/database/functions de esta ola (Luis no autorizó deploy del módulo nuevo)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** nodo **nuevo y aditivo** `Katzen/ServiciosClinica/{id}`. No se tocan nodos de inventario, clientes, pacientes ni baños. La app móvil no lee este nodo hoy.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/ServiciosClinica/{id}` | staff (`role != client`) | staff | campos: nombre, tipo, precio_venta, activo, notas?, sucursalId?, timestamps |
  | `Katzen/Visitas/{id}.lineas[].servicioClinicaId?` | staff / portal según 032 | staff | aditivo opcional; móvil ignora |

- **Estrategia de Datos de Prueba:** mocks en `src/app/core/testing/mock-data.ts`. Tests unitarios del modelo. Prohibido mutar Productos/Clientes/Pacientes en RTDB prod. Persistencia real del catálogo requiere reglas desplegadas (esta ola **no** hace `firebase deploy --only database`).

- **Patrones UI Reutilizados:** `admin-page`, `app-admin-kpi-grid`, `app-admin-page-banner`, `app-admin-data-panel`, `admin-dialog-shell`, `app-flow-hint`, `LoadingService`, `ErrorMessagesService`, SweetAlert «Borrar». Referencia: `src/app/pension/`, `docs/ADMIN-UI-ARCHITECTURE.md`.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador / doctor | sí (menú Administración + URL) |
| recepcionista / peluquero | sí por URL (011); **no** en menú compacto 054 |

---

## UI (rutas y layout)

- Ruta admin: `/admin/servicios-clinica`
- Menú: **Administración → Servicios de clínica**
- POS: riel Consulta (mismo diálogo 055)
- KPIs: activos, consultas, diagnósticos, domicilios

---

## Backend

- [ ] Cloud Function: no
- [x] Reglas RTDB: sí (archivo; **deploy database pendiente** de autorización)
- [ ] Email / integración externa: no

---

## Testing mínimo

Ver `tasks.md` sección Testing.

---

## Notas / decisiones

- Honorarios = tipo `otro`.
- Ultrasonido = tipo `diagnostico`.
- Consulta genérica del POS: si hay servicio tipo `consulta` con precio, se usa el catálogo; si no, fallback inventario 055; si no, prompt.
