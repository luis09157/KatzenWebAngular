# Tasks: Automatización costos / ops financieras + pensión

**Spec:** `specs/022-automatizacion-costos-dashboard/spec.md`  
**Plan:** `specs/022-automatizacion-costos-dashboard/plan.md`  

---

## Implementación

### Setup / documentación (Parte 1)

- [x] Carpeta `specs/022-automatizacion-costos-dashboard/`
- [x] Spec ampliada: valuación inventario, baños, clínicas, pensión, extensibilidad, CRUD mapa, ejemplos, fases A–D
- [x] Plan técnico + Contratos + Mitigación/Rollback
- [x] Cross-refs: 021, ROADMAP, README, domain-context
- [x] Commit + push docs (`3a093f1`)

### Fase A — código (Parte 2)

#### A1 Valuación inventario KPIs

- [x] Extender `EstadisticasInventario` (invertido, valor venta, margen potencial)
- [x] `getEstadisticas` calcula las 3 métricas
- [x] Dashboard inventario: KPI cards con labels claros + hints
- [x] SC-INV-001…004

#### A2 Defaults baño + enlace caja

- [x] Modelo + servicio `DefaultsBanioPorTamano`
- [x] UI panel 3 tamaños en finanzas (tab Costos)
- [x] Campos aditivos `Banio` + diálogo (tamaño, costo, precio, override)
- [x] `registrarEnCaja` prellena `costoAsociado` / plantilla / monto
- [x] Mocks (`MOCK_DEFAULTS_BANIO_TAMANO`)
- [x] Card «Finanzas» en `/admin/inicio` + breadcrumb label
- [x] SC-005…010

#### A3 Venta → caja

- [x] Checkbox en salida `venta_directa` → diálogo caja
- [x] Links cruzados (`movimientoInventarioIds` / `cajaMovimientoId`)
- [x] SC-001…004

### Fase B — historial + pensión refinamiento

- [x] Scaffold módulo pensión MVP (lista/alta/caja, StaffModule, menú, rules, Cypress) — B1
- [x] Consumo inventario desde historial (cirugía/consulta) + lista consumos en detalle
- [x] Cobro caja desde historial con `costoAsociado` sugerido
- [x] Vacunas: acción «Consumir inventario» (producto/dosis vía inventario)
- [x] SC-014: producto controlado/receta exige historial
- [x] Defaults pensión por tamaño (panel Finanzas + prefill diálogo)
- [x] Opt-in comida inventario al cobrar pensión
- [x] SC-011…020

### Fase C — gráficas

- [x] Gráficas CSS en tab Rentabilidad (ingresos/egresos/ganancia + desglose + serie día a día)
- [x] Filtros día / semana / mes
- [x] SC-021…023

### Fase D — egresos tipificados

- [x] Categorías egreso: publicidad, proveedores, gasolina, operativo, otro
- [x] Sin módulo `/admin/gastos`
- [x] SC-024…025

### Fase E — OC → egreso opt-in

- [x] Checkbox «Registrar egreso en caja» en recibir OC
- [x] Prefill egreso `proveedores` + monto Σ recibido
- [x] Campo aditivo `cajaMovimientoId` + `pagada` al vincular
- [x] Prefill `tipo: egreso` en CajaMovimientoDialog
- [x] Contratos + mitigación en plan.md

### Pulido pensión (mismo hub 022)

- [x] Check-in (reservada→activa) / check-out (activa→finalizada + fecha_salida_real)
- [x] KPI ocupación = activas; chips estado con variantes CSS
- [x] Días visibles; caja solo si no hay `cajaMovimientoId`
- [x] Enlace caja existente preservado (+ opt-in comida)

---

## Testing

> **Quién ejecuta:** el agente. Guía: `specs/templates/qa-validation-guide.md`

### Checklist pre-entrega Fases B–D

- [x] Guía QA (historial consumo, pension defaults/comida, gráficas, egresos)
- [x] `npm run build` OK — exit 0 (2026-08-26)
- [x] Live preview `:4200` vivo
- [x] Cypress smoke relevantes (finanzas, modules, routes, banios, historiales vía modules)
- [x] Design system: KPI grid, admin-dialog-shell, loading contextual, «Borrar»
- [x] Tabla resultados rellenada **antes** de marcar `[x]`

### Checklist Fase E + pulido pensión

- [x] Guía QA recepción OC + opt-in egreso + check-in/out
- [x] `npm run build` OK — exit 0 (2026-08-26 ciclo E+)
- [x] Live preview `:4200` vivo
- [x] Registrar resultados abajo

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Docs 022 + cross-refs | OK | |
| KPIs invent. / baños / venta→caja (A) | OK | Previos |
| Consumir inventario desde historial | OK | SalidaDialog + historialId |
| Lista consumos en detalle | OK | Σ costo sugerido |
| Cobro caja desde historial | OK | costoAsociado + links |
| Vacuna → consumir inventario | OK | Acción fila |
| Defaults pensión P/M/G | OK | Panel Finanzas |
| Prefill pensión por tamaño | OK | Dialog |
| Opt-in comida al cobrar | OK | Confirm + salida |
| Gráficas Rentabilidad + semana | OK | CSS bars, sin lib |
| Egresos proveedores/gasolina | OK | CAJA_CATEGORIAS_EGRESO |
| Build | OK | exit 0 (ciclo E+) |
| :4200 smoke | OK | ng serve vivo |
| Cypress admin | OK | suite previa |
| Resend | N/A | secret 404; diferido |
| OC→egreso opt-in (E) | OK | checkbox + egreso proveedores |
| Pensión check-in/out + ocupación | OK | chips + KPI ocupación |
| functions:build (023) | OK | onRecordatorioWritePush |
| cy:portal | OK | guest 3/3; auth skip sin env |

---

## Criterios spec

- [x] SC-INV-* (Fase A)
- [x] SC-005…010 (Fase A baños/finanzas)
- [x] SC-001…004 (A3 venta→caja)
- [x] SC-011…020 (Fase B)
- [x] SC-021…023 (Fase C)
- [x] SC-024…025 (Fase D)

---

## Cierre

- [x] Validación pre-entrega A–D
- [x] Commit + push código B–D (`47644c7`, `259cada`)
- [x] Deploy hosting + database (2026-08-26) — índice `historial_clinico_id` + UI
- [x] `spec.md` → `done`
- [x] Resend: no tocar (diferido)
- [ ] Fase E (OC→egreso) queda pendiente opcional

---

## Nota UX baños (2026-08-26)

Modal **Nuevo baño**: secciones «Tamaño y costo» + «Precios» fusionadas en un solo bloque **Costos y precio**. `precio_base` sigue en RTDB (sync interno desde precio al cliente − adicionales); ya no se muestra en UI. Costo 0 = opcional (`treatZeroAsEmpty`).

**Validación 2026-08-26:** `npm run build` exit 0 · commit `3a7a41f` · push + deploy hosting OK · `:4200` vivo.
