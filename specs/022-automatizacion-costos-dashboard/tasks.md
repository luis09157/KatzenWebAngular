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

### Fase B — diseño ready; código después de A

- [x] Scaffold módulo pensión MVP (lista/alta/caja, StaffModule, menú, rules, Cypress) — **B1 incluido en esta entrega**
- [ ] Consumo inventario desde historial (cirugía/vacuna)
- [ ] Defaults pensión por tamaño (panel config)
- [ ] Opt-in comida inventario
- [ ] SC-011…014 (historial); SC-015…020 (pensión refinamiento)

### Fase C / D / E

- [ ] C: gráficas Rentabilidad
- [ ] D: egresos tipificados
- [ ] E: OC → egreso opt-in

---

## Testing

> **Quién ejecuta:** el agente. Guía: `specs/templates/qa-validation-guide.md`

### Checklist pre-entrega Fase A

- [x] Guía QA (formularios defaults, diálogo baño, KPIs)
- [x] `npm run build` OK — exit 0 (2026-08-26)
- [x] Live preview `:4200` vivo
- [x] Cypress smoke: admin-smoke + modules-authenticated + admin-crud-finanzas — **20/20 PASS**
- [x] Design system: KPI grid, admin-dialog-shell, loading contextual
- [x] Tabla resultados rellenada **antes** de marcar `[x]`

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Docs 022 ampliada + cross-refs | OK | Commit docs `3a093f1` |
| KPIs invertido / venta / margen | OK | Dashboard inventario |
| Defaults baño P/M/G guardan | OK | Panel en Finanzas → Costos |
| Alta baño tamaño + override precio | OK | Campos aditivos Banio |
| Baño→caja con costoAsociado | OK | `registrarEnCaja` prefill |
| Card Finanzas inicio | OK | `dashboard.component` |
| Venta→caja | OK | Checkbox salida `venta_directa` |
| Build | OK | exit 0 |
| :4200 smoke | OK | ng serve vivo |
| Cypress | OK | 20/20 (smoke + modules + finanzas) |

---

## Criterios spec

- [x] SC-INV-* (Fase A)
- [x] SC-005…010 (Fase A baños/finanzas)
- [x] SC-001…004 (A3 venta→caja)
- [ ] SC-011…025 documentados; código B/C/D

---

## Cierre

- [x] Validación pre-entrega Fase A completa
- [ ] Commit + push código A
- [ ] Deploy hosting (con OK Luis en este pedido)
- [ ] `spec.md` permanece `in-progress` hasta B–D o cierre explícito A-only
- [x] Resend: no tocar (diferido)
