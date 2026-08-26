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
- [ ] Commit + push docs

### Fase A — código (Parte 2)

#### A1 Valuación inventario KPIs

- [ ] Extender `EstadisticasInventario` (invertido, valor venta, margen potencial)
- [ ] `getEstadisticas` calcula las 3 métricas
- [ ] Dashboard inventario: KPI cards con labels claros + hints
- [ ] SC-INV-001…004

#### A2 Defaults baño + enlace caja

- [ ] Modelo + servicio `DefaultsBanioPorTamano`
- [ ] UI panel 3 tamaños en finanzas
- [ ] Campos aditivos `Banio` + diálogo (tamaño, costo, precio, override)
- [ ] `registrarEnCaja` prellena `costoAsociado` / plantilla / monto
- [ ] Mocks
- [ ] Card «Finanzas» en `/admin/inicio`
- [ ] SC-005…010

#### A3 Venta → caja (si cabe)

- [ ] Checkbox en salida `venta_directa` → diálogo caja
- [ ] Links cruzados opcionales
- [ ] SC-001…004 (parcial OK si queda pendiente documentado)

### Fase B — diseño ready; código después de A

- [ ] Consumo inventario desde historial (cirugía/vacuna)
- [ ] Módulo pensión MVP (StaffModule, lista, alta, caja)
- [ ] Rules `Katzen/Pension`
- [ ] Defaults pensión por tamaño
- [ ] SC-011…020

### Fase C / D / E

- [ ] C: gráficas Rentabilidad
- [ ] D: egresos tipificados
- [ ] E: OC → egreso opt-in

---

## Testing

> **Quién ejecuta:** el agente. Guía: `specs/templates/qa-validation-guide.md`

### Checklist pre-entrega Fase A

- [ ] Guía QA (formularios defaults, diálogo baño, KPIs)
- [ ] `npm run build` OK — reportar exit code
- [ ] Live preview `:4200` + smoke inventario/baños/finanzas
- [ ] Cypress smoke admin (módulos tocados)
- [ ] Design system: chips, loading, diálogos shell
- [ ] Tabla resultados rellenada **antes** de marcar `[x]`

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Docs 022 ampliada + cross-refs | PENDIENTE | Parte 1 |
| KPIs invertido / venta / margen | PENDIENTE | A1 |
| Defaults baño P/M/G guardan | PENDIENTE | A2 |
| Alta baño tamaño + override precio | PENDIENTE | A2 |
| Baño→caja con costoAsociado | PENDIENTE | A2 |
| Card Finanzas inicio | PENDIENTE | A2 |
| Venta→caja | PENDIENTE | A3 |
| Build | PENDIENTE | |
| :4200 smoke | PENDIENTE | |
| Cypress | PENDIENTE | |

---

## Criterios spec

- [ ] SC-INV-* (Fase A)
- [ ] SC-005…010 (Fase A baños/finanzas)
- [ ] SC-001…004 (A3 o defer documentado)
- [ ] SC-011…025 documentados; código B/C/D

---

## Cierre

- [ ] Validación pre-entrega Fase A completa
- [ ] Commit + push código A
- [ ] Deploy hosting/database **solo con OK Luis**
- [ ] `spec.md` → `done` solo cuando A+QA cerrados (o marcar fase A done en tasks)
- [ ] Resend: no tocar (diferido)
