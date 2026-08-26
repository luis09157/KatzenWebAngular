# Spec: Métricas por módulo + Dashboard dueño

**ID:** 025-metricas-servicios-dashboard  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** Agent (pedido Luis Alfonso Niño Martínez)  
**Extiende:** 014, 018, 021, 022  
**Dominio:** KPIs operativos/económicos, hub `/admin/inicio`

---

## Problema

1. Módulos admin tenían KPIs genéricos (totales históricos) o ninguno (productos/OC/movimientos). La dueña no veía **baños del mes**, ingresos ni alertas útiles.
2. `/admin/inicio` era solo saludo + cards de módulos + calendario — **no** un tablero de negocio.
3. Finanzas tiene P&L, pero no hay un **dashboard central** con filtros Este mes / 30d / 60d.

Luis pide: **KPIs defaults en todo módulo operativo** + **Dashboard dueño** (referencia Niño Maker, UI KatzenVet teal).

---

## Principios

| Principio | Decisión |
|-----------|----------|
| KPIs v1 | Defaults sensatos refinables; 3–4 por módulo |
| Fuente | Datos del módulo (baño `precio_total`/`pagado`; caja como refuerzo) |
| RTDB | Solo lectura agregada client-side; **sin** nodos destructivos |
| Dashboard | Potenciar `/admin/inicio` (menú ya dice «Dashboard») |
| Charts | CSS/SVG como finanzas 022 — **sin** Chart.js obligatorio |
| Branding | Design system Katzen (teal); **no** púrpura Niño Maker |

---

## User stories

### US-1 — KPIs defaults por módulo

Como **dueña / doctora**  
Quiero ver métricas al abrir cada módulo  
Para enterarme del estado sin Excel.

**Criterios:**

- [x] SC-001: Todo CRUD admin listado tiene `app-admin-kpi-grid` con ≥3 cards
- [x] SC-002: Baños: período (mes/30d), count, ingresos cobrados, valor estimado, completados/cancelados
- [x] SC-003: Citas: citas hoy + pendientes/confirmadas/completadas
- [x] SC-004: Vacunas: del mes + pendientes/aplicadas/pacientes
- [x] SC-005: Clientes: total, con pacientes, nuevos mes, sin correo
- [x] SC-006: Productos/proveedores/OC/movimientos: KPIs stock/montos/conteos
- [x] SC-007: Pensión: ocupación, reservadas, valor, finalizadas
- [x] SC-008: Inventario dashboard / finanzas / usuarios / recordatorios / historiales ya tenían KPIs — se mantienen o alinean hints
- [x] SC-009: Documentado en ADMIN-UI: «todo módulo operativo lleva KPIs»

### US-2 — Dashboard dueño

Como **dueña**  
Quiero un tablero en `/admin/inicio` con período, finanzas, operación, tops y serie diaria  
Para ver cómo va el negocio.

**Criterios:**

- [x] SC-010: Filtros: Este mes / Mes anterior / 30d / 60d + Desde/Hasta + Aplicar
- [x] SC-011: 4 KPIs financieros: ingresos, costos, gastos, ganancia neta (desde caja)
- [x] SC-012: 4 KPIs operativos: citas hoy, baños período, stock bajo, clientes nuevos
- [x] SC-013: Resumen financiero + placeholder «Meta de inversión» (próximamente)
- [x] SC-014: Top servicios (categoría caja) + top productos (`venta_producto`)
- [x] SC-015: Gráfica/serie ingresos por día (SVG/CSS)
- [x] SC-016: Empty states claros si no hay datos
- [x] SC-017: Mocks en `mock-data.ts` para preview local
- [x] SC-018: Calendario + módulos de acceso rápido se conservan debajo

---

## Fuera de alcance

- Meta de inversión configurable (solo placeholder)
- Chart.js / librerías nuevas
- Resend / FCM / CFDI
- Escritura RTDB nueva para métricas
- Portal dueños (baños read-only = siguiente)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto RTDB:** solo lectura de nodos existentes (`Caja/Movimientos`, `Banios`, `Citas`, `Cliente`, `Inventario/Productos`, `Pension/Estancias`). Sin campos nuevos obligatorios.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Caja/Movimientos` | staff | — | agregados período |
  | `Katzen/Banios` | staff | — | KPIs + refuerzo top |
  | `Katzen/Citas` | staff | — | citas hoy / período |
  | `Katzen/Cliente` | staff | — | nuevos mes |
  | `Katzen/Inventario/Productos` | staff | — | stock bajo |
  | `Katzen/Pension/Estancias` | staff | — | ocupación |

- **App móvil:** no afectada (solo admin web).
- **Pruebas:** mocks locales; Cypress smoke admin; **nunca** prod writes.
- **UI:** `app-admin-kpi-grid`, `app-admin-stat-card`, `app-admin-data-panel`, tokens Katzen.

---

## Roles

Staff con acceso a `inicio` (política 011).

---

## UI (rutas)

| Ruta | Cambio |
|------|--------|
| `/admin/inicio` | Dashboard dueño + hero módulos + calendario |
| `/admin/banios` … módulos listados | KPI grids enriquecidos |

---

## Notas

- KPIs son **v1 defaults refinables**.
- Ingresos baños: `pagado \|\| cajaMovimientoId` + `precio_total`; valor estimado incluye no cancelados aunque no pagados.
- Cirugías/hospitalización: **no hay módulo** — n/a.
