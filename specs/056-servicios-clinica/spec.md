# Spec: Servicios de clínica

**ID:** 056-servicios-clinica  
**Estado:** in_progress  
**Fecha:** 2026-08-30 · **Actualizado:** 2026-08-31 (costo + IVA + ganancia)  
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
- [x] SC-002: Alta/edición en `admin-dialog-shell` (sin `mat-dialog-title`): nombre, tipo (`consulta` \| `diagnostico` \| `domicilio` \| `otro`), `precio_costo`, `precio_venta`, `aplicaIva` / `tasaIva`, notas, activo. Preview de ganancia (venta neta − costo).
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

### US-3 — Costo, IVA y ganancia (ola costo)

Como **dueña / administradora**  
Quiero **capturar lo que me cuesta cada servicio o producto y si aplica IVA**  
Para **ver la ganancia real** (después de IVA) sin pedirle el costo al cajero

**Criterios de aceptación:**

- [x] SC-009: Diálogo servicio: Costo* («Lo que te cuesta a ti»), Precio de venta* («Lo que cobra el cliente»), checkbox Aplicar IVA (default 16% MX), lectura de ganancia neta.
- [x] SC-010: Al vender, la línea de ticket persiste opcionales `costo`, `precio_venta`, `iva`, `ganancia` (snapshot del catálogo). El cajero **no** captura costo.
- [x] SC-011: Productos inventario: mismo modelo IVA (precio al público incluye IVA). UI muestra ganancia neta. No se reescribe valuación stock 022.
- [x] SC-012: Baño 022: se muestra ganancia (venta − costo) en el diálogo; **sin** reescribir plantillas/defaults.

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
  | `Katzen/ServiciosClinica/{id}` | staff (`role != client`) | staff | nombre, tipo, `precio_venta`, `precio_costo?`, `aplicaIva?`, `tasaIva?`, activo, notas?, sucursalId?, timestamps |
  | `Katzen/Visitas/{id}.lineas[]` | staff / portal según 032 | staff | aditivos: `servicioClinicaId?`, `costo?`, `precio_venta?`, `iva?`, `ganancia?`, `aplicaIva?`, `tasaIva?` — móvil ignora |

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

### Modelo IVA (único — 2026-08-31)

**Precio al público incluye IVA** (B2C México). El costo es neto. No es CFDI/PAC.

| Concepto | Fórmula |
|----------|---------|
| `ventaPublica` | `precio_venta` (lo que paga el cliente) |
| `ventaNeta` | si `aplicaIva`: `ventaPublica / (1 + tasa/100)`; si no: `ventaPublica` |
| `ivaTrasladado` | `ventaPublica − ventaNeta` |
| `ganancia` | `ventaNeta − costo` (= venta − costo − IVA) |

- Default tasa **16%**. Checkbox «Aplicar IVA». `tasaIva` opcional (catálogo).
- Productos: mismos campos existentes (`precio_compra`, `precio_venta`, `iva_aplicable`, `tasa_iva`). Preview deja de **sumar** IVA encima del precio; desglosa el IVA ya incluido. El cobro POS/caja usa `precio_venta` (no `precio × 1.16`).
- Valuación stock 022 (`invertido_costo` / `valor_precio_venta`) **no cambia**.
- Baño 022: ganancia bruta `precio_total − costoEstimado`; sin checkbox IVA en esta ola.
