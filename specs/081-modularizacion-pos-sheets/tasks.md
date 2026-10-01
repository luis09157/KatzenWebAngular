# Tasks: Modularización POS sheets componentes (081)

**Spec:** `specs/081-modularizacion-pos-sheets/spec.md`  
**Nivel de cambio:** L2

---

## Implementación

### Setup

- [x] Spec 081 (`spec.md` / `tasks.md`)
- [x] Anti-duplicación: reutilizar `pos-sheet.util` (**077**); no segundo facade

### Frontend

- [x] `pos-sheet-panel` (backdrop + aside + cerrar)
- [x] `pos-sheet-cantidad` (producto / línea)
- [x] `pos-sheet-scanner`
- [x] Cablear en `visita-dialog.component.html` + `VisitasDialogModule`
- [x] Sheet carrito como componente → **082**

---

## Código tocado / utils reutilizados / no duplicar

| Qué | Ruta / nota |
|-----|-------------|
| Nuevo | `pos-sheet-panel.component.ts/html` |
| Nuevo | `pos-sheet-cantidad.component.ts/html` + `.spec.ts` |
| Nuevo | `pos-sheet-scanner.component.ts/html` + `.spec.ts` |
| Cableado | `visita-dialog.component.html`, `visitas-dialog.module.ts` |
| Reutilizado | `pos-sheet.util` (**077**) — qty, snapshot, escáner match |
| Diferido | sheet **carrito** (lista + ± / quitar) sigue en HTML del diálogo |
| Estilos | siguen en `visita-dialog.component.scss` (sin cambio visual) |
| No tocar | `pos-orquestacion`, `pos-persistir`, cobro, copy |

---

## Validación

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run build` (exit 0) | **OK** | exit 0 (2026-10-01) |
| Unit tests sheet | **OK** | 9/9 (`pos-sheet*.spec.ts` + cantidad/scanner) |
| Lint | **OK** | 0 errores (`--quiet` archivos tocados) |
| Smoke POS / Nueva venta :4200 | **OK** | Chrome 1280: login → visitas → Nueva venta; sheet scanner monta `app-pos-sheet-panel` + `app-pos-sheet-scanner`; capturas `/tmp/kz-081-smoke/`; 0 pageErrors |
| RTDB | N/A | |

```
ng test --include='**/pos-sheet*.spec.ts' → 9 SUCCESS
npm run build → exit 0
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: panel + cantidad + scanner cableados; reutilizan `pos-sheet.util`
- [x] SC-002: sin cambio UX/negocio
- [x] SC-003: carrito diferido (inline) documentado
- [x] SC-004: build / tests / lint / smoke
- [x] SC-005: memoria + INDEX

---

## Memoria actualizada (specs vivas — 078)

- [x] `module-map.md`
- [x] `agent-guardrails.md` (fila sheets componentes)
- [x] plan 075 / 078 P6 / nota 080 «qué queda»
- [x] `node scripts/specs-index.mjs`
- [x] Este `tasks.md` con QA

### Qué queda

- Sheets UI POS cerrados en **082** (`pos-sheet-carrito`).
