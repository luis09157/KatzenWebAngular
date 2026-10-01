# Tasks: Modularización POS sheets + pacientes (077)

**Spec:** `specs/077-modularizacion-pos-pacientes/spec.md`  
**Nivel de cambio:** L2

---

## Implementación

- [x] Spec 077 (`spec.md` / `tasks.md`)
- [x] `pos-sheet.util.ts` + `.spec.ts` — título, monto, qty, abrir/cerrar, escáner, delta
- [x] Cablear sheets en `visita-dialog.component.ts`
- [x] `paciente-fecha.util.ts` + `.spec.ts` — fecha, log, tiempo relativo, edad, info
- [x] `paciente-timeline.util.ts` + `.spec.ts` — icono/color actividad
- [x] Cablear `pacientes.component.ts` (wrappers delgados)
- [x] `module-map.md`; plan 075 fases; nota 076 oleada 3
- [x] `node scripts/specs-index.mjs`

### Auditoría regresiones 075/076 (antes de oleada 3)

| Chequeo | Resultado |
|---------|-----------|
| `npm run build` pre | OK exit 0 (Hash e2d8a9ed38924cc3) |
| `npm run test:ci` pre | **449 SUCCESS** |
| Imports `pos-copy` / wizard / bloqueo / login / fcm / formatMoneyMx | paths válidos |
| Wrappers `visita-dialog` getters → utils | OK (sin getters vs métodos rotos) |
| Bugs modularización encontrados | **Ninguno** |

---

## Validación (L2)

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| Unit utils nuevos | **OK** | 15/15 (pos-sheet, paciente-fecha, paciente-timeline) |
| `npm run test:ci` | **OK** | **464 SUCCESS** |
| `npm run lint` | **OK** | 0 errors / 579 warnings preexistentes |
| `npm run build` | **OK** | exit 0; Hash 78f504ec5632fa4b; budget warning preexistente |
| RTDB | N/A | |
| Smoke :4200 | **OK** (2026-10-01) | POS mostrador+cobro Efectivo/Recibí; expediente Oreon edad/timeline; 375/1280; capturas `/tmp/kz-077-smoke/`; **0** bugs modularización |

**LOC (aprox.):** `visita-dialog` 1910→1909 (lógica sheets → util); `pacientes` 1297→1154 (−143). Nuevos: `pos-sheet` 148, `paciente-fecha` 127, `paciente-timeline` 57.

### Smoke QA autorizado Luis (post 075–077)

- Auth/RTDB prod (`use*Emulator: false`); login staff vía Cypress env (sin secretos en logs).
- Re-smoke utils: 101 + 27 SUCCESS; `npm run build` exit 0. Sin fix de código.
- Registro breve (2026-10-01): smoke POS + expediente Oreon 375/1280 OK; **0** bugs de modularización; capturas `/tmp/kz-077-smoke/`.

### Código tocado / no duplicar (ref. 078)

- Extractos: `pos-sheet.util`, `paciente-fecha.util`, `paciente-timeline.util` — **reutilizar**, no reimplementar (guardrails anti-duplicación).

---

## Criterios spec

- [x] SC-001 pos-sheet
- [x] SC-002 semántica táctil (mismos flujos)
- [x] SC-003 pacientes utils
- [x] SC-004 module-map + 075/076
- [x] SC-005 lint/build/tests

---

## Cierre

- [x] Validación L2 + smoke QA registrados
- [x] Spec → done + INDEX
- [x] Siguiente proceso docs: **078** (specs vivas); oleada 4 modular solo si Luis pide
- [ ] Commit / deploy — **no** (Luis no autorizó)
