# Tasks: Métricas + Dashboard dueño

**Spec:** `specs/025-metricas-servicios-dashboard/spec.md`  
**Plan:** `specs/025-metricas-servicios-dashboard/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada
- [x] Plan contratos + rollback

### Frontend

- [x] `periodo-filtro.util.ts`
- [x] `OwnerDashboardService` + modelos
- [x] Dashboard `/admin/inicio` potenciado
- [x] Fix `admin-stat-card` money display
- [x] KPIs baños / citas / vacunas / clientes / pensión
- [x] KPIs productos / proveedores / OC / movimientos
- [x] ADMIN-UI + ROADMAP + mocks

### Integración

- [x] Menú ya apunta a Dashboard → `/admin/inicio`
- [x] Convive con datos legacy (lectura)

---

## Testing

- [x] `npm run build` — exit 0 (warning presupuesto bundle 2.07 MB)
- [x] Servidor local `:4200` vivo
- [x] Cypress admin-smoke + admin-modules-authenticated — 20/20 PASS

**Resultado:** OK

---

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA aplicada (KPI UI, empty states, loading, chips en módulos tocados)
- [x] `npm run build` OK
- [x] Live preview :4200
- [x] Tabla resultados
- [x] Chips/badges no clip (sin cambios CSS chips)

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Dashboard filtros período | OK | código + build |
| KPIs financieros + operativos | OK | OwnerDashboardService |
| Empty states tops/chart | OK | templates con empty-state |
| Baños KPIs período | OK | mes / 30d |
| Productos KPI grid | OK | |
| Pensión 4 KPIs + buscador panel-search | OK | ya tenía panel-search |
| UI chips estado | OK | sin regresión |
| Build | OK | exit 0; budget warn |
| Smoke :4200 | OK | ng serve LISTEN |
| Cypress admin | OK | 20 passing |
| Follow-up: sin launcher cards | OK | HTML/TS/CSS limpios; métricas + calendario; build Hash 6c7891a841d7901e |

```
npm run build → exit 0 (Hash 17718f51592652b2)
Cypress: admin-smoke 4 + modules 16 = 20 PASS
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 … SC-018

---

## Cierre

- [x] Validación pre-entrega completa
- [x] `spec.md` → done
- [x] Commit + push + deploy hosting (autorizado Luis) — `e4afcd2` hosting OK
- [x] Follow-up 2026-08-26: quitado launcher/cards de módulos en `/admin/inicio` (menú lateral basta; métricas + calendario)
- [x] Follow-up 2026-08-26: fix KPIs baños/dashboard — baños sin caja suman `precio_total` a ingresos brutos; labels Ingresos vs Ganancia; costo=venta → margen 0 pero ingreso/conteo sí suben · commit `0dc5543` · hosting deploy OK

### Registro QA fix ingresos baños (2026-08-26)

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| precio 200, costo 200 | OK | ingreso bruto +200, ganancia +0 |
| Baño sin `cajaMovimientoId` | OK | refuerzo en OwnerDashboardService |
| Baño con `cajaMovimientoId` | OK | solo caja (sin doble conteo) |
| Labels UI | OK | Ingresos brutos ≠ Ganancia neta |
| Build | OK | `npm run build` exit 0 · Hash ca9db923e33fda82 |
| Simulación 200/200 | OK | ingreso 200, ganancia 0 |
| Live :4200 | OK | `ng serve` compiled successfully (banios chunk) |
