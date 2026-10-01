# Tasks: Modularización POS sheet carrito (082)

**Spec:** `specs/082-modularizacion-pos-sheet-carrito/spec.md`  
**Nivel de cambio:** L2

---

## Implementación

### Setup

- [x] Spec 082 (`spec.md` / `tasks.md`)
- [x] Anti-duplicación: reutilizar `pos-sheet.util` (**077**) + `pos-sheet-panel` (**081**); no segundo facade

### Frontend

- [x] `pos-sheet-carrito` (lista Ticket + ± / quitar)
- [x] Cablear en `visita-dialog.component.html` + `VisitasDialogModule`
- [x] Getter `filasSheetCarrito` (presentacional; negocio en padre)
- [x] Hook smoke `data-testid="pos-abrir-carrito"` en botón **visible** de `pos-cart-bar` (fix 2026-10-01: se quitó el hook oculto / se restauró la barra sticky)

---

## Código tocado / utils reutilizados / no duplicar

| Qué | Ruta / nota |
|-----|-------------|
| Nuevo | `pos-sheet-carrito.component.ts/html` + `.spec.ts` |
| Cableado | `visita-dialog.component.html/ts`, `visitas-dialog.module.ts` |
| Reutilizado | `pos-sheet-panel` (**081**), `pos-sheet.util` (**077**) — abrir/cerrar modo carrito |
| Estilos | `visita-dialog.component.scss` — `pos-cart-bar` restaurada (móvil); panel lateral ≥721px |
| No tocar | `pos-orquestacion`, `pos-persistir`, cobro, copy, wizard |

---

## Fix regresión UX (2026-10-01)

**Problema:** oleada 082 dejó solo un hook oculto `data-testid="pos-abrir-carrito"`; recepción no veía control para abrir el ticket en móvil (side panel solo ≥721px).  
**Fix:** restaurar `pos-cart-bar` (arts + total → `abrirSheetCarrito()` + Cobrar), mismo look/comportamiento pre-sticky; `data-testid` en el botón visible. Cliente sigue en wizard. Sin spec 083 (fix corto).

---

## Validación

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run build` (exit 0) | **OK** | exit 0 (2026-10-01) |
| Unit tests sheet | **OK** | 11/11 (`pos-sheet*.spec.ts` incl. carrito) |
| Lint | **OK** | 0 errores |
| Smoke Nueva venta + abrir carrito :4200 | **OK** | Chrome 1280: login → visitas → Nueva venta → `[data-testid=pos-abrir-carrito]`; monta `app-pos-sheet-panel` + `app-pos-sheet-carrito` («Ticket» / «Sin artículos.»); `/tmp/kz-082-smoke/`; 0 pageErrors |
| Smoke fix `pos-cart-bar` visible | **OK** | 375: Nueva venta → `.pos-cart-bar` visible (0 arts / $0.00 + Cobrar) → click abre sheet Ticket / Sin artículos.; 1280: barra `display:none`, panel lateral `flex`; `/tmp/kz-083-cart-bar/`; lint 0 err; build exit 0 |
| RTDB | N/A | |

```
ng test --include='**/pos-sheet*.spec.ts' → 11 SUCCESS
npm run build → exit 0
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: carrito cableado; reutiliza panel + util
- [x] SC-002: sin cambio UX/negocio *(fix: restaura control visible de carrito que 082 había omitido)*
- [x] SC-003: build / tests / lint / smoke
- [x] SC-004: memoria + INDEX

---

## Memoria actualizada (specs vivas — 078)

- [x] `module-map.md`
- [x] `agent-guardrails.md` (fila sheet carrito)
- [x] `node scripts/specs-index.mjs`
- [x] Este `tasks.md` con QA
- [x] Nota en `081/tasks.md` (carrito → 082)
- [x] Nota fix regresión `pos-cart-bar` (2026-10-01)

---

## Deploy hosting (autorizado Luis — 2026-10-01)

- Commit live: `d2149be` (079–082 + fix carrito móvil)
- `npm run build` → exit 0 (Hash `10d87768a4e0ed5d`, `main.6882c5bd73c4e205.js`)
- `firebase deploy --only hosting` → https://katzen-a0e3e.web.app
- Release/version: `5a965cc69cf76f10` (FINALIZED); spec 063: `retainedReleaseCount=1`, borradas 7 versiones no live
- Probar (Cmd+Shift+R): Nueva venta móvil → barra carrito, sheets, cobro
