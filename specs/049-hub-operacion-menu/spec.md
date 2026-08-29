# Spec: Hub operación y menú 3 mundos

**ID:** 049-hub-operacion-menu  
**Estado:** in_progress  
**Fecha:** 2026-08-28  
**Autor:** Luis Alfonso Niño Martínez + agente  
**Relaciona:** 048 (hints), 045/046 (POS), 025 (dashboard dueño)

---

## Problema

El panel admin tiene un menú plano de ~20 ítems sin jerarquía operativa. Recepción no distingue flujo clínico vs mostrador vs administración. El dashboard `/admin/inicio` prioriza métricas dueño sin un hub de recepción visible.

---

## User stories

### US-1 — Hub recepción en inicio

Como **recepcionista**  
Quiero **ver arriba Clínica | Mostrador | Inventario/Admin y pendientes por cobrar**  
Para **saber por dónde empezar el día**

**Criterios de aceptación:**

- [ ] SC-001: Tres tiles grandes en `/admin/inicio` (Clínica, Mostrador POS, Inventario/Admin)
- [ ] SC-002: Widget embebido «Por cobrar hoy» reutilizando `buildPorCobrarHoy`
- [ ] SC-003: CTAs: Ticket del día, Venta mostrador, Buscar paciente, Citas hoy
- [ ] SC-004: Dashboard dueño (owner-dash) permanece debajo, sin destruir métricas

### US-2 — Menú sidenav agrupado

Como **staff**  
Quiero **menú en 3 grupos: Atención clínica, Punto de venta, Administración**  
Para **navegar sin perderme**

**Criterios de aceptación:**

- [ ] SC-005: Separadores `mat-divider` + labels entre grupos
- [ ] SC-006: «Cuenta del día» renombrada a «Ticket del día» en sidebar
- [ ] SC-007: Inventario: ítem hub + subítems indentados bajo Administración

### US-3 — Toolbar contextual

Como **usuario admin**  
Quiero **ver el nombre del módulo actual en la barra superior**  
Para **saber dónde estoy**

**Criterios de aceptación:**

- [ ] SC-008: Toolbar muestra label del módulo (mapa ruta→label), no solo «Admin»

---

## Fuera de alcance

- Cambios RTDB
- Permisos granulares nuevos por rol

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ninguno. Solo UI/routing labels.

- **Estrategia de Datos de Prueba:** mocks + localhost.

- **Patrones UI:** `app-admin-module-card`, `app-admin-kpi-grid`, `app-admin-data-panel`, `buildPorCobrarHoy`.

---

## UI (rutas y layout)

- Hub: `/admin/inicio` (dashboard.component)
- Menú: `admin-main-layout.component.html`
- Toolbar: `admin-main-layout.component.ts` + `admin-route-labels.config.ts`

---

## Backend

- Cloud Function: no
- Reglas RTDB: no

---

## Testing mínimo

Ver `tasks.md` — build, tests 039/040/046, smoke :4200.
