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
- [x] Hook smoke `data-testid="pos-abrir-carrito"` (oculto; sin UX visible — no hay botón sticky de carrito)

---

## Código tocado / utils reutilizados / no duplicar

| Qué | Ruta / nota |
|-----|-------------|
| Nuevo | `pos-sheet-carrito.component.ts/html` + `.spec.ts` |
| Cableado | `visita-dialog.component.html/ts`, `visitas-dialog.module.ts` |
| Reutilizado | `pos-sheet-panel` (**081**), `pos-sheet.util` (**077**) — abrir/cerrar modo carrito |
| Estilos | siguen en `visita-dialog.component.scss` (sin cambio visual) |
| No tocar | `pos-orquestacion`, `pos-persistir`, cobro, copy, wizard |

---

## Validación

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run build` (exit 0) | **OK** | exit 0 (2026-10-01) |
| Unit tests sheet | **OK** | 11/11 (`pos-sheet*.spec.ts` incl. carrito) |
| Lint | **OK** | 0 errores |
| Smoke Nueva venta + abrir carrito :4200 | **OK** | Chrome 1280: login → visitas → Nueva venta → `[data-testid=pos-abrir-carrito]`; monta `app-pos-sheet-panel` + `app-pos-sheet-carrito` («Ticket» / «Sin artículos.»); `/tmp/kz-082-smoke/`; 0 pageErrors |
| RTDB | N/A | |

```
ng test --include='**/pos-sheet*.spec.ts' → 11 SUCCESS
npm run build → exit 0
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: carrito cableado; reutiliza panel + util
- [x] SC-002: sin cambio UX/negocio
- [x] SC-003: build / tests / lint / smoke
- [x] SC-004: memoria + INDEX

---

## Memoria actualizada (specs vivas — 078)

- [x] `module-map.md`
- [x] `agent-guardrails.md` (fila sheet carrito)
- [x] `node scripts/specs-index.mjs`
- [x] Este `tasks.md` con QA
- [x] Nota en `081/tasks.md` (carrito → 082)
