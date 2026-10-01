# Tasks: UI/UX oleada de impacto

**Spec:** `specs/084-ui-ux-oleada-impacto/spec.md`  
**Nivel de cambio:** L2  

---

## Implementación

### Setup

- [x] Carpeta spec creada y alcance confirmado
- [x] Anti-duplicación: INDEX + guardrails (no segundo POS / empty-state / Swal paralelo)

### Frontend

- [x] Hoy: CTA + Atender móvil + empty sin citas
- [x] POS: sheet vacío + contraste sticky cart
- [x] Portal: empty + chips
- [x] Tablas: leyenda + hover
- [x] KatzenSwal en Hoy / POS listado / historiales
- [x] Login landing: focus + Escape + FAB oculto
- [x] POS catálogo responsive (US-7): columnas 1/2/3; CSS global overlay; nombre siempre visible; baños BACO clickeables (`productoDescuentaInventarioPos`)
- [x] Regla documentada en `docs/ADMIN-UI-ARCHITECTURE.md` (diálogos densos + regla 13) + lecciones en `spec.md` US-7

---

## Código tocado / utils reutilizados / no duplicar

| Qué | Ruta / nota |
|-----|-------------|
| Nuevo | `src/app/core/ui/katzen-swal.ts` (+ spec) |
| Stock POS | `core/utils/producto-search.util.ts` → `productoDescuentaInventarioPos` (BACO/EXAM/tarifas) |
| Persistencia | `visitas/pos-persistir.util.ts` — skip salida si no descuenta |
| Hoy | `dashboard.component.{html,css,ts}` |
| POS UI | `visita-dialog.{html,scss,ts}`, `pos-sheet-carrito.*`, CSS global `styles/admin-dialog.scss` (`.admin-dialog-panel--pos`) |
| Portal | `portal-mascotas.*`, `portal-mascota-detalle.html`, `portal-shell.scss` |
| Tablas | `productos/movimientos/proveedores` `showLegend`; `admin-table.scss` hover |
| Landing | `landing.component.{ts,html,css}` |
| Docs | `ADMIN-UI-ARCHITECTURE.md` § diálogos densos / regla 13 |
| No duplicar | No segundo Swal mixin; no `repeat(4,1fr)` POS; no `productoSinStock` ciego en tarifas |

---

## Validación

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run build` (exit 0) | **0** | budget warning preexistente (~2.95 MB); US-7 2026-10-01 |
| `ng lint` | **0 errores** | 576 warnings heredados (oleada 1) |
| Unit tests | **3/3 OK** | `katzen-swal` + `pos-sheet-carrito` |
| Smoke 375 / 1280 | parcial | Landing + US-7 POS (sesión Luis / capturas) |
| RTDB aditiva | N/A | sin datos |

```
US-7 fix 5 (2026-10-01): baños BACO estaban disabled (stock 0) → opacidad + no click. productoDescuentaInventarioPos; contraste fuerte; SC-017.
L1 (2026-10-01): botones MDC icono+texto centrados — empty-state ya no hereda 48px al + del CTA; alineación global admin/banner/diálogos. build exit 0; métrica Δ icono/label = 0 px en recordatorios.
commit/push/deploy: NO hasta Luis confirme y autorice hosting.
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 … SC-011 (oleada 1)
- [x] SC-012 … SC-013, SC-015 … SC-017
- [x] SC-014 (auditoría + fixes inventario/portal; residual hit-targets documentado)

---

## Auditoría SC-014 — reglas 084 en todo el sistema (2026-10-01)

| Área | Resultado | Acción |
|------|-----------|--------|
| POS `visita-dialog` | OK | Ya corregido US-7 (CSS global, BACO, nombre) |
| `productoSinStock` / picker | OK | Hereda `productoDescuentaInventarioPos` |
| Inventario productos grid | Fix | `aspect-ratio`+`max-height` → `height: 120px` |
| Portal `.portal-stats` | Fix | 1 col &lt;480 → 3 cols |
| `admin-kpi-grid` / `admin-crud` stats | OK | `@container admin-page` 1/2/4 |
| Inventario diálogos form/stats | OK | media 900/640 ya presentes |
| POS home tiles | OK | `@container` 1/2/3 |
| Citas / clientes / baños / finanzas grids densos | OK | sin `repeat(4+)` fijo problemático |
| Landing marketing grids | N/A admin | 4/6 cols con breakpoints propios; fuera de cobro |
| Hit targets &lt;44px (icon 32–36px) | Residual | Banners/row-actions; no bloquean POS táctil |

```
Auditoría SC-014 (2026-10-01): inventario media height + portal-stats; resto conforme o residual menor.
commit/push/deploy: NO hasta Luis autorice
```

---

## Memoria actualizada (specs vivas — 078)

- [x] `module-map.md` (`core/ui/katzen-swal`)
- [x] `agent-guardrails.md` (anti-dup Swal + grids densos POS)
- [x] `ADMIN-UI-ARCHITECTURE.md` (US-7)
- [x] `PLAN-UX-VETERINARIAS.md` nota oleada 084
- [x] `INDEX` regenerado (`in_progress` mientras SC-014 abierto)
- [x] Este `tasks.md` con QA parcial US-7

---

## Notas — Oleada 2 UI / follow-up SC-014

- Auditar otros mosaicos densos (pickers, tiles admin) con el mismo test 375/720/1280.
- Migrar resto de `Swal.fire` a `KatzenSwal`.
- Empty states con CTA en módulos secundarios.
- Smoke autenticado Hoy + POS «Nueva venta» con emulador o sesión Luis.

## Prohibido sin Luis

- git commit / push / firebase deploy
