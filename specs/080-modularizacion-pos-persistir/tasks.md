# Tasks: Modularización POS persistir / kits-stock (080)

**Spec:** `specs/080-modularizacion-pos-persistir/spec.md`  
**Nivel de cambio:** L2

---

## Implementación

### Setup

- [x] Spec 080 (`spec.md` / `tasks.md`)
- [x] Anti-duplicación: no reabrir pos-orquestacion / wizard / bloqueo / sheet / copy / kit-bom

### Frontend

- [x] `pos-persistir.util.ts` + `.spec.ts`
- [x] Cablear `persistir` en `visita-dialog.component.ts` (salidas vía util)

---

## Código tocado / utils reutilizados / no duplicar

| Qué | Ruta / nota |
|-----|-------------|
| Nuevo | `src/app/visitas/pos-persistir.util.ts` (~273 LOC) + `.spec.ts` (~343 LOC, 13 tests) |
| Cableado | `src/app/visitas/visita-dialog.component.ts` (~1838 LOC; −~68 vs 079) |
| Reutilizado | `pos-kit-bom`, `pos-catalogo-demo`, `visita-mostrador`, `hoyLocalIsoDate` |
| No tocar | `pos-orquestacion`, `pos-copy`, `pos-wizard`, `pos-bloqueo`, `pos-sheet` |

---

## Validación

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run build` (exit 0) | **OK** | exit 0 (2026-10-01) |
| Unit tests `pos-persistir` | **OK** | 13/13 SUCCESS |
| Subset visitas `**/*.spec.ts` | **OK** | 138/138 SUCCESS |
| Lint | **OK** | 0 errores en archivos tocados |
| Smoke POS / Nueva venta :4200 | **OK** | Chrome 1280: login → visitas → «Nueva venta» diálogo POS; capturas `/tmp/kz-080-smoke/`; 0 pageErrors |
| RTDB | N/A | |

```
ng test --include='**/pos-persistir.util.spec.ts' → 13 SUCCESS
ng test --include='**/visitas/**/*.spec.ts' → 138 SUCCESS
npm run build → exit 0
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: util + cableado
- [x] SC-002: sin cambio de negocio
- [x] SC-003: build / tests / lint
- [x] SC-004: smoke
- [x] SC-005: memoria + INDEX

---

## Memoria actualizada (specs vivas — 078)

- [x] `module-map.md`
- [x] `agent-guardrails.md` (anti-duplicación `pos-persistir`)
- [x] plan 075 / 078 P6 / nota 077 «qué queda» / 079 oleada 5
- [x] `node scripts/specs-index.mjs`
- [x] Este `tasks.md` con QA + tabla código tocado

### Qué queda (opcional)

- Sheets POS como componentes Angular hijos (UI) — solo si Luis pide.
