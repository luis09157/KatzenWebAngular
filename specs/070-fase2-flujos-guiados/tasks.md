# Tasks: Fase 2 — Flujos guiados

**Spec:** `specs/070-fase2-flujos-guiados/spec.md`  
**Nivel de cambio:** L2 (sin `plan.md`; kits reusan salidas existentes)

---

## Implementación

- [x] Verificar 2.0–2.2 en spec 065 (no reescribir)
- [x] `AltaRapidaDialog` + entradas dashboard / citas
- [x] Util kits BOM + POS `pushProducto` / `asegurarSalidasProducto`
- [x] Atender en citas + diálogo del día
- [x] Salida venta → POS con producto precargado
- [x] Validación L2 (lint / tests / build / smoke 375·1280)

---

## Validación

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run lint` (0 errores) | OK | 0 errors, 543 warnings preexistentes |
| Utils + `test:ci` | OK | 367 SUCCESS (incl. kit BOM + atender + helper) |
| `npm run build` (exit 0) | OK | exit 0 (budget warning 2.88 MB) |
| Smoke emulador 375 / 1280 | OK | `admin@katzen.test`; inicio → Llegó un paciente → 3 pasos → cita; citas empty + CTA; POS. Shots `/tmp/kz-070/` |

```
lint: 0 errors
test:ci: 367 SUCCESS
build: exit 0
smoke: SMOKE_OK 2026-09-04 emuladores 9099/9000
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 stepper 3 pasos
- [x] SC-002 abre diálogo existente + expediente
- [x] SC-003 entradas dashboard / citas
- [x] SC-004 kits: stock componentes + N salidas
- [x] SC-005 sin BOM → mensaje claro
- [x] SC-006 Atender / tooltip
- [x] SC-007 salida venta → POS
