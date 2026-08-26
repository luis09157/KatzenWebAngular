# Tasks: Automatización costos + dashboard gráficas

**Spec:** `specs/022-automatizacion-costos-dashboard/spec.md`  
**Plan:** `specs/022-automatizacion-costos-dashboard/plan.md`  
**Estado carpeta:** draft — **no implementar features grandes hasta aprobación Luis**

---

## Setup / documentación

- [x] Carpeta `specs/022-automatizacion-costos-dashboard/` creada
- [x] `spec.md` + `plan.md` + `tasks.md` en draft (wire inv↔caja, gastos, gráficas, CRUDs honestos, ejemplos; baños por tamaño como subtarea A; **sin** módulo pensión)
- [ ] Confirmación de alcance con Luis (principios UX + fases + categorías egreso + defaults baño)
- [ ] Tras aprobación: plan → approved; actualizar ROADMAP / README / domain-context si hace falta

---

## Fase A — Wire baño / salida inventario → caja (+ defaults tamaño)

> Objetivo: venta producto y baño descuentan stock / llevan costo a caja; defaults por tamaño sin módulo nuevo.

- [ ] Extender modelos caja/inventario/baños (links + campos opcionales tamaño/costo)
- [ ] Mini config `DefaultsBanioPorTamano` (3 filas) en hub finanzas
- [ ] Diálogo baño: tamaño → prefill costo/precio sugerido; `precio_total` siempre override por registro
- [ ] Baño→caja arrastra `costoAsociado` / plantilla / monto
- [ ] Salida `venta_directa` → opción registrar ingreso `venta_producto`
- [ ] Checkbox descontar ítems plantilla al cobrar baño
- [ ] Card «Finanzas» en dashboard inicio (SC-020)
- [ ] Mocks + errores stock / anti-doble
- [ ] Cypress smoke (o extensión finanzas/baños)
- [ ] QA Fase A + `npm run build` + registro abajo

**SC:** 001–007b, 020

---

## Fase B — Kit cirugía / consumo historial

- [ ] Acción «Consumir inventario» desde historial (reusa salida + `historial_clinico_id`)
- [ ] Listar consumos del historial → sugerir `costoAsociado` al cobrar
- [ ] Gate productos controlados → exigir historial
- [ ] Plantilla cirugía + opt-in descuento stock
- [ ] QA Fase B + build

**SC:** 008–011

---

## Fase C — Dashboard gráficas + filtros

- [ ] Decidir librería charts (o SVG mínimo) y anotar en plan
- [ ] Filtro período: día | **semana** | mes en Rentabilidad
- [ ] Gráfica ingresos vs egresos
- [ ] Desglose gastos por categoría
- [ ] Serie margen/neto si hay datos
- [ ] Empty state sin movimientos
- [ ] Breadcrumb/menú label finanzas (SC-021)
- [ ] Opcional: mini KPIs en `/admin/inicio`
- [ ] QA Fase C + build

**SC:** 015–019, 021

---

## Fase D — Gastos tipificados (egresos existentes)

- [ ] Categorías egreso: `publicidad`, `proveedores`, `gasolina`, `operativo` (generales), `otro`
- [ ] UI diálogo + chips tabla + CSV
- [ ] **No** crear `/admin/gastos`
- [ ] QA Fase D + build

**SC:** 012–014

---

## Fase E (opcional)

- [ ] Al recibir OC: opt-in egreso `proveedores`
- [ ] Hints/copy ejemplos de negocio en UI

---

## Integración docs (post-aprobación)

- [ ] `specs/ROADMAP.md` — fila 022 alineada
- [ ] `specs/README.md` — índice
- [ ] `specs/memory/domain-context.md` — automatizaciones + categorías

---

## Testing

> **Quién ejecuta:** el agente (autónomo). Guía: `specs/templates/qa-validation-guide.md`  
> Marcar solo tras evidencia en sección exhaustiva.

- [ ] `npm run build` — por cada fase entregada
- [ ] Servidor `:4200` + smoke hubs tocados
- [ ] Cypress finanzas (+ inventario/baños/historiales si aplica)
- [ ] Flujo feliz: venta croquetas (A)
- [ ] Flujo feliz: baño tamaño→caja con margen (A)
- [ ] Flujo feliz: egreso gasolina visible en gráfica (C+D)
- [ ] Error: stock insuficiente no crea caja

**Resultado:** _pendiente — draft sin implementación de feature_

---

## Testing y validación exhaustiva

> Completar **antes** de marcar `[x]` de implementación y antes de `spec.md` → `done`.

### Checklist pre-entrega

- [ ] Guía QA completa aplicada
- [ ] `npm run build` OK y reportado
- [ ] Live preview :4200 + smoke
- [ ] Tabla resultados rellenada
- [ ] Chips / loading / Borrar / diálogos verificados

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | pendiente | |
| Formularios — tipos erróneos | pendiente | |
| Formularios — límites texto | pendiente | |
| UI — chips estado completos | pendiente | |
| Modales — apertura/cierre | pendiente | |
| UI — diálogos --picker | pendiente | |
| UI — timepicker | N/A previsto | |
| UI — retroalimentación | pendiente | |
| UI — loading contextual | pendiente | |
| UI — loading no trabado | pendiente | |
| UI — doble submit | pendiente | |
| Edge — red lenta/error | pendiente | |
| Edge — datos nulos RTDB | pendiente | |
| Automatización — no doble cobro/stock | pendiente | |
| Baño — tamaño default + override precio | pendiente | |
| Gráficas — filtros día/semana/mes | pendiente | |
| Servidor local :4200 + smoke | pendiente | |
| Build `npm run build` | pendiente | |

```
# Output build al cerrar cada fase
```

---

## Criterios spec (SC-xxx)

- [ ] SC-001 … SC-007b, SC-020 (Fase A)
- [ ] SC-008 … SC-011 (Fase B)
- [ ] SC-012 … SC-014 (Fase D)
- [ ] SC-015 … SC-021 (Fase C + descubrimiento)

---

## Cierre

- [ ] Validación pre-entrega completa (agente)
- [ ] `spec.md` → `done` solo con QA registrada
- [ ] Commit / deploy — solo si Luis lo pide
- [ ] **No** deploy Resend / CFDI en esta feature
