# Tasks: Modularización POS orquestación (079)

**Spec:** `specs/079-modularizacion-pos-orquestacion/spec.md`  
**Nivel de cambio:** L2

---

## Implementación

### Setup

- [x] Spec 079 (`spec.md` / `tasks.md`)
- [x] Anti-duplicación: no reabrir pos-wizard / bloqueo / sheet / copy / pago-mixto

### Frontend

- [x] `pos-orquestacion.util.ts` + `.spec.ts`
- [x] Cablear `guardar` / `confirmarCobro` en `visita-dialog.component.ts`
- [x] Tabs lazy expediente (`matTabContent`) — barato y seguro (fallback Baños ya existía)

---

## Código tocado / utils reutilizados / no duplicar

| Qué | Ruta / nota |
|-----|-------------|
| Nuevo | `src/app/visitas/pos-orquestacion.util.ts` (~276 LOC) + `.spec.ts` (~267 LOC, 14 tests) |
| Cableado | `src/app/visitas/visita-dialog.component.ts` (~1906 LOC) |
| Tabs lazy | `src/app/pacientes/pacientes.component.html` (`matTabContent` ×4) |
| Reutilizado | `pos-pago-mixto`, `visita-mostrador`, `VISITA_LINEA_A_CAJA` |
| No tocar | `pos-copy`, `pos-wizard`, `pos-bloqueo`, `pos-sheet` |

---

## Validación

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run build` (exit 0) | **OK** | exit 0 (2026-10-01) |
| Unit tests `pos-orquestacion` | **OK** | 14/14 SUCCESS |
| Subset visitas `**/*.spec.ts` | **OK** | 125/125 SUCCESS |
| Lint | **OK** | 0 errores en archivos tocados |
| Smoke POS / Nueva venta :4200 | **OK** | Puppeteer 1280: login → visitas → «Nueva venta» diálogo POS mostrador; capturas `/tmp/kz-079-smoke/`; 0 pageErrors |
| RTDB | N/A | |

```
ng test --include='**/pos-orquestacion.util.spec.ts' → 14 SUCCESS
ng test --include='**/visitas/**/*.spec.ts' → 125 SUCCESS
npm run build → exit 0
```

### Memoria actualizada (078)

- [x] `module-map.md` — orquestación fuera del diálogo; tabs lazy hechos
- [x] `agent-guardrails.md` — fila anti-duplicación `pos-orquestacion`
- [x] plan 075 / nota 077 «qué queda» / 078 P6
- [x] `node scripts/specs-index.mjs` (079 in_progress → done al cerrar)

### Oleada 5 (siguiente)

- Extraer `persistir` + `asegurarSalidasProducto` (kits/stock) a facade con deps.
- Sheets POS como componentes Angular hijos (UI) — solo si Luis pide.
