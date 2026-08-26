# Tasks: Automatización costos / dashboard + baños por tamaño

**Spec:** `specs/022-automatizacion-costos-dashboard/spec.md`  
**Plan:** `specs/022-automatizacion-costos-dashboard/plan.md`  

---

## Implementación

### Setup / documentación

- [x] Carpeta `specs/022-automatizacion-costos-dashboard/` creada
- [x] `spec.md` con sección **Baños: defaults por tamaño + precio por registro + enlace finanzas**
- [x] `plan.md` con tabla campo|default|override|efecto + fases Config UI vs Fase A
- [x] Análisis Banios ↔ 014/018/021 en spec/plan
- [x] Cross-refs: 021, ROADMAP, README, domain-context
- [ ] Plan aprobado por Luis (código pendiente de OK)

### Config UI (pendiente de implementación)

- [ ] Modelo + servicio `DefaultsBanioPorTamano`
- [ ] UI catálogo 3 tamaños en finanzas
- [ ] Mocks
- [ ] Reglas RTDB si hace falta extensión

### Fase A — automatización enlace (pendiente)

- [ ] Campos aditivos en `Banio` + diálogo (tamaño, costo, precio sugerido, override)
- [ ] `precio_total` siempre editable por registro
- [ ] `registrarEnCaja` prellena costo/plantilla/monto
- [ ] Smoke Cypress baño→caja con margen

### Fase B — inventario (futuro, no MVP)

- [ ] Diseño disparador salida stock desde plantilla (solo tras OK Luis)
- [ ] No mezclar `ProductosPeluqueria` con inventario clínico sin decisión

---

## Testing

> **Quién ejecuta:** el agente. Guía: `specs/templates/qa-validation-guide.md`  
> **Ahora:** entrega solo docs → no aplica build/UI smoke de feature.

- [ ] `npm run build` — al implementar Config/Fase A
- [ ] Servidor `:4200` + smoke — al implementar UI
- [ ] Cypress baños/finanzas — al implementar

**Resultado:** _docs only — pendiente código_

---

## Testing y validación exhaustiva

### Checklist pre-entrega (código)

- [ ] Guía QA completa (cuando haya UI)
- [ ] `npm run build` OK
- [ ] Live preview :4200 + smoke
- [ ] Tabla resultados rellenada
- [ ] Chips / loading / diálogos verificados

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Docs 022 + cross-refs | OK | 2026-08-26 — sin UI |
| Config defaults tamaño | PENDIENTE | |
| Alta baño override + precio por registro | PENDIENTE | |
| Baño→caja con costoAsociado | PENDIENTE | |
| Build / :4200 | N/A | docs-only |

---

## Criterios spec (SC-xxx)

- [ ] SC-001 … SC-010 (Config + Fase A)
- [ ] SC-011 … SC-012 (documentados; implementación Fase B)

---

## Cierre

- [ ] Validación pre-entrega completa (tras código)
- [ ] `spec.md` → `done` solo con QA registrado
- [x] Commit docs 022 (+ push)
